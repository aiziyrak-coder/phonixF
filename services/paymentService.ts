// paymentService.ts
// Vaqtincha o'chirib qo'yilgan Click to'lov tizimi integratsiyasi
// TODO: To'lov tizimini qayta ulash kerak

import { apiFetch } from './apiService';

interface CreateInvoiceParams {
  amount: number;
  phoneNumber: string;
  merchantTransId: string;
}

interface InvoiceResponse {
  error_code: number;
  error_note: string;
  invoice_id?: number;
  eps_id?: string;
}

interface PaymentStatusResponse {
  error_code: number;
  error_note: string;
  payment_id?: number;
  payment_status?: number;
}

interface CardTokenRequest {
  cardNumber: string;
  expireDate: string;
  temporary?: number;
}

interface CardTokenResponse {
  error_code: number;
  error_note: string;
  card_token?: string;
  phone_number?: string;
  temporary?: number;
}

class PaymentService {
  // Vaqtincha o'chirib qo'yilgan metodlar
  /*
  private baseUrl = '/payments';

  async createInvoice(params: CreateInvoiceParams): Promise<InvoiceResponse> {
    try {
      const transactionData = {
        amount: params.amount,
        service_type: 'book_publication',
        description: `To'lov: ${params.merchantTransId}`
      };
      
      const response = await apiFetch(`${this.baseUrl}/click/prepare/`, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  async checkInvoiceStatus(invoiceId: number): Promise<any> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/invoice/${invoiceId}/status/`);
      return response;
    } catch (error) {
      console.error('Error checking invoice status:', error);
      throw error;
    }
  }

  async checkPaymentStatus(paymentId: number): Promise<PaymentStatusResponse> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/payment/${paymentId}/status/`);
      return response;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }

  async cancelPayment(paymentId: number): Promise<any> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/payment/${paymentId}/reversal/`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  async requestCardToken(cardData: CardTokenRequest): Promise<CardTokenResponse> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/card-token/request/`, {
        method: 'POST',
        body: JSON.stringify(cardData),
      });
      return response;
    } catch (error) {
      console.error('Error requesting card token:', error);
      throw error;
    }
  }

  async verifyCardToken(cardToken: string, smsCode: string): Promise<any> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/card-token/verify/`, {
        method: 'POST',
        body: JSON.stringify({
          card_token: cardToken,
          sms_code: smsCode
        }),
      });
      return response;
    } catch (error) {
      console.error('Error verifying card token:', error);
      throw error;
    }
  }

  async payWithCardToken(cardToken: string, amount: number, merchantTransId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/card-token/payment/`, {
        method: 'POST',
        body: JSON.stringify({
          card_token: cardToken,
          amount: amount,
          merchant_trans_id: merchantTransId
        }),
      });
      return response;
    } catch (error) {
      console.error('Error paying with card token:', error);
      throw error;
    }
  }

  async deleteCardToken(cardToken: string): Promise<any> {
    try {
      const response = await apiFetch(`${this.baseUrl}/click/card-token/${cardToken}/`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting card token:', error);
      throw error;
    }
  }
  */
}

// Vaqtincha o'chirib qo'yilgan eksport
// export const paymentService = new PaymentService();

// Bo'sh obyekt eksport qilamiz
export const paymentService = {} as any;