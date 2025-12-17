import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    guestEmail,
    spaceName,
    spacePhotoUrl,
    price,
    currency,
    priceIncludes,
    paymentMethod,
    stripeLink,
    desiredDate,
    desiredTime,
  } = req.body;

  if (!guestEmail || !spaceName || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const currencySymbols = {
    KRW: '원',
    USD: '$',
    GBP: '£',
    JPY: '¥',
    EUR: '€',
  };

  const currencySymbol = currencySymbols[currency] || currency;
  const formattedPrice = currency === 'KRW' ? `${price}${currencySymbol}` : `${currencySymbol}${price}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
        .space-photo { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
        .quote-box { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; }
        .price { font-size: 36px; font-weight: 700; color: #7c3aed; margin-bottom: 8px; }
        .space-name { font-size: 18px; color: #4b5563; }
        .info-box { background: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
        .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #6b7280; width: 100px; flex-shrink: 0; }
        .info-value { color: #111827; }
        .includes-box { background: #f0fdf4; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bbf7d0; }
        .includes-box h4 { margin: 0 0 8px 0; color: #16a34a; font-size: 14px; }
        .includes-box p { margin: 0; color: #166534; font-size: 14px; white-space: pre-wrap; }
        .payment-button { display: block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; margin: 24px 0; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.3); }
        .payment-note { background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #fde68a; }
        .payment-note h4 { margin: 0 0 8px 0; color: #d97706; font-size: 14px; }
        .payment-note p { margin: 0; color: #92400e; font-size: 14px; }
        .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; border-radius: 0 0 12px 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>공간 견적서가 도착했습니다</h1>
        </div>
        <div class="content">
          ${spacePhotoUrl ? `<img src="${spacePhotoUrl}" alt="공간 사진" class="space-photo" />` : ''}

          <div class="quote-box">
            <div class="price">${formattedPrice}</div>
            <div class="space-name">${spaceName}</div>
          </div>

          <div class="info-box">
            <div class="info-row">
              <span class="info-label">이용 날짜</span>
              <span class="info-value">${desiredDate || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">이용 시간</span>
              <span class="info-value">${desiredTime || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">결제 방식</span>
              <span class="info-value">${paymentMethod === 'online' ? '온라인 결제' : '현장 결제'}</span>
            </div>
          </div>

          ${priceIncludes ? `
          <div class="includes-box">
            <h4>가격 포함 항목</h4>
            <p>${priceIncludes}</p>
          </div>
          ` : ''}

          ${paymentMethod === 'online' && stripeLink ? `
          <a href="${stripeLink}" class="payment-button">온라인 결제하기</a>
          ` : ''}

          ${paymentMethod === 'onsite' ? `
          <div class="payment-note">
            <h4>현장 결제 안내</h4>
            <p>이용 당일 현장에서 결제해 주세요. 결제 방법은 호스트에게 문의해 주세요.</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px;">
            궁금한 점이 있으시면 언제든지 문의해 주세요.
          </p>
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
      to: [guestEmail],
      subject: `[SpaceCloud] ${spaceName} 공간 견적서가 도착했습니다`,
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
