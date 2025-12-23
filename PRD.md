# SpaceCloud 견적 요청 시스템 PRD

## 1. 프로젝트 개요

SpaceCloud 견적 요청 시스템은 **게스트-호스트-관리자** 3자 마켓플레이스 플랫폼입니다.

### 핵심 가치
- 게스트가 원하는 공간을 검색하고 견적을 요청
- 호스트가 맞춤형 견적서를 작성하여 제공
- 관리자가 전체 프로세스를 관리하고 호스트를 배정

### 핵심 플로우
```
공간 검색 → 견적 요청 → 호스트 배정 → 견적 작성 → 결제 → 예약 확정 → 정산
```

---

## 2. 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19 + Vite 7 |
| Routing | React Router 7 |
| Backend | Supabase (Auth, Database, Storage) |
| 결제 | Stripe |
| 이메일 | Resend |
| 데이터 소스 | Google Sheets (공간 정보 CSV) |
| 언어 | JavaScript (JSX) |

---

## 3. 사용자 유형

### 게스트 (비인증)
- 공간 검색 및 필터링
- 다중 공간 선택
- 견적 요청 제출
- 견적서 수신 및 결제

### 호스트 (Supabase Auth)
- 로그인/회원가입
- 배정된 견적 요청 확인
- 견적서 작성 및 제출
- 예약/정산 관리
- 견적 템플릿 설정

### 관리자 (Supabase Auth)
- 전체 견적 요청 관리
- 호스트 배정 (자동/수동)
- 상태 필터링 및 관리
- Stripe 결제 링크 관리
- 견적서 발송

---

## 4. 글로벌 정책

### 국가별 라우팅 구조

| 국가 | 라우팅 | 화폐 | 화폐 기호 | 면적 단위 |
|------|--------|------|-----------|-----------|
| Korea | `/host/korea` | KRW | ₩ | m² (제곱미터) |
| UK | `/host/uk` | GBP | £ | sq ft (제곱피트) |
| USA | `/host/usa` | USD | $ | sq ft (제곱피트) |
| Japan | `/host/japan` | JPY | ¥ | m² (제곱미터) |
| Canada | `/host/canada` | CAD | $ | sq ft (제곱피트) |

### 글로벌 설정 적용 범위

1. **호스트 견적서 작성**
   - 기본 화폐 단위 자동 선택
   - 가격 입력 시 해당 화폐 적용

2. **공간 면적 표시**
   - 국가별 기본 면적 단위 적용
   - m² ↔ sq ft 자동 변환 지원

3. **가격 표시 형식**
   - 천 단위 구분자 (한국: 1,000,000 / 영미권: 1,000,000)
   - 화폐 기호 위치 (KRW: 숫자 뒤 / USD,GBP: 숫자 앞)

### 국가별 설정 객체

```javascript
const COUNTRY_CONFIG = {
  korea: {
    currency: 'KRW',
    currencySymbol: '₩',
    areaUnit: 'm²',
    locale: 'ko-KR',
    currencyPosition: 'suffix' // 1,000,000원
  },
  uk: {
    currency: 'GBP',
    currencySymbol: '£',
    areaUnit: 'sq ft',
    locale: 'en-GB',
    currencyPosition: 'prefix' // £1,000
  },
  usa: {
    currency: 'USD',
    currencySymbol: '$',
    areaUnit: 'sq ft',
    locale: 'en-US',
    currencyPosition: 'prefix' // $1,000
  },
  japan: {
    currency: 'JPY',
    currencySymbol: '¥',
    areaUnit: 'm²',
    locale: 'ja-JP',
    currencyPosition: 'prefix' // ¥1,000
  },
  canada: {
    currency: 'CAD',
    currencySymbol: '$',
    areaUnit: 'sq ft',
    locale: 'en-CA',
    currencyPosition: 'prefix' // $1,000
  }
};
```

---

## 5. 핵심 기능

### 5.1 호스트 자동 연결 로직

#### 자동 연결 조건
```
selected_spaces.hostEmail === profiles.email
```

