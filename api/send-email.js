import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    to,
    spaceName,
    guestEmail,
    guestPhone,
    desiredDate,
    desiredTime,
    numberOfPeople,
    guestRequests,
    hostHomeUrl,
  } = req.body;

  if (!to || !spaceName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .info-box { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb; }
        .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #6b7280; width: 120px; }
        .info-value { color: #111827; }
        .cta-button { display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>새로운 견적 요청이 도착했습니다</h1>
        </div>
        <div class="content">
          <p>안녕하세요, <strong>${spaceName}</strong> 호스트님!</p>
          <p>게스트로부터 공간 예약 문의가 접수되었습니다. 아래 내용을 확인하시고 예약 가능 여부를 회신해 주세요.</p>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #7c3aed;">예약 요청 정보</h3>
            <div class="info-row">
              <span class="info-label">공간명</span>
              <span class="info-value">${spaceName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">희망 날짜</span>
              <span class="info-value">${desiredDate || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">희망 시간</span>
              <span class="info-value">${desiredTime || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">인원</span>
              <span class="info-value">${numberOfPeople || '-'}명</span>
            </div>
            ${guestRequests ? `
            <div class="info-row">
              <span class="info-label">요청사항</span>
              <span class="info-value">${guestRequests}</span>
            </div>
            ` : ''}
          </div>

          <div class="info-box">
            <h3 style="margin-top: 0; color: #7c3aed;">게스트 연락처</h3>
            <div class="info-row">
              <span class="info-label">이메일</span>
              <span class="info-value">${guestEmail || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">연락처</span>
              <span class="info-value">${guestPhone || '-'}</span>
            </div>
          </div>

          <p>호스트 페이지에서 예약 관리 및 상세 정보를 확인하실 수 있습니다.</p>

          <a href="${hostHomeUrl}" class="cta-button">호스트 홈 바로가기</a>
        </div>
        <div class="footer">
          <p>본 메일은 SpaceCloud에서 자동 발송되었습니다.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'SpaceCloud <onboarding@resend.dev>',
      to: [to],
      subject: `[SpaceCloud] ${spaceName} 공간에 새로운 견적 요청이 도착했습니다`,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
