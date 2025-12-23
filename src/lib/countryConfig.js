// 국가별 설정 상수
export const COUNTRY_CONFIG = {
  korea: {
    code: 'korea',
    name: '한국',
    nameEn: 'Korea',
    currency: 'KRW',
    currencySymbol: '₩',
    currencyName: '원',
    areaUnit: 'm²',
    areaUnitName: '제곱미터',
    locale: 'ko-KR',
    lang: 'ko',
    currencyPosition: 'suffix',
  },
  uk: {
    code: 'uk',
    name: '영국',
    nameEn: 'UK',
    currency: 'GBP',
    currencySymbol: '£',
    currencyName: 'GBP',
    areaUnit: 'sq ft',
    areaUnitName: 'square feet',
    locale: 'en-GB',
    lang: 'en',
    currencyPosition: 'prefix',
  },
  usa: {
    code: 'usa',
    name: '미국',
    nameEn: 'USA',
    currency: 'USD',
    currencySymbol: '$',
    currencyName: 'USD',
    areaUnit: 'sq ft',
    areaUnitName: 'square feet',
    locale: 'en-US',
    lang: 'en',
    currencyPosition: 'prefix',
  },
  japan: {
    code: 'japan',
    name: '일본',
    nameEn: 'Japan',
    currency: 'JPY',
    currencySymbol: '¥',
    currencyName: '円',
    areaUnit: 'm²',
    areaUnitName: '平方メートル',
    locale: 'ja-JP',
    lang: 'ja',
    currencyPosition: 'prefix',
  },
  canada: {
    code: 'canada',
    name: '캐나다',
    nameEn: 'Canada',
    currency: 'CAD',
    currencySymbol: '$',
    currencyName: 'CAD',
    areaUnit: 'sq ft',
    areaUnitName: 'square feet',
    locale: 'en-CA',
    lang: 'en',
    currencyPosition: 'prefix',
  },
};

