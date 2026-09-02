import ImportClient from "./ImportClient";

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">엑셀/CSV 일괄 업로드</h1>
        <p className="text-sm text-neutral-500 mt-1">
          기존 구글시트를 템플릿 형식으로 옮겨 담아 업로드하면 원물/제품을 한 번에 등록할 수 있습니다.
        </p>
      </div>
      <ImportClient />
    </div>
  );
}
