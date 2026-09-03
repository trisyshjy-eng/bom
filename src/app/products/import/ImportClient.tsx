"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { formatKRW, calcTotalPurchasePrice } from "@/lib/calc";
import {
  previewImport,
  commitImport,
  type ImportPreviewResult,
  type ImportCommitResult,
} from "./actions";

const initialPreview: ImportPreviewResult = { error: null, validRows: [], invalidRows: [] };

export default function ImportClient() {
  const [preview, previewAction, previewPending] = useActionState(previewImport, initialPreview);
  const [committing, startCommit] = useTransition();

  // commitState는 그것을 만든 preview 객체를 함께 들고 있다가,
  // 새 미리보기가 오면(참조가 바뀌면) 자연히 "낡은" 값으로 취급되어 화면에서 사라진다.
  const [commitState, setCommitState] = useState<{
    for: ImportPreviewResult;
    result: ImportCommitResult;
  } | null>(null);

  const commitResult = commitState?.for === preview ? commitState.result : null;
  const hasPreview = preview.validRows.length > 0 || preview.invalidRows.length > 0;

  const handleCommit = () => {
    startCommit(async () => {
      const result = await commitImport(preview.validRows);
      setCommitState({ for: preview, result });
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-neutral-900">1. 템플릿 다운로드</div>
            <p className="text-xs text-neutral-500 mt-1">
              카테고리/거래처/제품명/매입가 등 컬럼이 미리 채워진 양식입니다. 이 형식에 맞춰 데이터를 입력하세요.
            </p>
          </div>
          <Link
            href="/products/import/template"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 whitespace-nowrap"
          >
            템플릿 다운로드
          </Link>
        </div>

        <form action={previewAction} className="space-y-3 pt-2 border-t border-neutral-100">
          <div className="text-sm font-medium text-neutral-900">2. 작성한 파일 업로드</div>
          <div className="flex items-center gap-3">
            <input
              type="file"
              name="file"
              accept=".xlsx,.csv"
              required
              className="text-sm"
            />
            <button
              type="submit"
              disabled={previewPending}
              className="rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 disabled:opacity-50 whitespace-nowrap"
            >
              {previewPending ? "확인 중..." : "미리보기"}
            </button>
          </div>
          {preview.error && <p className="text-sm text-red-600">{preview.error}</p>}
        </form>
      </div>

      {hasPreview && !commitResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              정상 {preview.validRows.length}건 · 오류 {preview.invalidRows.length}건
            </div>
            {preview.validRows.length > 0 && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={committing}
                className="rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
              >
                {committing ? "가져오는 중..." : `정상 ${preview.validRows.length}건 가져오기`}
              </button>
            )}
          </div>

          {preview.invalidRows.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-red-700">
                    <th className="px-3 py-2 font-medium">행</th>
                    <th className="px-3 py-2 font-medium">제품명</th>
                    <th className="px-3 py-2 font-medium">오류</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.invalidRows.map((r) => (
                    <tr key={r.rowNumber} className="border-t border-red-100">
                      <td className="px-3 py-2">{r.rowNumber}</td>
                      <td className="px-3 py-2">{r.values.제품명 || "-"}</td>
                      <td className="px-3 py-2 text-red-700">{r.errors.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.validRows.length > 0 && (
            <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="px-3 py-2 font-medium">행</th>
                    <th className="px-3 py-2 font-medium">카테고리</th>
                    <th className="px-3 py-2 font-medium">거래처</th>
                    <th className="px-3 py-2 font-medium">제품명</th>
                    <th className="px-3 py-2 font-medium">구매유형</th>
                    <th className="px-3 py-2 font-medium text-right">매입가(1box)</th>
                    <th className="px-3 py-2 font-medium text-right">매입중량</th>
                    <th className="px-3 py-2 font-medium text-right">박스수량</th>
                    <th className="px-3 py-2 font-medium text-right">총매입가</th>
                    <th className="px-3 py-2 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.validRows.map((r) => (
                    <tr key={r.rowNumber} className="border-t border-neutral-100">
                      <td className="px-3 py-2">{r.rowNumber}</td>
                      <td className="px-3 py-2">{r.category_name}</td>
                      <td className="px-3 py-2">{r.supplier_name}</td>
                      <td className="px-3 py-2 font-medium">{r.product_name}</td>
                      <td className="px-3 py-2">
                        {r.purchase_type === "해외직구매" ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                            해외직구매
                          </span>
                        ) : (
                          "국내구매"
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {formatKRW(r.purchase_price)} 원
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {formatKRW(r.purchase_weight)} g
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {r.purchase_type === "국내구매" ? formatKRW(r.box_quantity) : "-"}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                        {formatKRW(calcTotalPurchasePrice(r.purchase_price, r.box_quantity))} 원
                      </td>
                      <td className="px-3 py-2">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {commitResult && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 space-y-3">
          <div className="text-sm font-medium text-neutral-900">
            가져오기 완료: 성공 {commitResult.successCount}건 · 실패 {commitResult.failedRows.length}건
          </div>
          {commitResult.failedRows.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {commitResult.failedRows.map((f) => (
                <li key={f.rowNumber}>
                  행 {f.rowNumber} ({f.productName}): {f.message}
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/products"
            className="inline-block rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800"
          >
            원물 목록으로 이동
          </Link>
        </div>
      )}
    </div>
  );
}
