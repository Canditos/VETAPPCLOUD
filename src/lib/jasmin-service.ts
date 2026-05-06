import axios from "axios";
import prisma from "@/lib/prisma";

const JASMIN_AUTH_URL = "https://identity.primaverabss.com/connect/token";
const JASMIN_BASE_URL = "https://my.jasminsoftware.com/api";

export class JasminService {
  private clinicId: string;
  private tenantKey: string | null = null;
  private orgKey: string | null = null;
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;

  constructor(clinicId: string) {
    this.clinicId = clinicId;
  }

  private async loadCredentials() {
    if (this.clientId) return;

    const clinic = await prisma.clinic.findUnique({
      where: { id: this.clinicId },
      select: { jasminAppId: true, jasminSecret: true, jasminApiKey: true },
    });

    if (!clinic?.jasminAppId || !clinic?.jasminSecret || !clinic?.jasminApiKey) {
      throw new Error(
        `Clínica ${this.clinicId} não tem credenciais Jasmin configuradas. Configure-as em Definições > Faturação.`
      );
    }

    // jasminApiKey stores "tenantKey/orgKey"
    const [tenantKey, orgKey] = (clinic.jasminApiKey ?? "").split("/");
    this.tenantKey = tenantKey;
    this.orgKey = orgKey;
    this.clientId = clinic.jasminAppId;
    this.clientSecret = clinic.jasminSecret;
  }

  private async authenticate() {
    await this.loadCredentials();

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", this.clientId!);
    params.append("client_secret", this.clientSecret!);
    params.append("scope", "application");

    const response = await axios.post(JASMIN_AUTH_URL, params);
    this.accessToken = response.data.access_token;
  }

  private async getHeaders() {
    if (!this.accessToken) await this.authenticate();
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async createInvoice(data: { customerKey: string; items: any[] }) {
    await this.loadCredentials();
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/billing/invoices`;

    const invoicePayload = {
      buyerCustomerParty: data.customerKey,
      lines: data.items.map((item: any) => ({
        salesItem: item.itemKey,
        quantity: item.quantity,
        unitPrice: { amount: item.unitPrice, baseAmount: item.unitPrice },
      })),
    };

    try {
      const response = await axios.post(url, invoicePayload, { headers });
      return {
        id: response.data.id ?? response.data.naturalKey,
        status: "Success",
        externalUrl: response.data.naturalKey
          ? `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/billing/invoices/${response.data.naturalKey}`
          : null,
      };
    } catch (error: any) {
      console.error("[JASMIN] createInvoice error:", error.response?.data ?? error.message);
      throw new Error("Falha ao criar fatura no Jasmin ERP");
    }
  }

  async createCustomer(data: { name: string; vatNumber: string; email?: string; phone?: string; address?: string }) {
    await this.loadCredentials();
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/salesCore/customerParties`;

    const customerPayload = {
      name: data.name,
      companyTaxID: data.vatNumber,
      electronicMail: data.email,
      telephone: data.phone,
      address: data.address,
      currency: "EUR",
      customerGroup: "CLIENTES",
      settlementDiscountPercent: 0,
      paymentMethod: "NUM",
      paymentTerm: "00",
    };

    try {
      const response = await axios.post(url, customerPayload, { headers });
      return response.data;
    } catch (error: any) {
      console.error("[JASMIN] createCustomer error:", error.response?.data ?? error.message);
      throw new Error("Falha ao criar cliente no Jasmin ERP");
    }
  }

  async getInvoicePdf(invoiceId: string): Promise<Buffer> {
    await this.loadCredentials();
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/billing/invoices/${invoiceId}/print`;

    try {
      const response = await axios.get(url, { headers, responseType: "arraybuffer" });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error("[JASMIN] getInvoicePdf error:", error.response?.data ?? error.message);
      throw new Error("Falha ao obter PDF da fatura no Jasmin ERP");
    }
  }

  async getProducts() {
    await this.loadCredentials();
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/salesCore/salesItems`;

    try {
      const response = await axios.get(url, { headers });
      return response.data ?? [];
    } catch (error: any) {
      console.error("[JASMIN] getProducts error:", error.response?.data ?? error.message);
      return [];
    }
  }
}