- **회원가입 완료 호스트**: 견적 요청의 `selected_spaces`에 포함된 `hostEmail`과 `profiles` 테이블의 `email`이 매칭되면 자동으로 해당 호스트에게 표시
- **미등록 호스트**: 관리자가 Admin 패널에서 수동으로 호스트 배정

#### 알림 이메일 자동 발송
견적 요청 제출 시 각 선택된 공간의 `hostEmail`로 알림 이메일 발송:
- 게스트 정보 (이메일, 연락처)
- 희망 날짜/시간
- 인원 수
- 특별 요청사항
- 호스트 대시보드 링크

### 5.2 견적 작성 기능

호스트가 작성하는 견적서 항목:
- 공간 사진 (Supabase Storage 업로드, 최대 5MB)
- 가격 (천 단위 자동 콤마 포맷)
- 화폐 단위 (KRW, USD, GBP, JPY, EUR)
- 가격 포함 내역 (텍스트)
- 결제 방식 선택

### 5.3 결제 방식

#### 현장결제 (Onsite)
```
호스트 견적 제출 → 게스트에게 즉시 이메일 발송 → 예약 확정 → 정산 스케줄 생성
```
- 호스트가 직접 견적 발송
- 즉시 예약 확정 처리
- 이용일 7일 후 정산 예정

#### 온라인결제 (Online)
```
호스트 견적 제출 → 관리자 확인 → Stripe 링크 추가 → 견적 발송 → 결제 완료 → 예약 확정
```
- 호스트 제출 시 `pending` 상태
- 관리자가 Stripe 결제 링크 추가
- 관리자가 게스트에게 견적 발송
- Stripe Webhook으로 결제 확인 시 자동 예약 확정

### 5.4 견적 템플릿

호스트가 자주 사용하는 설정을 템플릿으로 저장:
- 기본 공간 사진
- 기본 가격
- 기본 화폐 단위
- 기본 가격 포함 내역
- 기본 결제 방식

---

## 6. 데이터베이스 스키마

### quote_requests (견적 요청)
```sql
id              UUID PRIMARY KEY
email           VARCHAR         -- 게스트 이메일
phone           VARCHAR         -- 게스트 연락처
desired_date    DATE            -- 희망 날짜
desired_time    VARCHAR         -- 희망 시간
number_of_people INTEGER        -- 인원 수
requests        TEXT            -- 특별 요청사항
selected_spaces JSONB           -- 선택된 공간들 (hostEmail 포함)
status          VARCHAR         -- 상태
assigned_host_id UUID           -- 배정된 호스트 (FK: profiles.id)
admin_memo      TEXT            -- 관리자 메모
created_at      TIMESTAMP
```

