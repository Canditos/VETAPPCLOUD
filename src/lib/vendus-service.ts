import axios from "axios";

export class VendusService {
  private apiKey: string;
  private baseUrl = "https://www.vendus.pt/ws/v1.1/";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Create a document (Invoice, Simplified Invoice, etc.)
   */
  async createDocument(data: any) {
    try {
      const response = await axios.post(`${this.baseUrl}documents`, data, {
        params: { api_key: this.apiKey }
      });
      return response.data;
    } catch (error: any) {
      console.error("Vendus API Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.message || "Erro na API Vendus");
    }
  }

  /**
   * List clients
   */
  async getClients(email?: string) {
    try {
      const response = await axios.get(`${this.baseUrl}clients`, {
        params: { 
          api_key: this.apiKey,
          email: email
        }
      });
      return response.data;
    } catch (error) {
      console.error("Vendus Client Error:", error);
      return [];
    }
  }

  /**
   * Get products
   */
  async getProducts() {
    try {
      const response = await axios.get(`${this.baseUrl}products`, {
        params: { api_key: this.apiKey }
      });
      return response.data;
    } catch (error) {
      console.error("Vendus Product Error:", error);
      return [];
    }
  }
}
