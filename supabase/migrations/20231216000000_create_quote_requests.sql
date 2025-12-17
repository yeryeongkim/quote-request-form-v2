CREATE TABLE IF NOT EXISTS quote_requests (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  desired_date DATE NOT NULL,
  desired_time TIME NOT NULL,
  number_of_people INTEGER NOT NULL,
  requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화 및 정책 설정
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT 가능 (견적 요청 제출)
CREATE POLICY "Anyone can insert" ON quote_requests
  FOR INSERT WITH CHECK (true);

-- 누구나 SELECT 가능 (관리자 페이지에서 조회)
CREATE POLICY "Anyone can select" ON quote_requests
  FOR SELECT USING (true);