// 다국어 번역
export const TRANSLATIONS = {
  ko: {
    // Header
    hostPortal: 'SpaceCloud Host',
    quoteManagement: '견적 요청 관리',
    bookingManagement: '예약/정산 관리',
    logout: '로그아웃',
    login: '로그인',

    // HostHome
    heroTitle: '게스트에게 견적서를 보내세요',
    heroDescription: 'SpaceCloud에서 공간을 검색한 게스트가 견적 요청을 보내면,\n호스트님께서 직접 견적서를 작성하여 회신할 수 있습니다.',
    featureRequestTitle: '견적 요청 확인',
    featureRequestDesc: '이메일로 게스트의 견적 요청을 받아보세요',
    featureWriteTitle: '견적서 작성',
    featureWriteDesc: '공간 이용료, 옵션 등 상세 견적을 작성하세요',
    featureSendTitle: '견적서 발송',
    featureSendDesc: '작성한 견적서를 게스트에게 바로 전달하세요',
    registerQuote: '견적서 등록하기',
    loginHint: '로그인 후 견적서를 등록할 수 있습니다',

    // HostDashboard
    quoteRequestManagement: '견적 요청 관리',
    templateSettings: '기본 견적서 설정',
    loading: '데이터를 불러오는 중...',
    authChecking: '인증 확인 중...',
    noAssignedRequests: '할당된 견적 요청이 없습니다',
    noAssignedRequestsDesc: '관리자가 견적 요청을 할당하면 여기에 표시됩니다.',
    guestEmail: '게스트 이메일',
    desiredDate: '희망 날짜',
    desiredTime: '희망 시간',
    numberOfPeople: '인원',
    peopleUnit: '명',
    specialRequests: '요청사항',
    viewQuote: '견적 확인',
    createQuote: '견적 등록하기',
    statusPending: '견적 대기',
    statusRegistered: '등록 완료',
    statusWaitingAdmin: '관리자 확인 중',
    statusSent: '발송 완료',
    statusApproved: '승인됨',

    // HostQuoteForm
    backToList: '← 견적 요청 관리',
    quoteFormTitle: '견적서 등록',
    sentQuoteTitle: '발송 완료된 견적서',
    quoteFormDesc: '게스트 요청에 대한 견적을 작성하세요.',
    sentQuoteDesc: '이미 게스트에게 발송된 견적서입니다.',
    loadTemplate: '템플릿 불러오기',
    loadingTemplate: '불러오는 중...',
    guestRequestInfo: '게스트 요청 정보',
    requestDate: '요청일',
    spacePhoto: '공간 사진',
    uploadPhoto: '사진 업로드',
    maxFileSize: '최대 5MB',
    delete: '삭제',
    quoteInfo: '견적 정보',
    quoteAmount: '견적 금액',
    currency: '통화',
    priceIncludes: '가격 포함 항목',
    priceIncludesPlaceholder: '예: 장소 대여, 음향 장비, 주차 2대 무료',
    paymentMethod: '결제 방식',
    onsitePayment: '현장결제',
    onsitePaymentDesc: '이용 당일 현장에서 결제',
    onlinePayment: '온라인결제',
    onlinePaymentDesc: '관리자가 결제 링크를 생성합니다',
    submitAndSend: '견적서 등록 및 발송',
    submitOnly: '견적서 등록',
    submitting: '발송 중...',
    saving: '저장 중...',
    onlinePaymentHint: '온라인결제 선택 시 관리자가 결제링크 추가 후 게스트에게 발송합니다.',
    alreadySent: '이 견적서는 이미 게스트에게 발송되었습니다.',
    enterQuoteAmount: '견적 금액을 입력해주세요.',
    fileSizeError: '파일 크기는 5MB 이하여야 합니다.',
    loadDataError: '데이터를 불러오는데 실패했습니다.',
    saveError: '견적 저장 중 오류가 발생했습니다.',
    accessDenied: '접근 권한이 없거나 존재하지 않는 요청입니다.',
    backToListBtn: '견적 요청 목록으로',
    loadTemplateError: '템플릿을 불러오는데 실패했습니다.',

    // HostBookings
    bookingStatus: '견적 예약 현황',
    confirmed: '예약확정',
    cancelled: '예약취소',
    completed: '이용완료',
    noBookings: '예약이 없습니다',
    guest: '게스트',
    usageTime: '이용 시간',
    amount: '금액',
    settlementStatus: '정산 현황',
    noSettlements: '정산 내역이 없습니다',
    settlementPending: '정산 예정',
    settlementCompleted: '정산완료',
    bookingDate: '예약일',

    // TemplateSettingsModal
    templateTitle: '기본 견적서 설정',
    templateDesc: '자주 사용하는 견적 정보를 미리 저장하세요.',
    defaultPrice: '기본 견적 금액',
    saveTemplate: '템플릿 저장',
    savingTemplate: '저장 중...',
    templateSaved: '템플릿이 저장되었습니다.',
    templateSaveError: '저장 중 오류가 발생했습니다.',

    // Service Fee
    serviceFee: '서비스 수수료',
    feePaidMessage: '수수료 결제가 완료되었습니다.',
    feeRequiredMessage: '현장결제 견적서를 게스트에게 발송하려면 먼저 서비스 수수료를 결제해주세요.',
    payFeeButton: '수수료 결제하기',
    feeRequiredHint: '수수료를 결제해야 견적서를 발송할 수 있습니다.',

    // Migration Banner & Modal
    migrationBannerTitle: '예약/결제 서비스도 이용해보세요!',
    migrationBannerDesc: '등록한 공간을 예약/결제 서비스에도 노출할 수 있습니다. 지금 신청하세요!',
    migrationModalTitle: '예약/결제 서비스 이관 신청',
    migrationModalDesc: '공간 정보를 이관하면 온라인 예약 및 결제를 받을 수 있습니다.',
    hostName: '호스트 이름',
    hostEmail: '이메일',
    hostPhone: '연락처',
    selectSpaces: '이관할 공간 선택',
    consentText: '공간 정보를 예약/결제 서비스로 이관하는 것에 동의합니다.',
    submitMigrationRequest: '신청하기',
    migrationRequestSuccess: '신청이 완료되었습니다. 관리자 확인 후 연락드리겠습니다.',
    migrationRequestError: '신청 중 오류가 발생했습니다.',
    noSpacesAvailable: '이관 가능한 공간이 없습니다.',
    alreadyRequested: '이미 신청이 접수되었습니다.',
    unnamedSpace: '이름 없는 공간',

    // Space Name
    spaceName: '공간명',
    spaceNamePlaceholder: '예: 강남 스튜디오 A',

    // Common
    required: '*',
    retry: '다시 시도',
  },
  en: {
    // Header
    hostPortal: 'SpaceCloud Host',
    quoteManagement: 'Quote Requests',
    bookingManagement: 'Bookings & Settlements',
    logout: 'Logout',
    login: 'Login',

    // HostHome
    heroTitle: 'Send quotes to guests',
    heroDescription: 'When guests search for spaces on SpaceCloud and request a quote,\nyou can write and send a detailed quote directly.',
    featureRequestTitle: 'Receive Requests',
    featureRequestDesc: 'Get quote requests from guests via email',
    featureWriteTitle: 'Write Quotes',
    featureWriteDesc: 'Create detailed quotes with pricing and options',
    featureSendTitle: 'Send Quotes',
    featureSendDesc: 'Deliver your quotes directly to guests',
    registerQuote: 'Create Quote',
    loginHint: 'Please log in to create quotes',

    // HostDashboard
    quoteRequestManagement: 'Quote Requests',
    templateSettings: 'Quote Template',
    loading: 'Loading...',
    authChecking: 'Checking authentication...',
    noAssignedRequests: 'No quote requests assigned',
    noAssignedRequestsDesc: 'Quote requests will appear here when assigned by admin.',
    guestEmail: 'Guest Email',
    desiredDate: 'Preferred Date',
    desiredTime: 'Preferred Time',
    numberOfPeople: 'Guests',
    peopleUnit: '',
    specialRequests: 'Special Requests',
    viewQuote: 'View Quote',
    createQuote: 'Create Quote',
    statusPending: 'Pending',
    statusRegistered: 'Registered',
    statusWaitingAdmin: 'Awaiting Admin',
    statusSent: 'Sent',
    statusApproved: 'Approved',

    // HostQuoteForm
    backToList: '← Quote Requests',
    quoteFormTitle: 'Create Quote',
    sentQuoteTitle: 'Quote Sent',
    quoteFormDesc: 'Create a quote for the guest request.',
    sentQuoteDesc: 'This quote has already been sent to the guest.',
    loadTemplate: 'Load Template',
    loadingTemplate: 'Loading...',
    guestRequestInfo: 'Guest Request Details',
    requestDate: 'Request Date',
    spacePhoto: 'Space Photo',
    uploadPhoto: 'Upload Photo',
    maxFileSize: 'Max 5MB',
    delete: 'Delete',
    quoteInfo: 'Quote Details',
    quoteAmount: 'Quote Amount',
    currency: 'Currency',
    priceIncludes: 'Price Includes',
    priceIncludesPlaceholder: 'e.g., Venue rental, sound equipment, 2 free parking spaces',
    paymentMethod: 'Payment Method',
    onsitePayment: 'On-site Payment',
    onsitePaymentDesc: 'Pay at the venue on the day',
    onlinePayment: 'Online Payment',
    onlinePaymentDesc: 'Admin will generate a payment link',
    submitAndSend: 'Submit & Send Quote',
    submitOnly: 'Submit Quote',
    submitting: 'Sending...',
    saving: 'Saving...',
    onlinePaymentHint: 'For online payment, admin will add a payment link and send to guest.',
    alreadySent: 'This quote has already been sent to the guest.',
    enterQuoteAmount: 'Please enter the quote amount.',
    fileSizeError: 'File size must be 5MB or less.',
    loadDataError: 'Failed to load data.',
    saveError: 'Error saving quote.',
    accessDenied: 'Access denied or request not found.',
    backToListBtn: 'Back to Quote Requests',
    loadTemplateError: 'Failed to load template.',

    // HostBookings
    bookingStatus: 'Booking Status',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
    noBookings: 'No bookings',
    guest: 'Guest',
    usageTime: 'Time',
    amount: 'Amount',
    settlementStatus: 'Settlement Status',
    noSettlements: 'No settlements',
    settlementPending: 'Pending',
    settlementCompleted: 'Completed',
    bookingDate: 'Booking Date',

    // TemplateSettingsModal
    templateTitle: 'Quote Template Settings',
    templateDesc: 'Save your frequently used quote information.',
    defaultPrice: 'Default Price',
    saveTemplate: 'Save Template',
    savingTemplate: 'Saving...',
    templateSaved: 'Template saved successfully.',
    templateSaveError: 'Error saving template.',

    // Service Fee
    serviceFee: 'Service Fee',
    feePaidMessage: 'Service fee has been paid.',
    feeRequiredMessage: 'Please pay the service fee before sending an on-site payment quote to the guest.',
    payFeeButton: 'Pay Service Fee',
    feeRequiredHint: 'You must pay the service fee to send the quote.',

    // Migration Banner & Modal
    migrationBannerTitle: 'Try our Booking & Payment Service!',
    migrationBannerDesc: 'Expose your registered spaces to booking & payment service. Apply now!',
    migrationModalTitle: 'Booking & Payment Service Migration',
    migrationModalDesc: 'Migrate your space data to accept online bookings and payments.',
    hostName: 'Host Name',
    hostEmail: 'Email',
    hostPhone: 'Phone',
    selectSpaces: 'Select Spaces to Migrate',
    consentText: 'I agree to migrate my space data to the booking & payment service.',
    submitMigrationRequest: 'Submit Request',
    migrationRequestSuccess: 'Your request has been submitted. We will contact you after review.',
    migrationRequestError: 'Error submitting request.',
    noSpacesAvailable: 'No spaces available for migration.',
    alreadyRequested: 'You already have a pending request.',
    unnamedSpace: 'Unnamed Space',

    // Space Name
    spaceName: 'Space Name',
    spaceNamePlaceholder: 'e.g., Gangnam Studio A',

    // Common
    required: '*',
    retry: 'Retry',
  },
  ja: {
    // Header
    hostPortal: 'SpaceCloud Host',
    quoteManagement: '見積依頼管理',
    bookingManagement: '予約・精算管理',
    logout: 'ログアウト',
    login: 'ログイン',

    // HostHome
    heroTitle: 'ゲストに見積書を送りましょう',
    heroDescription: 'SpaceCloudでスペースを検索したゲストが見積依頼を送ると、\nホストが直接見積書を作成して返信できます。',
    featureRequestTitle: '見積依頼確認',
    featureRequestDesc: 'メールでゲストの見積依頼を受け取りましょう',
    featureWriteTitle: '見積書作成',
    featureWriteDesc: 'スペース利用料、オプションなど詳細な見積を作成',
    featureSendTitle: '見積書送信',
    featureSendDesc: '作成した見積書をゲストに直接送信',
    registerQuote: '見積書を登録',
    loginHint: 'ログイン後に見積書を登録できます',

    // HostDashboard
    quoteRequestManagement: '見積依頼管理',
    templateSettings: '見積テンプレート設定',
    loading: 'データを読み込み中...',
    authChecking: '認証確認中...',
    noAssignedRequests: '割り当てられた見積依頼がありません',
    noAssignedRequestsDesc: '管理者が見積依頼を割り当てると、ここに表示されます。',
    guestEmail: 'ゲストメール',
    desiredDate: '希望日',
    desiredTime: '希望時間',
    numberOfPeople: '人数',
    peopleUnit: '名',
    specialRequests: 'リクエスト',
    viewQuote: '見積確認',
    createQuote: '見積作成',
    statusPending: '見積待ち',
    statusRegistered: '登録完了',
    statusWaitingAdmin: '管理者確認中',
    statusSent: '送信完了',
    statusApproved: '承認済み',

    // HostQuoteForm
    backToList: '← 見積依頼管理',
    quoteFormTitle: '見積書登録',
    sentQuoteTitle: '送信済み見積書',
    quoteFormDesc: 'ゲストリクエストに対する見積を作成してください。',
    sentQuoteDesc: 'この見積書は既にゲストに送信されています。',
    loadTemplate: 'テンプレート読込',
    loadingTemplate: '読み込み中...',
    guestRequestInfo: 'ゲストリクエスト情報',
    requestDate: '依頼日',
    spacePhoto: 'スペース写真',
    uploadPhoto: '写真アップロード',
    maxFileSize: '最大5MB',
    delete: '削除',
    quoteInfo: '見積情報',
    quoteAmount: '見積金額',
    currency: '通貨',
    priceIncludes: '料金に含まれるもの',
    priceIncludesPlaceholder: '例：会場レンタル、音響機器、駐車場2台無料',
    paymentMethod: '支払方法',
    onsitePayment: '現地払い',
    onsitePaymentDesc: '利用当日に現地で支払い',
    onlinePayment: 'オンライン決済',
    onlinePaymentDesc: '管理者が決済リンクを作成します',
    submitAndSend: '見積登録・送信',
    submitOnly: '見積登録',
    submitting: '送信中...',
    saving: '保存中...',
    onlinePaymentHint: 'オンライン決済の場合、管理者が決済リンクを追加後、ゲストに送信します。',
    alreadySent: 'この見積書は既にゲストに送信されています。',
    enterQuoteAmount: '見積金額を入力してください。',
    fileSizeError: 'ファイルサイズは5MB以下にしてください。',
    loadDataError: 'データの読み込みに失敗しました。',
    saveError: '見積の保存中にエラーが発生しました。',
    accessDenied: 'アクセス権限がないか、存在しないリクエストです。',
    backToListBtn: '見積依頼一覧へ',
    loadTemplateError: 'テンプレートの読み込みに失敗しました。',

    // HostBookings
    bookingStatus: '予約状況',
    confirmed: '予約確定',
    cancelled: '予約キャンセル',
    completed: '利用完了',
    noBookings: '予約がありません',
    guest: 'ゲスト',
    usageTime: '利用時間',
    amount: '金額',
    settlementStatus: '精算状況',
    noSettlements: '精算履歴がありません',
    settlementPending: '精算予定',
    settlementCompleted: '精算完了',
    bookingDate: '予約日',

    // TemplateSettingsModal
    templateTitle: '見積テンプレート設定',
    templateDesc: 'よく使う見積情報を事前に保存しましょう。',
    defaultPrice: 'デフォルト金額',
    saveTemplate: 'テンプレート保存',
    savingTemplate: '保存中...',
    templateSaved: 'テンプレートを保存しました。',
    templateSaveError: '保存中にエラーが発生しました。',

    // Service Fee
    serviceFee: 'サービス手数料',
    feePaidMessage: 'サービス手数料の支払いが完了しました。',
    feeRequiredMessage: '現地払いの見積書をゲストに送信するには、まずサービス手数料をお支払いください。',
    payFeeButton: '手数料を支払う',
    feeRequiredHint: '手数料を支払わないと見積書を送信できません。',

    // Migration Banner & Modal
    migrationBannerTitle: '予約・決済サービスもご利用ください！',
    migrationBannerDesc: '登録したスペースを予約・決済サービスにも公開できます。今すぐ申請！',
    migrationModalTitle: '予約・決済サービス移行申請',
    migrationModalDesc: 'スペース情報を移行すると、オンライン予約・決済を受け付けることができます。',
    hostName: 'ホスト名',
    hostEmail: 'メール',
    hostPhone: '電話番号',
    selectSpaces: '移行するスペースを選択',
    consentText: 'スペース情報を予約・決済サービスに移行することに同意します。',
    submitMigrationRequest: '申請する',
    migrationRequestSuccess: '申請が完了しました。確認後、ご連絡いたします。',
    migrationRequestError: '申請中にエラーが発生しました。',
    noSpacesAvailable: '移行可能なスペースがありません。',
    alreadyRequested: '既に申請が受け付けられています。',
    unnamedSpace: '名前のないスペース',

    // Space Name
    spaceName: 'スペース名',
    spaceNamePlaceholder: '例：江南スタジオA',

    // Common
    required: '*',
    retry: '再試行',
  },
};