### host_quotes (호스트 견적)
```sql
id               UUID PRIMARY KEY
quote_request_id UUID            -- FK: quote_requests.id
host_id          UUID            -- FK: auth.users.id
space_photo_url  VARCHAR         -- 공간 사진 URL
price            INTEGER         -- 가격
currency         VARCHAR         -- 화폐 (KRW, USD, GBP, JPY, EUR)
price_includes   TEXT            -- 가격 포함 내역
payment_method   VARCHAR         -- 결제 방식 (onsite, online)
status           VARCHAR         -- 상태 (pending, sent, approved)
stripe_link      VARCHAR         -- Stripe 결제 링크 (온라인결제 시)
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

### host_quote_templates (견적 템플릿)
```sql
host_id          UUID PRIMARY KEY  -- FK: auth.users.id
space_photo_url  VARCHAR
default_price    INTEGER
currency         VARCHAR
price_includes   TEXT
payment_method   VARCHAR
updated_at       TIMESTAMP
```

### bookings (예약)
```sql
id               UUID PRIMARY KEY
host_id          UUID            -- FK: auth.users.id
quote_request_id UUID            -- FK: quote_requests.id
host_quote_id    UUID            -- FK: host_quotes.id
status           VARCHAR         -- confirmed, cancelled, completed
booking_date     DATE
booking_time     VARCHAR
guest_email      VARCHAR
guest_count      INTEGER
total_amount     INTEGER
currency         VARCHAR
created_at       TIMESTAMP
```

### settlements (정산)
```sql
id              UUID PRIMARY KEY
host_id         UUID            -- FK: auth.users.id
booking_id      UUID            -- FK: bookings.id
amount          INTEGER
currency        VARCHAR
status          VARCHAR         -- pending, completed
scheduled_date  DATE            -- 예약일 + 7일
completed_date  DATE
created_at      TIMESTAMP
```

### profiles (호스트 프로필)
```sql
id          UUID PRIMARY KEY    -- FK: auth.users.id
email       VARCHAR
name        VARCHAR
created_at  TIMESTAMP
```

---

## 7. API 엔드포인트

### POST /api/send-email
**용도**: 호스트에게 견적 요청 알림 발송

```javascript
{
  to: "host@example.com",
  spaceName: "공간명",
  guestEmail: "guest@example.com",
  guestPhone: "010-1234-5678",
  desiredDate: "2025-01-15",
  desiredTime: "14:00",
  numberOfPeople: 20,
  guestRequests: "특별 요청사항",
  hostHomeUrl: "https://example.com/host/quotes"
}
```

### POST /api/send-quote
**용도**: 게스트에게 견적서 발송

```javascript
{
  guestEmail: "guest@example.com",
  spaceName: "공간명",
  spacePhotoUrl: "https://storage.supabase.co/...",
  price: 500000,
  currency: "KRW",
  priceIncludes: "대관료, 기본 장비 포함",
  paymentMethod: "online",
  stripeLink: "https://checkout.stripe.com/...",
  desiredDate: "2025-01-15",
  desiredTime: "14:00"
}
```

### POST /api/stripe-webhook
**용도**: Stripe 결제 완료 처리

- 이벤트: `checkout.session.completed`
- 처리:
  1. `stripe_link`로 `host_quotes` 조회
  2. `quote_requests.status` → `booking_confirmed`
  3. `bookings` 레코드 생성
  4. `settlements` 레코드 생성 (예약일 + 7일)

---

## 8. 사용자 워크플로우

### 게스트 플로우
```
1. 랜딩 페이지 (/) 접속
2. 국가 선택 (Korea, UK, USA, Japan, Canada)
3. 자연어 검색 또는 필터 사용
4. 원하는 공간들 선택 (다중 선택 가능)
5. "최종 견적 요청" 클릭 → /quote 이동
6. 견적 요청 폼 작성 (이메일, 연락처, 날짜, 시간, 인원, 요청사항)
7. 개인정보 동의 후 제출
8. 이메일로 견적서 수신
9. 결제 (현장 또는 온라인)
```

### 호스트 플로우 (자동 연결)
```
1. 회원가입 (이메일 = Google Sheets의 hostEmail)
2. 로그인 → /host/:country
3. /host/quotes에서 자동 매칭된 견적 요청 확인
4. 견적 요청 클릭 → /host/quote/:requestId
5. 견적서 작성 (사진, 가격, 결제 방식)
6. 제출 (현장결제: 즉시 발송 / 온라인결제: 관리자 대기)
7. /host/dashboard에서 예약/정산 확인
```

### 호스트 플로우 (수동 연결)
```
1. 관리자가 이메일로 견적 요청 알림 발송
2. 호스트 회원가입/로그인
3. 관리자가 Admin에서 호스트 배정
4. 이후 자동 연결 플로우와 동일
```

### 관리자 플로우
```
1. /admin/login 로그인
2. /admin에서 전체 견적 요청 목록 확인
3. 상태/결제방식 필터링
4. 호스트 배정 (드롭다운 선택)
5. 온라인결제 견적: Stripe 링크 추가 → 견적 발송
6. 메모 추가 및 상태 관리
```

---

## 9. 상태 관리

### 견적 요청 상태 (quote_requests.status)

| 상태 | 라벨 | 설명 |
|------|------|------|
| `waiting` | 대기 | 초기 상태, 호스트 미배정 |
| `in_progress` | 호스트 소통 진행 중 | 호스트 배정됨 또는 이메일 발송됨 |
| `rejected` | 호스트 거절 | 호스트가 거절 |
| `quote_registered` | 견적서 등록 완료 | 온라인결제 견적 등록됨 (관리자 대기) |
| `quote_sent` | 견적서 발송 완료 | 관리자가 견적 발송함 |
| `booking_confirmed` | 예약확정 | 결제 완료 또는 현장결제 확정 |

### 상태 전이 다이어그램
```
waiting
    ↓ (호스트 배정/이메일 발송)
