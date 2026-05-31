import { sendSMSViaRUT240 } from "@/lib/sms-rut240";

export type SmsProvider = "RUT240" | "TELTONIKA" | "TWILIO" | "MOCK";

interface SmsOptions {
  to: string;
  message: string;
}

export class SmsService {
  private static provider: SmsProvider = (process.env.SMS_PROVIDER as SmsProvider) || "MOCK";

  static async send(options: SmsOptions) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[SMS_SERVICE] Sending via ${this.provider} to ${options.to}`);
    }

      try {
      switch (this.provider) {
        case "RUT240":
        case "TELTONIKA":
          return await this.sendViaRUT240(options);
        case "TWILIO":
          return await this.sendViaTwilio(options);
        default:
          return this.sendMock(options);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(`[SMS_SERVICE] Error sending SMS via ${this.provider}:`, error);
      }
      // Fallback logic could be added here if needed
      throw error;
    }
  }

  private static async sendViaRUT240({ to, message }: SmsOptions) {
    const result = await sendSMSViaRUT240(to, message);
    return { success: result.success, messageId: "rut240-ok" };
  }

  private static async sendViaTwilio({ to, message }: SmsOptions) {
    // Basic Twilio implementation placeholder
    if (process.env.NODE_ENV !== "production") {
      console.log("Twilio integration active - sending...");
    }
    // ... twilio client logic ...
    return { success: true, messageId: "twilio-mock-id" };
  }

  private static sendMock({ to, message }: SmsOptions) {
    if (process.env.NODE_ENV !== "production") {
      console.log("-----------------------------------------");
      console.log(`MOCK SMS TO: ${to}`);
      console.log(`MESSAGE: ${message}`);
      console.log("-----------------------------------------");
    }
    return { success: true, messageId: "mock-id" };
  }
}
