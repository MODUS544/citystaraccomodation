import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getLogoAttachment(): { filename: string; content: Buffer; cid: string; contentType: string } | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public/city-star-receipt-logo.jpg'),
    path.join(process.cwd(), 'apps/web/public/city-star-receipt-logo.jpg'),
    path.join(process.cwd(), 'public/city-star-logo-dark.jpg'),
    path.join(process.cwd(), 'apps/web/public/city-star-logo-dark.jpg'),
    '/Users/mac/City star accomodation /apps/web/public/city-star-receipt-logo.jpg',
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p);
        return {
          filename: 'city-star-logo.jpg',
          content: fileContent,
          cid: 'citystarlogo',
          contentType: 'image/jpeg',
        };
      }
    } catch {
      // Continue to next candidate
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingReference,
      guestName = 'Valued Guest',
      guestEmail,
      guestPhone = '—',
      roomName = 'Luxury Suite',
      roomNumber,
      checkInDate,
      checkOutDate,
      totalNights,
      totalAmount,
      paymentStatus = 'Reservation confirmed',
      specialRequests,
    } = body;

    const email = (guestEmail || '').trim().toLowerCase();

    // Check placeholder / invalid emails
    const isInvalid =
      !email ||
      email.endsWith('@test.com') ||
      email.includes('@test.') ||
      email.includes('example.') ||
      email.includes('@localhost') ||
      email.endsWith('.invalid') ||
      email.endsWith('.test') ||
      email.startsWith('walkin@') ||
      email.includes('guest@citystarhotel.com') ||
      !email.includes('@') ||
      !email.split('@')[1]?.includes('.');

    if (isInvalid) {
      console.log('[API send-reservation-email] Skipped dummy/placeholder email:', guestEmail);
      return NextResponse.json({
        success: false,
        message: 'Skipped delivery for placeholder or invalid email address.',
      });
    }

    const smtpUser = process.env.SMTP_USER || 'madambashir2@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'kwptdfrsinqwioyr';
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const fromAddress =
      process.env.SMTP_FROM || `"City Star Hotel & Accomodation" <${smtpUser}>`;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'madambashir2@gmail.com';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });

    const formattedAmount = typeof totalAmount === 'number'
      ? totalAmount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
      : isNaN(Number(totalAmount))
      ? String(totalAmount)
      : Number(totalAmount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });

    const logo = getLogoAttachment();
    const attachments = logo ? [logo] : [];

    const roomDisplay = roomNumber ? `${roomName} (Room ${roomNumber})` : roomName;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation Confirmation - City Star Hotel</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F4F5F7;
      margin: 0;
      padding: 28px 12px;
      color: #1E2538;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    .logo-header {
      padding: 38px 24px 12px 24px;
      text-align: center;
      background: #ffffff;
    }
    .logo-img {
      width: 105px;
      height: 105px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      border-radius: 12px;
    }
    .body-content {
      padding: 20px 32px 36px 32px;
    }
    .salutation {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .intro-text {
      font-size: 14.5px;
      color: #374151;
      line-height: 1.7;
      margin: 0 0 24px 0;
    }
    .ref-box {
      background: #F9FAFB;
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      padding: 18px;
      text-align: center;
      margin: 24px 0;
    }
    .ref-title {
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .ref-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 30px;
      font-weight: 900;
      color: #111827;
      letter-spacing: 4px;
      margin-top: 6px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .details-table td {
      padding: 12px 0;
      font-size: 14px;
      border-bottom: 1px solid #F3F4F6;
    }
    .col-label {
      color: #6B7280;
      width: 38%;
      font-weight: 600;
    }
    .col-val {
      color: #111827;
      font-weight: 700;
      text-align: right;
    }
    .total-row td {
      border-bottom: 2px solid #111827;
      padding-top: 16px;
      padding-bottom: 16px;
    }
    .total-row .col-label {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
    }
    .total-row .col-val {
      color: #111827;
      font-size: 18px;
      font-weight: 900;
    }
    .instructions-card {
      margin-top: 24px;
      background: #FFFBEB;
      border-left: 4px solid #D97706;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      font-size: 13.5px;
      line-height: 1.6;
      color: #92400E;
      font-weight: 600;
    }
    .signoff {
      margin-top: 28px;
      font-size: 14px;
      color: #4B5563;
      line-height: 1.6;
    }
    .footer {
      background: #F9FAFB;
      padding: 20px 24px;
      text-align: center;
      font-size: 11.5px;
      color: #9CA3AF;
      border-top: 1px solid #F3F4F6;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Clean Top Center City Star Logo (Zero green or color background) -->
    <div class="logo-header">
      <img class="logo-img" src="cid:citystarlogo" alt="City Star Hotel Logo" width="105" height="105" />
    </div>

    <div class="body-content">
      <div class="salutation">Dear ${guestName},</div>
      <p class="intro-text">
        We are honored to confirm your luxury reservation at City Star Hotel. We have reserved your suite and look forward to welcoming you to City Star Hotel.
      </p>

      <div class="ref-box">
        <div class="ref-title">YOUR OFFICIAL BOOKING REFERENCE</div>
        <div class="ref-code">${bookingReference}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="col-label">Guest Name:</td>
          <td class="col-val">${guestName}</td>
        </tr>
        <tr>
          <td class="col-label">Phone Number:</td>
          <td class="col-val">${guestPhone || '—'}</td>
        </tr>
        <tr>
          <td class="col-label">Email:</td>
          <td class="col-val">${email}</td>
        </tr>
        <tr>
          <td class="col-label">Suite / Category:</td>
          <td class="col-val">${roomDisplay}</td>
        </tr>
        <tr>
          <td class="col-label">Status:</td>
          <td class="col-val" style="color: #16A34A;">Reservation confirmed</td>
        </tr>
        <tr class="total-row">
          <td class="col-label">Total Amount:</td>
          <td class="col-val">${formattedAmount}</td>
        </tr>
      </table>

      <div class="instructions-card">
        • You can complete payment via the City Star Mobile App or at the front desk via POS, Cash, or Bank Transfer.
      </div>

      <div class="signoff">
        Warm regards,<br/>
        <strong style="color: #111827; font-size: 15px;">City Star Hotel & Accomodation</strong><br/>
        <span style="font-size: 12px; color: #6B7280;">Yerwa / Yerima Road, Maiduguri, Borno State, Nigeria</span>
      </div>
    </div>

    <div class="footer">
      Premier 5-Star Luxury Hospitality & Fine Dining in Maiduguri, Borno State<br/>
      &copy; 2026 City Star Hotel & Accomodation. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const plainText = `CITY STAR HOTEL & ACCOMODATION
MAIDUGURI • BORNO STATE •

Dear ${guestName},

We are honored to confirm your luxury reservation at City Star Hotel. We have reserved your suite and look forward to welcoming you to City Star Hotel.

YOUR OFFICIAL BOOKING REFERENCE
${bookingReference}

Guest Name:	${guestName}
Phone Number:	${guestPhone || '—'}
Email:	${email}
Suite / Category:	${roomDisplay}
Status:	Reservation confirmed
Total Amount:	${formattedAmount}

• You can complete payment via the City Star Mobile App or at the front desk via POS, Cash, or Bank Transfer.

Warm regards,
City Star Hotel & Accomodation
Maiduguri, Borno State, Nigeria`;

    // 1. Dispatch confirmation to customer
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: `Reservation Confirmed: ${bookingReference} - City Star Hotel & Accomodation`,
      html: htmlContent,
      text: plainText,
      attachments,
    });

    console.log(`[API send-reservation-email] Email delivered to customer ${email}. MessageId: ${info.messageId}`);

    // 2. Dispatch operational alert to hotel admin (non-blocking)
    if (adminEmail && adminEmail !== email) {
      transporter.sendMail({
        from: fromAddress,
        to: adminEmail,
        subject: `[NEW BOOKING] ${bookingReference} - ${guestName} - ${formattedAmount}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #F8FAFB;">
            <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <h2 style="color: #135846; margin-top: 0;">🔔 New Reservation Received</h2>
              <p><strong>Booking Reference:</strong> ${bookingReference}</p>
              <p><strong>Guest Name:</strong> ${guestName}</p>
              <p><strong>Guest Email:</strong> ${email}</p>
              <p><strong>Guest Phone:</strong> ${guestPhone || '—'}</p>
              <p><strong>Suite:</strong> ${roomDisplay}</p>
              <p><strong>Dates:</strong> ${checkInDate} to ${checkOutDate} (${totalNights || 1} nights)</p>
              <p><strong>Total Amount:</strong> ${formattedAmount}</p>
              ${specialRequests ? `<p><strong>Special Requests:</strong> ${specialRequests}</p>` : ''}
            </div>
          </div>
        `,
        text: `New Booking: ${bookingReference}\nGuest: ${guestName} (${email}, ${guestPhone})\nSuite: ${roomDisplay}\nAmount: ${formattedAmount}`,
      }).catch(err => console.warn('[API send-reservation-email] Admin alert notification error:', err.message));
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      deliveredTo: email,
    });
  } catch (err: any) {
    console.error('[API send-reservation-email] Error sending email:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to dispatch reservation confirmation email',
      },
      { status: 500 }
    );
  }
}