// 기본 국가
export const DEFAULT_COUNTRY = 'korea';

// 유효한 국가 코드 목록
export const VALID_COUNTRIES = Object.keys(COUNTRY_CONFIG);

// 국가 설정 가져오기
export const getCountryConfig = (country) => {
  return COUNTRY_CONFIG[country] || COUNTRY_CONFIG[DEFAULT_COUNTRY];
};

// 국가 코드 유효성 검사
export const isValidCountry = (country) => {
  return VALID_COUNTRIES.includes(country);
};

// 번역 가져오기
export const getTranslation = (country) => {
  const config = getCountryConfig(country);
  return TRANSLATIONS[config.lang] || TRANSLATIONS.ko;
};

// 특정 키의 번역 가져오기
export const t = (country, key) => {
  const translations = getTranslation(country);
  return translations[key] || key;
};

// 가격 포맷팅
export const formatPrice = (amount, country) => {
  if (!amount && amount !== 0) return '-';

  const config = getCountryConfig(country);
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : amount;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    maximumFractionDigits: config.currency === 'JPY' || config.currency === 'KRW' ? 0 : 2,
  }).format(numAmount);
};

// 면적 포맷팅
export const formatArea = (area, country) => {
  if (!area && area !== 0) return '-';

  const config = getCountryConfig(country);
  const numArea = typeof area === 'string' ? parseFloat(area) : area;

  // m² -> sq ft 변환 (1 m² = 10.764 sq ft)
  const displayArea = config.areaUnit === 'sq ft' ? numArea * 10.764 : numArea;

  return `${displayArea.toLocaleString(config.locale, { maximumFractionDigits: 1 })} ${config.areaUnit}`;
};

// 숫자 천 단위 콤마 포맷팅 (입력용)
export const formatNumberWithCommas = (value, locale = 'ko-KR') => {
  if (!value && value !== 0) return '';
  const numValue = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : String(value);
  return parseInt(numValue || 0).toLocaleString(locale);
};

// 날짜 포맷팅
export const formatDate = (dateString, country) => {
  if (!dateString) return '-';
  const config = getCountryConfig(country);
  const date = new Date(dateString);
  return date.toLocaleDateString(config.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
