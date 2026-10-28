"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const resend_1 = require("resend");
const env_1 = require("../config/env");
class EmailService {
    resendClient = null;
    transporter = null;
    isConfigured = false;
    provider = 'none';
    constructor() {
        this.initProviders();
    }
    initProviders() {
        if (env_1.env.RESEND_API_KEY) {
            try {
                this.resendClient = new resend_1.Resend(env_1.env.RESEND_API_KEY);
                this.isConfigured = true;
                this.provider = 'resend';
                console.log('[EmailService] Resend SDK initialized as primary delivery provider.');
                return;
            }
            catch (err) {
                console.warn('[EmailService] Failed to initialize Resend client:', err);
            }
        }
        if (env_1.env.SMTP_USER && env_1.env.SMTP_PASS) {
            try {
                this.transporter = nodemailer_1.default.createTransport({
                    host: env_1.env.SMTP_HOST,
                    port: env_1.env.SMTP_PORT,
                    secure: env_1.env.SMTP_PORT === 465,
                    auth: {
                        user: env_1.env.SMTP_USER,
                        pass: env_1.env.SMTP_PASS,
                    },
                    tls: {
                        rejectUnauthorized: false, // Prevents self-signed or proxy TLS issues
                    },
                });
                this.isConfigured = true;
                this.provider = 'smtp';
                console.log(`[EmailService] SMTP transporter configured for ${env_1.env.SMTP_USER} via ${env_1.env.SMTP_HOST}:${env_1.env.SMTP_PORT}`);
                return;
            }
            catch (err) {
                console.warn('[EmailService] Failed to initialize SMTP transporter:', err);
            }
        }
        this.isConfigured = false;
        this.provider = 'none';
        console.log('[EmailService] Neither RESEND_API_KEY nor SMTP credentials provided. Running in simulation mode.');
    }
    getStatus() {
        return {
            configured: this.isConfigured,
            provider: this.provider,
            hasResendApiKey: Boolean(env_1.env.RESEND_API_KEY),
            resendKeyPrefix: env_1.env.RESEND_API_KEY ? `${env_1.env.RESEND_API_KEY.slice(0, 5)}***` : null,
            host: env_1.env.SMTP_HOST,
            port: env_1.env.SMTP_PORT,
            user: env_1.env.SMTP_USER ? `${env_1.env.SMTP_USER.slice(0, 3)}***@${env_1.env.SMTP_USER.split('@')[1] || ''}` : 'Not Set',
            from: env_1.env.SMTP_FROM,
            adminRecipient: env_1.env.ADMIN_NOTIFICATION_EMAIL,
        };
    }
    /**
     * Dispatches a 5-star Luxury Reservation Confirmation to the Guest
     */
    async sendGuestConfirmation(data) {
        if (!data.guestEmail || data.guestEmail.includes('example.com') || data.guestEmail.includes('guest@citystarhotel.com')) {
            console.log(`[EmailService] Skipping guest email for placeholder address: ${data.guestEmail}`);
            return false;
        }
        const formattedAmount = Number(data.totalAmount).toLocaleString('en-NG', {
            style: 'currency',
            currency: 'NGN',
        });
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation Confirmation - City Star Hotel & Suites</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0B1E19; margin: 0; padding: 20px; color: #1E2538; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
    .header { background: linear-gradient(135deg, #0B1E19 0%, #135846 100%); padding: 36px 24px; text-align: center; border-bottom: 3px solid #C5A880; }
    .logo-title { color: #C5A880; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
    .logo-sub { color: #ffffff; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; opacity: 0.9; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; color: #135846; margin-bottom: 12px; }
    .ref-badge { background: #F4F8F6; border: 2px dashed #135846; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .ref-label { font-size: 11px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 1.5px; }
    .ref-code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; color: #135846; letter-spacing: 3px; margin-top: 4px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .details-table td { padding: 12px 0; border-bottom: 1px solid #EAEFF4; font-size: 14px; }
    .details-table td.label { color: #718096; font-weight: 600; width: 40%; }
    .details-table td.value { color: #1E2538; font-weight: 700; text-align: right; }
    .total-row td { border-bottom: 2px solid #135846; font-size: 16px; padding-top: 16px; color: #135846 !important; font-weight: 800; }
    .instructions { background: #FFFDF9; border-left: 4px solid #C5A880; padding: 16px; border-radius: 4px; margin: 24px 0; font-size: 13px; color: #4A5568; line-height: 1.6; }
    .footer { background: #F8FAFB; padding: 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EAEFF4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-title">City Star Hotel & Suites</h1>
      <div class="logo-sub">Maiduguri • Borno State • 5-Star Luxury</div>
    </div>
    <div class="content">
      <div class="greeting">Warm Northern Greetings, ${data.guestName}!</div>
      <p style="font-size: 14px; color: #4A5568; line-height: 1.6;">
        We are honored to confirm your luxury reservation at City Star Hotel & Suites. Your suite has been reserved and our dedicated concierge is preparing for your arrival in the historic city of Maiduguri.
      </p>

      <div class="ref-badge">
        <div class="ref-label">Your Official Booking Reference</div>
        <div class="ref-code">${data.bookingReference}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Suite / Category:</td>
          <td class="value">${data.roomName}</td>
        </tr>
        ${data.roomNumber ? `
        <tr>
          <td class="label">Assigned Room:</td>
          <td class="value">Room ${data.roomNumber} ${data.floor ? `(Floor ${data.floor})` : ''}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label">Check-in Date:</td>
          <td class="value">${data.checkInDate}</td>
        </tr>
        <tr>
          <td class="label">Check-out Date:</td>
          <td class="value">${data.checkOutDate}</td>
        </tr>
        <tr>
          <td class="label">Duration:</td>
          <td class="value">${data.totalNights} Night${data.totalNights > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td class="label">Payment Status:</td>
          <td class="value" style="color: ${data.paymentStatus === 'paid_at_desk' || data.paymentStatus === 'completed' ? '#135846' : '#D97706'};">
            ${data.paymentStatus === 'paid_at_desk' ? 'Paid at Front Desk' : data.paymentStatus === 'completed' ? 'Paid & Confirmed' : 'Pending Payment'}
          </td>
        </tr>
        <tr class="total-row">
          <td class="label">Total Amount:</td>
          <td class="value">${formattedAmount}</td>
        </tr>
      </table>

      <div class="instructions">
        <strong>Important Check-in Instructions:</strong><br/>
        • Please present your Booking Reference <strong>${data.bookingReference}</strong> and a valid government ID (NIN, Driver's License, or Passport) at the front desk upon check-in.<br/>
        • Check-in begins at 2:00 PM. Early check-in or VIP airport transfers from Maiduguri International Airport can be requested via our 24/7 concierge.
      </div>

      <p style="font-size: 13px; color: #718096; text-align: center; margin-top: 30px;">
        For inquiries or modifications, contact concierge at <a href="mailto:concierge@citystarhotel.com" style="color: #135846; font-weight: 600;">concierge@citystarhotel.com</a>.
      </p>
    </div>
    <div class="footer">
      <strong>City Star Hotel & Suites</strong><br/>
      Yerwa / Yerima Road, Maiduguri, Borno State, Nigeria<br/>
      Premier 5-Star Luxury Hospitality in the Kanem-Borno Heart<br/>
      &copy; 2026 City Star Hotel & Suites. All rights reserved.
    </div>
  </div>
</body>
</html>
    `;
        return this.sendMail({
            to: data.guestEmail,
            subject: `Reservation Confirmed: ${data.bookingReference} - City Star Hotel & Suites Maiduguri`,
            html: htmlContent,
            text: `Warm greetings ${data.guestName}!\n\nYour reservation at City Star Hotel & Suites is confirmed.\nBooking Reference: ${data.bookingReference}\nRoom: ${data.roomName}\nDates: ${data.checkInDate} to ${data.checkOutDate} (${data.totalNights} nights)\nTotal: ${formattedAmount}\n\nPresent this code at check-in.\nYerwa Road, Maiduguri, Borno State.`,
        });
    }
    /**
     * Dispatches an Instant Operational Alert to Hotel Management / Admin
     */
    async sendAdminAlert(data) {
        const adminEmail = env_1.env.ADMIN_NOTIFICATION_EMAIL || 'talbashtech@gmail.com';
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
    async sendMail(options) {
        if (!this.isConfigured) {
            console.log(`\n================== [EMAIL SIMULATION LOG] ==================`);
            console.log(`To      : ${options.to}`);
            console.log(`From    : ${env_1.env.SMTP_FROM}`);
            console.log(`Subject : ${options.subject}`);
            console.log(`Status  : Skipped real delivery (Set RESEND_API_KEY in apps/api/.env or Render to send live emails)`);
            console.log(`============================================================\n`);
            return false;
        }
        // 1. Primary: Resend Official SDK
        if (this.provider === 'resend' && this.resendClient) {
            try {
                const { data, error } = await this.resendClient.emails.send({
                    from: env_1.env.SMTP_FROM,
                    to: [options.to],
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                });
                if (error) {
                    console.error('[EmailService - Resend Error]:', error);
                    return false;
                }
                console.log(`[EmailService - Resend] Successfully delivered to ${options.to}. Email ID: ${data?.id}`);
                return true;
            }
            catch (err) {
                console.error(`[EmailService - Resend Exception]:`, err.message);
                return false;
            }
        }
        // 2. Secondary: SMTP Transporter (Nodemailer)
        if (this.provider === 'smtp' && this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: env_1.env.SMTP_FROM,
                    to: options.to,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                });
                console.log(`[EmailService - SMTP] Email successfully sent to ${options.to}. MessageId: ${info.messageId}`);
                return true;
            }
            catch (err) {
                console.error(`[EmailService - SMTP] Failed to send email to ${options.to}:`, err.message);
                return false;
            }
        }
        return false;
    }
}
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map