in_progress
    ↓ (온라인결제 견적 제출)     ↓ (현장결제 견적 제출)
quote_registered              booking_confirmed
    ↓ (관리자 견적 발송)
quote_sent
    ↓ (Stripe 결제 완료)
booking_confirmed

* in_progress ↔ rejected (관리자 토글)
```

### 호스트 견적 상태 (host_quotes.status)

| 상태 | 설명 |
|------|------|
| `pending` | 온라인결제 견적, 관리자 대기 |
| `sent` | 견적 발송 완료 |
| `approved` | 게스트 승인 (결제 완료) |

### 예약 상태 (bookings.status)

| 상태 | 설명 |
|------|------|
| `confirmed` | 예약 확정 |
| `cancelled` | 예약 취소 |
| `completed` | 이용 완료 |

---

## 10. 라우팅 구조

### 현재 라우팅

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/` | SpaceSearch | 공간 검색 (랜딩) |
| `/quote` | QuoteRequestForm | 견적 요청 폼 |
| `/host` | HostHome | 호스트 홈 |
| `/host/quotes` | HostDashboard | 견적 관리 |
| `/host/dashboard` | HostBookings | 예약/정산 관리 |
| `/host/quote/:requestId` | HostQuoteForm | 견적서 작성 |
| `/admin` | Admin | 관리자 대시보드 |
| `/admin/login` | AdminLogin | 관리자 로그인 |
| `/admin/register` | AdminRegister | 관리자 회원가입 |

### 변경 라우팅 (글로벌 정책 적용)

| 경로 | 컴포넌트 | 설명 |
|------|----------|------|
| `/host` | HostHome | 호스트 홈 (기본, 리다이렉트) |
| `/host/:country` | HostHome | 국가별 호스트 홈 |
| `/host/:country/quotes` | HostDashboard | 국가별 견적 관리 |
| `/host/:country/dashboard` | HostBookings | 국가별 예약/정산 |
| `/host/:country/quote/:requestId` | HostQuoteForm | 국가별 견적서 작성 |

### URL 파라미터
- `:country` - korea, uk, usa, japan, canada
- `:requestId` - UUID (견적 요청 ID)

---

## 부록: 파일 구조

```
src/
├── components/
│   ├── Admin.jsx              # 관리자 대시보드
│   ├── AdminLogin.jsx         # 관리자 로그인
│   ├── AdminRegister.jsx      # 관리자 회원가입
│   ├── HostAuthModal.jsx      # 호스트 로그인/회원가입 모달
│   ├── HostBookings.jsx       # 예약/정산 관리
│   ├── HostDashboard.jsx      # 견적 관리
│   ├── HostHeader.jsx         # 호스트 헤더
│   ├── HostHome.jsx           # 호스트 홈
│   ├── HostQuoteForm.jsx      # 견적서 작성 폼
│   ├── QuoteRequestForm.jsx   # 견적 요청 폼
│   ├── SpaceCard.jsx          # 공간 카드
│   ├── SpaceSearch.jsx        # 공간 검색
│   └── TemplateSettingsModal.jsx # 템플릿 설정 모달
├── lib/
│   ├── supabase.js            # Supabase 클라이언트
│   ├── spaces.js              # 공간 데이터 fetch/filter
│   └── searchParser.js        # 자연어 검색 파서
├── App.jsx                    # 라우팅 설정
└── main.jsx                   # 엔트리포인트

api/
├── send-email.js              # 호스트 알림 이메일
├── send-quote.js              # 게스트 견적 이메일
└── stripe-webhook.js          # Stripe 결제 웹훅
```

---

*문서 최종 수정: 2025년 12월*
