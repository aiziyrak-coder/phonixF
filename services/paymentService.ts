// paymentService.ts
// Click to'lov tizimi integratsiyasi

import { apiService } from './apiService';

interface ProcessPaymentResponse {
  success: boolean;
  payment_url?: string;
  invoice_id?: number;
  merchant_trans_id?: string;
  amount?: number;
  currency?: string;
  error_code?: number;
  error?: string;
  error_note?: string;
}

interface PaymentStatusResponse {
  error_code: number;
  error_note: string;
  payment_status?: number;
}

class PaymentService {
  /**
   * Process payment for a transaction
   * Creates invoice via Click API and returns payment URL
   */
  async processPayment(transactionId: string): Promise<ProcessPaymentResponse> {
    try {
      console.log('Processing payment for transaction ID:', transactionId);
      const response = await apiService.payments.processPayment(transactionId);
      console.log('Process payment response:', response);
      
      // Ensure response has success field
      // Check if payment_url exists (even if invoice creation failed, we may have fallback URL)
      if (response && typeof response.success === 'undefined') {
        // If response has payment_url, consider it success (even if invoice failed)
        if (response.payment_url) {
          response.success = true;
        } else if (response.error_code === 0 || (!response.error_code && !response.error)) {
          response.success = true;
        } else {
          response.success = false;
        }
      }
      
      // If payment_url exists but success is false, override it to true
      if (response && response.payment_url && response.success === false) {
        console.warn('Payment URL exists but success is false, overriding to true:', response);
        response.success = true;
      }
      
      return response;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Extract error message from different error formats
      let errorMessage = 'To\'lovni amalga oshirishda xatolik yuz berdi';
      let errorCode = -1;
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.error_note) {
        errorMessage = error.error_note;
      }
      
      if (error.error_code) {
        errorCode = error.error_code;
      }
      
      return {
        success: false,
        error_code: errorCode,
        error: errorMessage,
        error_note: errorMessage
      };
    }
  }

  /**
   * Check payment status for a transaction
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      // First get transaction details
      const transactions = await apiService.payments.listTransactions();
      const transaction = transactions.find((t: any) => t.id === transactionId);
      
      if (!transaction) {
        return {
          error_code: -5,
          error_note: 'Transaction not found'
        };
      }

      return {
        error_code: 0,
        error_note: 'Success',
        payment_status: transaction.status === 'completed' ? 2 : 
                       transaction.status === 'failed' ? -1 : 0
      };
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      return {
        error_code: -9,
        error_note: error.message || 'Failed to check payment status'
      };
    }
  }

  /**
   * Redirect user to Click payment page
   */
  redirectToPayment(paymentUrl: string): void {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    } else {
      console.error('Payment URL is not available');
    }
  }

  /**
   * Create transaction and process payment
   * Helper method that creates transaction first, then processes payment
   */
  async createTransactionAndPay(
    amount: number,
    currency: string,
    serviceType: string,
    articleId?: string,
    translationRequestId?: string
  ): Promise<ProcessPaymentResponse> {
    try {
      console.log('Creating transaction with data:', { amount, currency, serviceType, articleId, translationRequestId });
      
      // Create transaction first - only include defined fields
      const transactionData: any = {
        amount: amount,
        currency: currency || 'UZS',
        service_type: serviceType,
      };

      // Only add article and translation_request if they are provided and not empty
      if (articleId && articleId.trim() !== '') {
        transactionData.article = articleId;
      }
      if (translationRequestId && translationRequestId.trim() !== '') {
        transactionData.translation_request = translationRequestId;
      }

      console.log('Transaction data to send:', transactionData);

      const transaction = await apiService.payments.createTransaction(transactionData);
      
      console.log('Transaction created:', transaction);
      
      if (!transaction || !transaction.id) {
        console.error('Transaction creation failed - no ID returned:', transaction);
        return {
          success: false,
          error_code: -1,
          error: 'Transaction yaratilmadi. Server javob bermadi.',
          error_note: 'Failed to create transaction - no transaction ID returned'
        };
      }

      console.log('Processing payment for transaction:', transaction.id);

      // Process payment for the created transaction
      const paymentResult = await this.processPayment(transaction.id);
      console.log('Payment processing result:', paymentResult);
      
      return paymentResult;
    } catch (error: any) {
      console.error('Error creating transaction and processing payment:', error);
      
      // Extract error message from different error formats
      let errorMessage = 'To\'lovni amalga oshirishda xatolik yuz berdi';
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.error) {
        errorMessage = error.error;
      } else if (error.error_note) {
        errorMessage = error.error_note;
      }
      
      return {
        success: false,
        error_code: error.error_code || -1,
        error: errorMessage,
        error_note: errorMessage
      };
    }
  }
}

export const paymentService = new PaymentService();