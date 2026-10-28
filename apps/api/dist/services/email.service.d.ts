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
declare class EmailService {
    private resendClient;
    private transporter;
    private isConfigured;
    private provider;
    constructor();
    private initProviders;
    getStatus(): {
        configured: boolean;
        provider: "resend" | "smtp" | "none";
        hasResendApiKey: boolean;
        resendKeyPrefix: string | null;
        host: string;
        port: number;
        user: string;
        from: string;
        adminRecipient: string;
    };
    /**
     * Dispatches a 5-star Luxury Reservation Confirmation to the Guest
     */
    sendGuestConfirmation(data: BookingEmailData): Promise<boolean>;
    /**
     * Dispatches an Instant Operational Alert to Hotel Management / Admin
     */
    sendAdminAlert(data: BookingEmailData): Promise<boolean>;
    /**
     * Internal generic mail dispatcher
     */
    private sendMail;
}
export declare const emailService: EmailService;
export {};
