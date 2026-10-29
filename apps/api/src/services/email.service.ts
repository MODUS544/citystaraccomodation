import nodemailer, { Transporter } from 'nodemailer';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { dbPool } from '../config/database';

function getLogoAttachment(): { filename: string; path: string; cid: string } | null {
  const candidates = [
    path.resolve(__dirname, '../assets/city-star-logo.jpg'),
    path.resolve(__dirname, '../../assets/city-star-logo.jpg'),
    path.resolve(__dirname, '../../../web/public/city-star-receipt-logo.jpg'),
    path.resolve(process.cwd(), 'apps/api/src/assets/city-star-logo.jpg'),
    path.resolve(process.cwd(), 'apps/api/dist/assets/city-star-logo.jpg'),
    path.resolve(process.cwd(), 'apps/web/public/city-star-receipt-logo.jpg'),
    '/Users/mac/City star accomodation /apps/api/src/assets/city-star-logo.jpg',
    '/Users/mac/City star accomodation /apps/web/public/city-star-receipt-logo.jpg',
  ];

  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        return {
          filename: 'city-star-logo.jpg',
          path: c,
          cid: 'citystarlogo',
        };
      }
    } catch {}
  }
  return null;
}

/**
 * Interface representing booking details for email notifications
 */
export interface BookingEmailData {
  bookingReference: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  roomName: string;
  roomNumber?: string;
  floor?: number | string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  totalAmount: number | string;
  paymentStatus?: string;
  specialRequests?: string | null;
}

class EmailService {
  private resendClient: Resend | null = null;
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private provider: 'resend' | 'smtp' | 'none' = 'none';
  private fromAddress: string = env.SMTP_FROM;
  private adminEmail: string = env.ADMIN_NOTIFICATION_EMAIL;

  constructor() {
    this.initProviders();
  }

  private initProviders(): void {
    if (env.RESEND_API_KEY) {
      try {
        this.resendClient = new Resend(env.RESEND_API_KEY);
        this.isConfigured = true;
        this.provider = 'resend';
        console.log('[EmailService] Resend SDK initialized as primary delivery provider.');
        return;
      } catch (err) {
        console.warn('[EmailService] Failed to initialize Resend client:', err);
      }
    }

    if (env.SMTP_USER && env.SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.isConfigured = true;
        this.provider = 'smtp';
        this.fromAddress = env.SMTP_FROM;
        this.adminEmail = env.ADMIN_NOTIFICATION_EMAIL;
        console.log(`[EmailService] SMTP transporter configured for ${env.SMTP_USER} via ${env.SMTP_HOST}:${env.SMTP_PORT}`);
        return;
      } catch (err) {
        console.warn('[EmailService] Failed to initialize SMTP transporter:', err);
      }
    }

