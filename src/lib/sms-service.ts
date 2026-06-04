
import axios from "axios";

export type SmsProvider = "TELTONIKA" | "TWILIO" | "MOCK";

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
        case "TELTONIKA":
          return await this.sendViaTeltonika(options);
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

  private static async sendViaTeltonika({ to, message }: SmsOptions) {
    const host = process.env.TELTONIKA_HOST || "192.168.1.1";
    const user = process.env.TELTONIKA_USER || "admin";
    const pass = process.env.TELTONIKA_PASS;

    if (!pass) throw new Error("TELTONIKA_PASS not configured");

    // Teltonika RUT240 HTTP API Format
    // http://<IP>/cgi-bin/sms_send?username=<USER>&password=<PASS>&number=<NUMBER>&text=<TEXT>
    const url = `http://${host}/cgi-bin/sms_send`;
    
    const response = await axios.get(url, {
      params: {
        username: user,
        password: pass,
        number: to.replace(/\s+/g, ""), // Remove spaces
        text: message
      },
      timeout: 5000 // 5 seconds timeout for local network
    });

    if (response.status !== 200 || !response.data.includes("OK")) {
      throw new Error(`Teltonika responded with: ${response.data}`);
    }

    return { success: true, messageId: "teltonika-ok" };
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
