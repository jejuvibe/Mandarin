# 제주 햇감귤 주문 관리 시스템 (Tangerine Order Manager)

산지직송 직거래 감귤 농가를 위한 올인원 주문·배송·고객 관리 웹 애플리케이션입니다.

---

## 🌟 주요 기능

1. **주문 관리 및 실시간 현황**
   - 발송완료, 성함, 연락처, 배송지 주소, 수량, 금액, 발송(예정)일, 발송현황, 메모 관리
   - 발송(예정)일 캘린더 빠른 선택 및 직접 입력
   - 주문접수 건만 골라 택배 접수용 양식 1줄 일괄 복사

2. **스마트 주문 문자·카톡 자동 파싱**
   - 고객이 카톡이나 문자로 보낸 자유 양식 주문서를 붙여넣기만 하면 성함, 전화번호, 주소, 5kg/10kg 수량을 자동 추출

3. **고객 주소록 (CRM)**
   - 주문 등록 시 고객 데이터 자동 누적
   - 누적 주문 횟수, 총 구매금액, 특이사항/메모 관리 및 주소 원클릭 복사

4. **단골 및 문의 고객용 맞춤 안내 문자**
   - 주문 전 고객 가격·계좌·발송 안내 문자 원클릭 복사 및 SMS 전송
   - 입금 계좌 안내, 발송 예정 안내, 배송 출발 안내 템플릿 지원

5. **시즌별 매출 및 순수익 자동 계산**
   - 12월~익년 2월 제주 감귤 시즌 자동 연계 정산
   - 10kg/5kg 박스비 및 택배비를 차감한 실제 순수익 실시간 집계

---

## 🚀 빠른 시작 방법 (Local Run)

### 1. 패키지 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 3. 배포용 빌드
```bash
npm run build
```

---

## 📦 새 GitHub 계정에 올리는 방법

1. **파일 다운로드/준비**: 본 프로젝트 폴더 내 모든 파일 준비 (`node_modules`, `dist` 제외)
2. **새 GitHub 저장소(Repository) 생성**: GitHub에서 새 리포지토리 생성 (예: `tangerine-order-manager`)
3. **로컬 터미널에서 깃 초기화 및 푸시**:
```bash
git init
git add .
git commit -m "feat: 제주 감귤 주문관리 초기 배포"
git branch -M main
git remote add origin https://github.com/<새로운-깃허브-아이디>/<저장소-이름>.git
git push -u origin main
```

---

## 🌐 깃허브 무료 웹 호스팅 (GitHub Pages) 바로 접속 설정

별도의 유료 호스팅이나 외부 서비스(Vercel, Netlify 등) 없이, **GitHub 자체 무료 호스팅 주소(`https://아이디.github.io/저장소이름/`)**로 스마트폰과 PC에서 바로 접속할 수 있습니다. 이미 모든 자동 빌드 및 배포 파일(`.github/workflows/deploy.yml` 및 `vite.config.ts`)이 완벽하게 세팅되어 있습니다.

### 설정 방법 (단 1번만 클릭):
1. 깃허브 저장소 페이지 상단의 **[Settings]** 탭 클릭
2. 좌측 메뉴에서 **[Pages]** 클릭
3. **Build and deployment** 항목의 **Source**를 `Deploy from a branch` 대신 **`GitHub Actions`** 로 선택!
4. 끝! 약 1~2분 뒤 상단에 **`https://<아이디>.github.io/<저장소이름>/`** 접속 링크가 생성되며, 이제 스마트폰과 컴퓨터 어디서든 이 주소로 바로 들어갈 수 있습니다.

---

## 🗄️ 데이터베이스(DB) 연결 가이드

현재 애플리케이션은 **브라우저 로컬 저장소(localStorage)**를 기본으로 사용하여 별도 서버나 DB 비용 없이도 새로고침 및 재방문 시 데이터가 안전하게 유지됩니다.

하지만 **여러 기기(스마트폰, 태블릿, PC)에서 동시 접속하거나 가족·직원과 실시간으로 데이터를 공유**하려면 클라우드 데이터베이스 연결이 필요합니다.

### 추천 DB 옵션:

1. **Supabase (추천 ⭐ 가장 쉽고 무료 티어 넉넉)**
   - 무료 PostgreSQL 데이터베이스 제공
   - 프론트엔드에서 API 키만 넣고 바로 `supabase.from('orders').select('*')` 형태로 CRUD 연동 가능

2. **Firebase Firestore (구글 클라우드)**
   - 모바일·웹 실시간 동기화 지원 (NoSQL)
   - 주문 상태 변경 시 모든 기기에서 즉각 반영

3. **연결 절차 요약**:
   1. Supabase (supabase.com) 또는 Firebase 콘솔에서 무료 프로젝트 생성
   2. `orders`, `customers`, `settings` 테이블(또는 컬렉션) 생성
   3. 프로젝트에 SDK 설치 (`npm install @supabase/supabase-js` 또는 `firebase`)
   4. 현재 `src/App.tsx`의 `localStorage` 읽기/쓰기 코드를 DB 비동기 fetch/insert 코드로 연결
   5. Vercel이나 Netlify에 깃허브 저장소를 연결하여 무료 호스팅 배포
