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

  /**
   * Export SAF-T (Standard Audit File for Tax purposes)
   */
  async getSaft(year: number, month: number) {
    try {
      const response = await axios.get(`${this.baseUrl}taxauthority/saft/`, {
        params: { api_key: this.apiKey, year, month }
      });
      return response.data;
    } catch (error: any) {
      console.error("Vendus SAF-T Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.message || "Erro ao exportar SAF-T");
    }
  }

  /**
   * Send document via email
   */
  async sendDocument(documentId: string | number, email: string) {
    try {
      const response = await axios.post(`${this.baseUrl}documents/${documentId}/send`, {
        email: email
      }, {
        params: { api_key: this.apiKey }
      });
      return response.data;
    } catch (error: any) {
      console.error("Vendus Send Email Error:", error.response?.data || error.message);
      throw new Error("Erro ao enviar fatura por email");
    }
  }
}