    this.isConfigured = false;
    this.provider = 'none';
  }

  /**
   * Lazily ensure transporter is initialized (including database site_settings fallback for cloud deploys)
   */
  public async ensureTransporter(): Promise<boolean> {
    if (this.isConfigured && (this.transporter || this.resendClient)) {
      return true;
    }

    // Try re-checking env in case it changed
    this.initProviders();
    if (this.isConfigured) return true;

    // Check PostgreSQL public.site_settings for persisted credentials
    try {
      const dbRes = await dbPool.query("SELECT value FROM public.site_settings WHERE key = 'smtp_config' LIMIT 1");
      if (dbRes.rows.length > 0 && dbRes.rows[0].value) {
        const conf = dbRes.rows[0].value;
        if (conf.user && conf.pass) {
          this.transporter = nodemailer.createTransport({
            host: conf.host || 'smtp.gmail.com',
            port: Number(conf.port) || 465,
            secure: Number(conf.port) === 465 || conf.secure !== false,
            auth: {
              user: conf.user,
              pass: conf.pass,
            },
            tls: { rejectUnauthorized: false },
          });
          this.isConfigured = true;
          this.provider = 'smtp';
          this.fromAddress = conf.from || `"City Star Hotel & Accomodation" <${conf.user}>`;
          this.adminEmail = conf.adminEmail || conf.user;
          console.log(`[EmailService] Successfully loaded SMTP credentials from database site_settings for ${conf.user}!`);
          return true;
        }
      }
    } catch (dbErr) {
      console.warn('[EmailService] Failed to query smtp_config from database:', dbErr);
    }

    return false;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      provider: this.provider,
      hasResendApiKey: Boolean(env.RESEND_API_KEY),
      resendKeyPrefix: env.RESEND_API_KEY ? `${env.RESEND_API_KEY.slice(0, 5)}***` : null,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER ? `${env.SMTP_USER.slice(0, 3)}***@${env.SMTP_USER.split('@')[1] || ''}` : 'Not Set',
      from: env.SMTP_FROM,
      adminRecipient: env.ADMIN_NOTIFICATION_EMAIL,
    };
  }

  /**
   * Dispatches a 5-star Luxury Reservation Confirmation to the Guest
   */
  public async sendGuestConfirmation(data: BookingEmailData): Promise<boolean> {
    const email = (data.guestEmail || '').trim().toLowerCase();
    const isPlaceholder =
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

    if (isPlaceholder) {
      console.log(`[EmailService] Skipping guest email for placeholder/test address: ${data.guestEmail}`);
      return false;
    }

    const formattedAmount = Number(data.totalAmount).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });

    const logoAttachment = getLogoAttachment();
    const attachments = logoAttachment ? [logoAttachment] : [];

    const roomDisplay = data.roomNumber
      ? `${data.roomName} (Room ${data.roomNumber})`
      : data.roomName;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation Confirmation - City Star Hotel & Accomodation</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0B1E19;
      margin: 0;
      padding: 24px 12px;
      color: #1E2538;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 12px 35px rgba(0,0,0,0.35);
    }
    .header {
      background: linear-gradient(135deg, #071310 0%, #0E2922 50%, #135846 100%);
      padding: 36px 24px 28px 24px;
      text-align: center;
      border-bottom: 3px solid #D4AF37;
    }
    .logo-container {
      width: 105px;
      height: 105px;
      margin: 0 auto 16px auto;
      border-radius: 18px;
      overflow: hidden;
      border: 2px solid #D4AF37;
      background: #0A101D;
      box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    }
    .logo-img {
      width: 105px;
      height: 105px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .title {
      color: #D4AF37;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
      line-height: 1.25;
      text-align: center;
    }
    .sub-title {
      color: #E2E8F0;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 8px;
      font-weight: 600;
      opacity: 0.95;
      text-align: center;
    }
    .body-content {
      padding: 32px 28px;
    }
    .salutation {
      font-size: 16px;
      font-weight: 700;
      color: #135846;
      margin-bottom: 12px;
    }
    .intro-text {
      font-size: 14.5px;
      color: #374151;
      line-height: 1.7;
      margin: 0 0 20px 0;
    }
    .ref-box {
      background: #F4F8F6;
      border: 2px dashed #135846;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      margin: 24px 0;
    }
    .ref-title {
      font-size: 11px;
      font-weight: 700;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .ref-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: 900;
      color: #135846;
      letter-spacing: 4px;
      margin-top: 4px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 22px 0;
    }
    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
      font-size: 14px;
    }
    .details-table td.col-label {
      color: #6B7280;
      font-weight: 600;
      width: 40%;
    }
    .details-table td.col-val {
      color: #111827;
      font-weight: 700;
      text-align: right;
    }
    .total-row td {
      border-bottom: 2px solid #135846;
      padding: 14px 0;
    }
    .total-row td.col-label {
      font-size: 15px;
      font-weight: 800;
      color: #135846;
    }
    .total-row td.col-val {
      font-size: 18px;
      font-weight: 800;
      color: #135846;
    }
    .instructions-card {
      background: #FFFDF9;
      border-left: 4px solid #D4AF37;
      padding: 16px;
      border-radius: 6px;
      margin: 24px 0 20px 0;
      font-size: 13.5px;
      color: #374151;
      line-height: 1.65;
    }
    .signoff {
      margin-top: 28px;
      font-size: 14px;
      color: #4B5563;
      line-height: 1.6;
    }
    .footer {
      background: #F9FAFB;
      padding: 22px;
      text-align: center;
      font-size: 11.5px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <!-- Top Center City Star Logo -->
      <div class="logo-container">
        <img class="logo-img" src="cid:citystarlogo" alt="City Star Hotel Logo" />
      </div>
      <h1 class="title">CITY STAR HOTEL & ACCOMODATION</h1>
      <div class="sub-title">MAIDUGURI • BORNO STATE •</div>
    </div>

    <div class="body-content">
      <div class="salutation">Dear ${data.guestName},</div>
      <p class="intro-text">
        We are honored to confirm your luxury reservation at City Star restaurants & accomodation. We have reserved your suite and look forward to welcoming you to City Star Hotel
      </p>

      <div class="ref-box">
        <div class="ref-title">YOUR OFFICIAL BOOKING REFERENCE</div>
        <div class="ref-code">${data.bookingReference}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="col-label">Guest Name:</td>
          <td class="col-val">${data.guestName}</td>
        </tr>
        <tr>
          <td class="col-label">Phone Number:</td>
          <td class="col-val">${data.guestPhone || '—'}</td>
        </tr>
        <tr>
          <td class="col-label">Suite / Category:</td>
          <td class="col-val">${roomDisplay}</td>
        </tr>
        <tr>
          <td class="col-label">Status:</td>
          <td class="col-val" style="color: #135846;">Reservation confirmed</td>
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
        <strong style="color: #135846; font-size: 15px;">City Star Hotel & Accomodation</strong><br/>
        <span style="font-size: 12px; color: #6B7280;">Yerwa / Yerima Road, Maiduguri, Borno State, Nigeria</span>
      </div>
    </div>

    <div class="footer">
      Premier 5-Star Luxury Hospitality & Fine Dining in the Kanem-Borno Heart<br/>
      &copy; 2026 City Star Hotel & Accomodation. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;

    const plainText = `CITY STAR HOTEL & ACCOMODATION
MAIDUGURI • BORNO STATE •

Dear ${data.guestName},

We are honored to confirm your luxury reservation at City Star restaurants & accomodation. We have reserved your suite and look forward to welcoming you to City Star Hotel 

YOUR OFFICIAL BOOKING REFERENCE
${data.bookingReference}

Guest Name:	${data.guestName}
Phone Number:	${data.guestPhone || '—'}
Suite / Category:	${roomDisplay}
Status:	Reservation confirmed
Total Amount:	${formattedAmount}

• You can complete payment via the City Star Mobile App or at the front desk via POS, Cash, or Bank Transfer.

Warm regards,
City Star Hotel & Accomodation
Maiduguri, Borno State, Nigeria`;

    return this.sendMail({
      to: data.guestEmail,
      subject: `Reservation Confirmed: ${data.bookingReference} - City Star Hotel & Accomodation`,
      html: htmlContent,
      text: plainText,
      attachments,
    });
  }

  /**
   * Dispatches an Instant Operational Alert to Hotel Management / Admin
   */
  public async sendAdminAlert(data: BookingEmailData): Promise<boolean> {
    const adminEmail = env.ADMIN_NOTIFICATION_EMAIL || 'talbashtech@gmail.com';
    const formattedAmount = Number(data.totalAmount).toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; background-color: #F8FAFB; color: #1E2538; padding: 20px; }
    .card { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #EAEFF4; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .title { color: #135846; font-size: 20px; font-weight: bold; margin-bottom: 6px; }
    .sub { color: #718096; font-size: 13px; margin-bottom: 20px; }
    .info-item { margin-bottom: 12px; font-size: 14px; }
    .badge { display: inline-block; background: #135846; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-family: monospace; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">🔔 New Reservation Alert</div>
    <div class="sub">City Star Hotel Maiduguri • Live Notification</div>

    <div class="info-item"><strong>Booking Reference:</strong> <span class="badge">${data.bookingReference}</span></div>
    <div class="info-item"><strong>Guest Name:</strong> ${data.guestName}</div>
    <div class="info-item"><strong>Contact:</strong> ${data.guestEmail} ${data.guestPhone ? `| ${data.guestPhone}` : ''}</div>
    <div class="info-item"><strong>Suite:</strong> ${data.roomName} ${data.roomNumber ? `(Room ${data.roomNumber})` : ''}</div>
    <div class="info-item"><strong>Dates:</strong> ${data.checkInDate} to ${data.checkOutDate} (${data.totalNights} nights)</div>
    <div class="info-item"><strong>Total Amount:</strong> ${formattedAmount}</div>
    <div class="info-item"><strong>Payment Status:</strong> ${data.paymentStatus || 'unpaid'}</div>
    ${data.specialRequests ? `<div class="info-item"><strong>Special Requests:</strong> ${data.specialRequests}</div>` : ''}

    <hr style="border: none; border-top: 1px solid #EAEFF4; margin: 20px 0;" />
    <p style="font-size: 12px; color: #A0AEC0;">
      Logged from City Star Hotel Reservation Engine • Access Super Admin at <a href="https://citystaraccomodation.onrender.com/admin/bookings" style="color: #135846;">Admin Dashboard</a>
    </p>
  </div>
</body>
</html>
    `;

    return this.sendMail({
      to: adminEmail,
      subject: `[NEW BOOKING] ${data.bookingReference} - ${data.guestName} - ${formattedAmount}`,
      html: htmlContent,
      text: `New Booking Alert: ${data.bookingReference}\nGuest: ${data.guestName} (${data.guestEmail}, ${data.guestPhone || 'No phone'})\nRoom: ${data.roomName}\nDates: ${data.checkInDate} to ${data.checkOutDate}\nTotal: ${formattedAmount}`,
    });
  }

  /**
   * Internal generic mail dispatcher
   */
  private async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: Array<{ filename: string; path?: string; content?: string | Buffer; cid?: string; contentType?: string }>;
  }): Promise<boolean> {
    // Ensure transporter is loaded (via env or DB fallback)
    await this.ensureTransporter();

    const from = this.fromAddress || env.SMTP_FROM || '"City Star Hotel & Accomodation" <madambashir2@gmail.com>';

    if (!this.isConfigured) {
      console.log(`\n================== [EMAIL SIMULATION LOG] ==================`);
      console.log(`To      : ${options.to}`);
      console.log(`From    : ${from}`);
      console.log(`Subject : ${options.subject}`);
      console.log(`Status  : Skipped real delivery (Set SMTP_PASS or RESEND_API_KEY to send live emails)`);
      console.log(`============================================================\n`);
      return false;
    }

    // 1. Primary: Resend Official SDK
    if (this.provider === 'resend' && this.resendClient) {
      try {
        const resendPayload: any = {
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        };

        if (options.attachments && options.attachments.length > 0) {
          resendPayload.attachments = options.attachments.map((att) => ({
            filename: att.filename,
            content: att.path ? fs.readFileSync(att.path) : att.content,
          }));
        }

        const { data, error } = await this.resendClient.emails.send(resendPayload);

        if (error) {
          console.error('[EmailService - Resend Error]:', error);
          return false;
        }

        console.log(`[EmailService - Resend] Successfully delivered to ${options.to}. Email ID: ${data?.id}`);
        return true;
      } catch (err: any) {
        console.error(`[EmailService - Resend Exception]:`, err.message);
        return false;
      }
    }

    // 2. Secondary: SMTP Transporter (Nodemailer)
    if (this.provider === 'smtp' && this.transporter) {
      try {
        const mailOptions: any = {
          from,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        };

        if (options.attachments && options.attachments.length > 0) {
          mailOptions.attachments = options.attachments;
        }

        const info = await this.transporter.sendMail(mailOptions);

        console.log(`[EmailService - SMTP] Email successfully sent to ${options.to}. MessageId: ${info.messageId}`);
        return true;
      } catch (err: any) {
        console.error(`[EmailService - SMTP] Failed to send email to ${options.to}:`, err.message);
        return false;
      }
    }

    return false;
  }
}

export const emailService = new EmailService();
