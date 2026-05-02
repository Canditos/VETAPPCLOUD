import axios from 'axios';

const JASMIN_AUTH_URL = 'https://identity.primaverabss.com/connect/token';
const JASMIN_BASE_URL = 'https://my.jasminsoftware.com/api';

export class JasminService {
  private tenantKey: string;
  private orgKey: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;

  constructor(tenantKey: string, orgKey: string, clientId: string, clientSecret: string) {
    this.tenantKey = tenantKey;
    this.orgKey = orgKey;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  private async authenticate() {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('scope', 'application');

    const response = await axios.post(JASMIN_AUTH_URL, params);
    this.accessToken = response.data.access_token;
  }

  private async getHeaders() {
    if (!this.accessToken) await this.authenticate();
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async createInvoice(invoiceData: any) {
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/billing/invoices`;
    
    try {
      const response = await axios.post(url, invoiceData, { headers });
      return response.data;
    } catch (error: any) {
      console.error('Jasmin Invoice Error:', error.response?.data || error.message);
      throw new Error('Failed to create invoice in Jasmin');
    }
  }

  async getInvoicePdf(invoiceId: string) {
    const headers = await this.getHeaders();
    const url = `${JASMIN_BASE_URL}/${this.tenantKey}/${this.orgKey}/billing/invoices/${invoiceId}/print`;
    
    try {
      const response = await axios.get(url, { headers, responseType: 'arraybuffer' });
      return response.data;
    } catch (error: any) {
      console.error('Jasmin PDF Error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve invoice PDF from Jasmin');
    }
  }
}
