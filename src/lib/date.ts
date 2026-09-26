const KST_TIME_ZONE = "Asia/Seoul";

export function formatDateKST(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("ko-KR", { timeZone: KST_TIME_ZONE });
}

export function formatDateTimeKST(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("ko-KR", { timeZone: KST_TIME_ZONE });
}

export function currentYearKST(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: KST_TIME_ZONE, year: "numeric" }).format(
      new Date()
    )
  );
}
