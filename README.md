# 원물원가 관리 웹사이트

수산물/축산물/자체생산 소스류/매입 소스류/기타가공제품 등 원물 매입 원가를 관리하고,
매입가가 바뀔 때마다 이전 단가를 자동으로 이력에 쌓아 가격 변동 추이를 추적하는 내부용 웹앱입니다.

## 기술 스택

- Next.js (App Router) + TypeScript + TailwindCSS
- Supabase (PostgreSQL + Auth)

## 시작하기

### 1. Supabase 프로젝트 준비

1. [supabase.com](https://supabase.com) 에서 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/schema.sql` 내용을 실행해 테이블/트리거/RLS를 생성합니다.
   - `categories` 테이블에는 5개 카테고리가 기본으로 채워집니다.
3. Authentication > Users 메뉴에서 사내 사용자 계정을 이메일/비밀번호로 직접 생성합니다.
   (별도 회원가입 화면은 없습니다 — 소수 인원 내부용이므로 관리자가 계정을 만들어줍니다.)

### 2. 환경변수 설정

`.env.local.example` 을 `.env.local` 로 복사하고, Supabase 프로젝트의 URL/anon key를 채워 넣습니다.

```bash
cp .env.local.example .env.local
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다. 로그인하지 않은 사용자는 `/login` 으로 리다이렉트됩니다.

## 핵심 로직

- **자동 계산**: 보존중량 = 매입중량 × (수율/100), 100g당 원가 = 매입가 ÷ 보존중량 × 100.
  DB의 `products` 테이블에서 generated column으로 저장되며, 폼에서는 동일 로직(`src/lib/calc.ts`)으로
  실시간 미리보기를 보여줍니다.
- **단가 변동 이력 자동 적재**: `products.purchase_price` 가 변경되면 DB 트리거(`log_price_change`)가
  변경 전/후 값을 `price_history` 테이블에 자동으로 insert합니다. 애플리케이션 코드는 단순히
  `products` 를 update하기만 하면 됩니다.
- **카테고리별 라벨**: 데이터 구조는 단일 `products` 테이블로 통일하고, 화면 라벨만
  `src/lib/category-config.ts` 에서 카테고리별로 다르게 렌더링합니다.

## 현재 구현 범위 / 남은 작업

구현됨 (1~2순위 MVP):
- products/price_history 데이터 모델, 등록/수정, 자동계산, 이력 자동 적재
- 로그인(Supabase Auth), 카테고리 탭/필터/검색/정렬이 있는 목록
- 상세 페이지의 이력 테이블 + 단가 추이 그래프
- 기본 대시보드(카테고리별 집계, 최근 변동 Top 5, 최근 업데이트 목록)

아직 없음 (3순위, 필요 시 추가):
- 구글시트/엑셀 일괄 업로드 및 엑셀 내보내기
- 거래처 관리 전용 화면(현재는 등록 폼에서 신규 거래처를 바로 추가 가능)
- 관리자/조회자 역할 구분, 감사로그
