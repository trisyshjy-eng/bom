"use server";

import { readSheet } from "read-excel-file/node";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/csv";
import {
  IMPORT_COLUMNS,
  validateRow,
  type ParsedImportRow,
  type ValidatedImportRow,
} from "@/lib/import-template";

export interface ImportPreviewResult {
  error: string | null;
  validRows: ValidatedImportRow[];
  invalidRows: { rowNumber: number; values: Record<string, string>; errors: string[] }[];
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

async function loadRows(buffer: Buffer, filename: string): Promise<string[][]> {
  if (filename.toLowerCase().endsWith(".csv")) {
    const text = buffer.toString("utf-8").replace(/^﻿/, "");
    return parseCsv(text);
  }
  const matrix = await readSheet(buffer);
  return matrix.map((row) => row.map(cellToString));
}

function parseRows(matrix: string[][]): ParsedImportRow[] {
  if (matrix.length === 0) return [];

  const headerRow = matrix[0];
  const columnIndexByField = new Map<string, number>();
  headerRow.forEach((headerText, colIndex) => {
    const column = IMPORT_COLUMNS.find((c) => c.header === headerText.trim());
    if (column) columnIndexByField.set(column.field, colIndex);
  });

  const rows: ParsedImportRow[] = [];

  for (let i = 1; i < matrix.length; i++) {
    const rowNumber = i + 1; // 1행은 헤더이므로 실제 시트 행 번호로 환산
    const rawRow = matrix[i];
    if (rawRow.length === 0) continue;

    const firstCell = (rawRow[0] ?? "").trim();
    if (firstCell.startsWith("#")) continue; // 안내 행 무시

    const get = (field: string) => {
      const idx = columnIndexByField.get(field);
      if (idx === undefined) return "";
      return (rawRow[idx] ?? "").trim();
    };

    const values = {
      category: get("category"),
      supplier: get("supplier"),
      product_name: get("product_name"),
      origin: get("origin"),
      spec: get("spec"),
      size: get("size"),
      grade: get("grade"),
      purchase_price: get("purchase_price"),
      purchase_weight: get("purchase_weight"),
      yield_rate: get("yield_rate"),
      status: get("status"),
    };

    const isEmpty = Object.values(values).every((v) => v === "");
    if (isEmpty) continue;

    rows.push({ rowNumber, errors: [], ...values });
  }

  return rows;
}

export async function previewImport(
  _prevState: ImportPreviewResult,
  formData: FormData
): Promise<ImportPreviewResult> {
  const empty: ImportPreviewResult = { error: null, validRows: [], invalidRows: [] };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...empty, error: "로그인이 필요합니다." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ...empty, error: "업로드할 파일을 선택하세요." };
  }

  const { data: categories } = await supabase.from("categories").select("name");
  const validCategoryNames = new Set((categories ?? []).map((c) => c.name));

  let matrix: string[][];
  try {
    const arrayBuffer = await file.arrayBuffer();
    matrix = await loadRows(Buffer.from(arrayBuffer), file.name);
  } catch {
    return { ...empty, error: "파일을 읽는 데 실패했습니다. 템플릿 형식(xlsx/csv)을 확인하세요." };
  }

  const rawRows = parseRows(matrix);
  if (rawRows.length === 0) {
    return { ...empty, error: "업로드할 데이터 행이 없습니다." };
  }

  const validRows: ValidatedImportRow[] = [];
  const invalidRows: ImportPreviewResult["invalidRows"] = [];

  for (const raw of rawRows) {
    const result = validateRow(raw, validCategoryNames);
    if (result.ok) {
      validRows.push(result.row);
    } else {
      invalidRows.push({
        rowNumber: raw.rowNumber,
        values: { 제품명: raw.product_name, 카테고리: raw.category },
        errors: result.errors,
      });
    }
  }

  return { error: null, validRows, invalidRows };
}

export interface ImportCommitResult {
  error: string | null;
  successCount: number;
  failedRows: { rowNumber: number; productName: string; message: string }[];
}

export async function commitImport(rows: ValidatedImportRow[]): Promise<ImportCommitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다.", successCount: 0, failedRows: [] };

  const editorLabel = user.user_metadata?.name ?? user.email ?? "알수없음";

  const { data: categories } = await supabase.from("categories").select("id, name");
  const categoryIdByName = new Map((categories ?? []).map((c) => [c.name, c.id]));

  const { data: suppliers } = await supabase.from("suppliers").select("id, name");
  const supplierIdByName = new Map((suppliers ?? []).map((s) => [s.name, s.id]));

  const failedRows: ImportCommitResult["failedRows"] = [];
  let successCount = 0;

  for (const row of rows) {
    const categoryId = categoryIdByName.get(row.category_name);
    if (!categoryId) {
      failedRows.push({
        rowNumber: row.rowNumber,
        productName: row.product_name,
        message: `카테고리 '${row.category_name}' 를 찾을 수 없습니다`,
      });
      continue;
    }

    let supplierId = supplierIdByName.get(row.supplier_name);
    if (!supplierId) {
      const { data: createdSupplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({ name: row.supplier_name })
        .select("id")
        .single();
      if (supplierError || !createdSupplier) {
        failedRows.push({
          rowNumber: row.rowNumber,
          productName: row.product_name,
          message: `거래처 '${row.supplier_name}' 생성 실패`,
        });
        continue;
      }
      supplierId = createdSupplier.id;
      supplierIdByName.set(row.supplier_name, supplierId);
    }

    const { error } = await supabase.from("products").insert({
      category_id: categoryId,
      supplier_id: supplierId,
      product_name: row.product_name,
      origin: row.origin,
      spec: row.spec,
      size: row.size,
      grade: row.grade,
      purchase_price: row.purchase_price,
      purchase_weight: row.purchase_weight,
      yield_rate: row.yield_rate,
      status: row.status,
      last_editor: editorLabel,
    });

    if (error) {
      failedRows.push({ rowNumber: row.rowNumber, productName: row.product_name, message: error.message });
    } else {
      successCount += 1;
    }
  }

  return { error: null, successCount, failedRows };
}
