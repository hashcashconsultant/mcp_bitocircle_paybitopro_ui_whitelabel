import { fetchWithAuth } from '@/utils/fetchWithAuth'
import axios from 'axios'
import { getBitoHubUserInfo } from '../services/CoreDataService'

const BASE_URL = 'https://institutional-bo.paybito.com:8443/BitohubService'
const FINANCE_HUB_URL = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi/finance-hub'

// Response Interfaces
interface BaseResponse {
  success: boolean
  message: string
  errorCode: string | null
  totalRecords: number | null
}

// BitoDollar Balance Interfaces
interface Asset {
  currencyCode: string
  closingBalance: number
}

interface BalanceResponse {
  error: {
    error_data: number
    error_msg: string
  }
  userBalanceList: Asset[]
}

interface BitoHubUserInfo {
  uuid: string
  userId: number
  userTierType: string
  brokerId: string
  country: string
}

// Payment Action Types
export type PaymentAction = 'PAYMENT' | 'PAYMENT_ACCEPT' | 'PAYMENT_DECLINE'

// Payment Request Interface
export interface PaymentRequest {
  senderId: number
  receiverId: number
  conversationId: number
  messageId: number  // 0 for direct payment, required for PAYMENT_ACCEPT/PAYMENT_DECLINE
  amount: number
  currency: string   // 'USDB'
  action: PaymentAction
}

// Payment Response Interface
export interface PaymentResponseData {
  returnId: number
  message: string
}

export interface PaymentResponse extends BaseResponse {
  data: PaymentResponseData | null
}

// Legacy interfaces for backward compatibility
export interface PaymentMessageData {
  paymentId: string
  messageId?: number
  amount: number
  type: 'SEND' | 'REQUEST'
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED'
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  createdAt: string
  completedAt?: string
  conversationId?: number
  currency?: string
}

interface TransactionData {
  transactionId: number
  userId: number
  type: 'CREDIT' | 'DEBIT'
  amount: number
  balance: number
  description: string
  createdAt: string
}

interface TransactionHistoryResponse extends BaseResponse {
  data: TransactionData[]
}

// Payment API Service
export class PaymentAPIService {
  /**
   * Get user BitoDollar (USDB) balance
   * Step 1: Call getBitoHubUserInfo to get userUuid
   * Step 2: Use userUuid to fetch balance
   */
  static async getWalletBalance(): Promise<number> {
    try {
      // STEP 1: Get user info to retrieve UUID
      const userInfoResponse = await getBitoHubUserInfo()
      
      if (!userInfoResponse.data.success) {
        console.error('Failed to fetch user info:', userInfoResponse.data.message)
        return 0
      }

      const userInfo = userInfoResponse.data.data as BitoHubUserInfo
      const userUuid = userInfo.uuid

      console.log('User UUID retrieved:', userUuid)

      // STEP 2: Get BitoDollar balance using the UUID
      const payload = {
        adminUser: localStorage.getItem('uuid'),
        userUuid: userUuid,
      }

      const response = await axios.post<BalanceResponse>(
        `${FINANCE_HUB_URL}/getUserBalance`,
        payload,
        {
          headers: {
            // authorization: `bearer ${localStorage.getItem('access_token_us')}`
          }
        }
      )

      const error = response.data.error
      if (error.error_data === 1) {
        console.error('Failed to fetch BitoDollar balance:', error.error_msg)
        return 0
      }

      // STEP 3: Extract USDB balance
      const userBalanceList = response.data.userBalanceList as Asset[]
      const bitoDollarBalance = userBalanceList.find(
        (asset: Asset) => asset.currencyCode === 'USDB'
      )
      
      return bitoDollarBalance?.closingBalance || 0
    } catch (error) {
      console.error('Error fetching BitoDollar balance:', error)
      return 0
    }
  }

  /**
   * Unified Payment API
   * Used for:
   * - Direct Payment (action: 'PAYMENT', messageId: 0)
   * - Accept Payment Request (action: 'PAYMENT_ACCEPT', messageId: required)
   * - Decline Payment Request (action: 'PAYMENT_DECLINE', messageId: required)
   */
  static async processPayment(request: PaymentRequest): Promise<PaymentResponse | null> {
    try {
      const url = `${BASE_URL}/payment/send`

      console.log('Processing payment:', request)

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result: PaymentResponse = await response.json()

      console.log('Payment response:', result)

      return result
    } catch (error) {
      console.error('Error processing payment:', error)
      return null
    }
  }

  /**
   * Send direct payment to another user
   * Calls API first, then WebSocket message should be sent
   */
  static async sendDirectPayment(
    senderId: number,
    receiverId: number,
    conversationId: number,
    amount: number
  ): Promise<PaymentResponse | null> {
    const request: PaymentRequest = {
      senderId,
      receiverId,
      conversationId,
      messageId: 0, // Not required for direct payment
      amount,
      currency: 'USDB',
      action: 'PAYMENT',
    }

    return this.processPayment(request)
  }

  /**
   * Accept a payment request
   * Calls API first, then WebSocket message should be sent
   */
  static async acceptPaymentRequest(
    senderId: number,
    receiverId: number,
    conversationId: number,
    messageId: number,
    amount: number
  ): Promise<PaymentResponse | null> {
    const request: PaymentRequest = {
      senderId,
      receiverId,
      conversationId,
      messageId, // Required for accepting payment request
      amount,
      currency: 'USDB',
      action: 'PAYMENT_ACCEPT',
    }

    return this.processPayment(request)
  }

  /**
   * Decline a payment request
   * Only calls API, no WebSocket message needed
   */
  static async declinePaymentRequest(
    senderId: number,
    receiverId: number,
    conversationId: number,
    messageId: number,
    amount: number
  ): Promise<PaymentResponse | null> {
    const request: PaymentRequest = {
      senderId,
      receiverId,
      conversationId,
      messageId, // Required for declining payment request
      amount,
      currency: 'USDB',
      action: 'PAYMENT_DECLINE',
    }

    return this.processPayment(request)
  }

  /**
   * Get user transaction history
   */
  static async getTransactionHistory(
    userId: string,
    page: number = 0,
    size: number = 20
  ): Promise<TransactionData[]> {
    try {
      const url = `${FINANCE_HUB_URL}/wallet/transactions/${userId}?page=${page}&size=${size}`

      const response = await fetchWithAuth(url)
      const result: TransactionHistoryResponse = await response.json()

      if (result.success && result.data) {
        return result.data
      }

      return []
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      return []
    }
  }

  /**
   * Add funds to wallet (redirect to finance hub)
   */
  static openAddFundsPage(): void {
    const financeHubUrl = `${window.location.origin}/bitodollar-wallet`
    window.open(financeHubUrl, '_blank')
  }
}

export default PaymentAPIService