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
          connectionTimeout: 6000,
          greetingTimeout: 6000,
          socketTimeout: 6000,
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
            connectionTimeout: 6000,
            greetingTimeout: 6000,
            socketTimeout: 6000,
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
      <div class="salutation">Dear ${data.guestName},</div>
      <p class="intro-text">
        We are honored to confirm your luxury reservation at City Star Hotel. We have reserved your suite and look forward to welcoming you to City Star Hotel.
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

Dear ${data.guestName},

We are honored to confirm your luxury reservation at City Star Hotel. We have reserved your suite and look forward to welcoming you to City Star Hotel.

YOUR OFFICIAL BOOKING REFERENCE
${data.bookingReference}

Guest Name:	${data.guestName}
Phone Number:	${data.guestPhone || '—'}
Email:	${email}
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
