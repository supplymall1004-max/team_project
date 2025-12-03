/**
 * @file mock-toss-client.ts
 * @description 토스페이먼츠 API 시뮬레이션 클라이언트
 * 
 * 실제 토스페이먼츠 계정 없이 결제 플로우를 테스트할 수 있도록 합니다.
 * 실제 PG 연동 시 이 파일을 실제 Toss SDK로 교체하면 됩니다.
 */

export interface MockPaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

export interface MockPaymentResponse {
  checkoutUrl: string;
  orderId: string;
  amount: number;
}

export interface MockBillingKeyRequest {
  customerKey: string; // 사용자 고유 ID
  authKey: string; // 카드 인증 키 (시뮬레이션)
}

export interface MockBillingKeyResponse {
  billingKey: string;
  cardInfo: {
    issuer: string;
    lastFourDigits: string;
    cardType: string;
  };
}

export interface MockPaymentConfirmRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface MockPaymentConfirmResponse {
  paymentKey: string;
  orderId: string;
  status: 'DONE' | 'FAILED';
  totalAmount: number;
  method: string;
  approvedAt: string;
  cardInfo?: {
    issuerCode: string;
    issuerName: string;
    number: string;
    type: string;
  };
}

/**
 * Mock 토스페이먼츠 클라이언트
 * 실제 API 대신 시뮬레이션 응답을 반환합니다.
 */
export class MockTossPaymentsClient {
  private isTestMode = true;

  constructor() {
    console.group('[MockTossClient] 초기화');
    console.log('⚠️ 테스트 모드: 실제 결제가 진행되지 않습니다.');
    console.groupEnd();
  }

  /**
   * 결제 세션 생성 (결제창 URL 반환)
   */
  async createPayment(request: MockPaymentRequest): Promise<MockPaymentResponse> {
    console.group('[MockTossClient] 결제 세션 생성');
    console.log('요청 데이터:', request);

    // 시뮬레이션: 1초 지연
    await this.delay(1000);

    // Mock 결제 URL 생성 (실제로는 /checkout/mock 페이지로 이동)
    const checkoutUrl = `/checkout/mock?orderId=${request.orderId}&amount=${request.amount}`;

    const response: MockPaymentResponse = {
      checkoutUrl,
      orderId: request.orderId,
      amount: request.amount,
    };

    console.log('응답 데이터:', response);
    console.groupEnd();

    return response;
  }

  /**
   * 빌링키 발급 (정기결제용)
   */
  async issueBillingKey(request: MockBillingKeyRequest): Promise<MockBillingKeyResponse> {
    console.group('[MockTossClient] 빌링키 발급');
    console.log('요청 데이터:', request);

    await this.delay(800);

    // Mock 빌링키 생성
    const billingKey = `mock_billing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock 카드 정보 (랜덤)
    const mockCards = [
      { issuer: '신한카드', lastFourDigits: '1234', cardType: 'credit' },
      { issuer: '국민카드', lastFourDigits: '5678', cardType: 'credit' },
      { issuer: '현대카드', lastFourDigits: '9012', cardType: 'check' },
      { issuer: '삼성카드', lastFourDigits: '3456', cardType: 'credit' },
    ];
    const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];

    const response: MockBillingKeyResponse = {
      billingKey,
      cardInfo: randomCard,
    };

    console.log('응답 데이터:', response);
    console.groupEnd();

    return response;
  }

  /**
   * 결제 승인 (사용자가 결제창에서 승인 후 호출)
   */
  async confirmPayment(request: MockPaymentConfirmRequest): Promise<MockPaymentConfirmResponse> {
    console.group('[MockTossClient] 결제 승인');
    console.log('요청 데이터:', request);

    await this.delay(1500);

    // 90% 확률로 성공, 10% 확률로 실패 (테스트용)
    const isSuccess = Math.random() > 0.1;

    const response: MockPaymentConfirmResponse = {
      paymentKey: request.paymentKey,
      orderId: request.orderId,
      status: isSuccess ? 'DONE' : 'FAILED',
      totalAmount: request.amount,
      method: '카드',
      approvedAt: new Date().toISOString(),
      cardInfo: isSuccess ? {
        issuerCode: '41',
        issuerName: '신한카드',
        number: '1234****',
        type: '신용',
      } : undefined,
    };

    console.log('응답 데이터:', response);
    console.groupEnd();

    return response;
  }

  /**
   * 빌링키로 정기 결제 실행
   */
  async payWithBillingKey(billingKey: string, amount: number, orderName: string): Promise<MockPaymentConfirmResponse> {
    console.group('[MockTossClient] 정기결제 실행');
    console.log('빌링키:', billingKey);
    console.log('금액:', amount);
    console.log('주문명:', orderName);

    await this.delay(1200);

    const isSuccess = Math.random() > 0.05; // 95% 성공률

    const response: MockPaymentConfirmResponse = {
      paymentKey: `mock_pay_${Date.now()}`,
      orderId: `auto_${Date.now()}`,
      status: isSuccess ? 'DONE' : 'FAILED',
      totalAmount: amount,
      method: '자동결제',
      approvedAt: new Date().toISOString(),
      cardInfo: isSuccess ? {
        issuerCode: '41',
        issuerName: '신한카드',
        number: '1234****',
        type: '신용',
      } : undefined,
    };

    console.log('응답 데이터:', response);
    console.groupEnd();

    return response;
  }

  /**
   * 환불 처리
   */
  async refundPayment(paymentKey: string, reason: string, amount?: number): Promise<{ success: boolean }> {
    console.group('[MockTossClient] 환불 처리');
    console.log('결제 키:', paymentKey);
    console.log('환불 사유:', reason);
    console.log('환불 금액:', amount ?? '전액');

    await this.delay(1000);

    console.log('✅ 환불 완료 (시뮬레이션)');
    console.groupEnd();

    return { success: true };
  }

  /**
   * Webhook 시그니처 검증 (시뮬레이션)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    console.group('[MockTossClient] Webhook 시그니처 검증');
    console.log('페이로드 길이:', payload.length);
    console.log('시그니처:', signature);
    
    // 시뮬레이션에서는 항상 true
    const isValid = true;
    
    console.log('검증 결과:', isValid ? '✅ 유효' : '❌ 무효');
    console.groupEnd();

    return isValid;
  }

  /**
   * 지연 함수 (네트워크 지연 시뮬레이션)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 싱글톤 인스턴스
let mockTossClient: MockTossPaymentsClient | null = null;

export function getMockTossClient(): MockTossPaymentsClient {
  if (!mockTossClient) {
    mockTossClient = new MockTossPaymentsClient();
  }
  return mockTossClient;
}

/**
 * 주문 ID 생성 헬퍼
 */
export function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  return `order_${userId.slice(0, 8)}_${timestamp}_${random}`;
}

/**
 * 결제 키 생성 헬퍼 (Mock용)
 */
export function generateMockPaymentKey(): string {
  return `mock_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
























