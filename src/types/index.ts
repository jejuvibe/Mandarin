export type OrderStatus =
  | 'payment_pending' // 입금 대기
  | 'order_received'  // 주문 접수
  | 'preparing'       // 배송 준비중
  | 'in_transit'      // 배송 중
  | 'delivered'       // 배송 완료
  | 'cancelled';      // 주문 취소

export interface OrderItem {
  id: string;
  type: '5kg' | '10kg' | 'custom';
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  createdAt: string;       // YYYY-MM-DD HH:mm
  customerName: string;    // 받는 분 성함
  phone: string;           // 휴대전화 (010-XXXX-XXXX)
  address: string;         // 기본 주소 및 상세 주소
  postalCode?: string;     // 우편번호
  items: OrderItem[];      // 상품 목록 (5kg, 10kg 등)
  totalAmount: number;     // 총 판매금액 (원)
  shippingCost: number;    // 택배비 비용 (원)
  boxCost: number;         // 박스비 원가 (원) - 5kg/10kg 차등 반영
  netProfit: number;       // 순수익 = totalAmount - shippingCost - boxCost (원)
  status: OrderStatus;     // 주문 상태
  dispatchDate: string;    // 발송(예정)일자 (YYYY-MM-DD)
  carrier: string;         // 택배사명 (예: 우체국택배, CJ대한통운)
  trackingNumber: string;  // 운송장번호
  memo?: string;           // 배송 요청사항 or 관리자 메모
  isPaid: boolean;         // 입금 확인 여부
  paidAt?: string;         // 입금 확인 시각
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  postalCode?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderedAt: string;
  notes?: string;
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PricingConfig {
  price5kg: number;
  price10kg: number;
  boxPrice5kg: number;       // 5kg 박스 원가
  boxPrice10kg: number;      // 10kg 박스 원가
  defaultShippingCost: number; // 기본 상자당 택배비
}

export interface SeasonSettlement {
  seasonKey: string;         // e.g. '2026-2027'
  seasonName: string;        // e.g. '2026-2027 시즌 (2026.11 ~ 2027.02)'
  isClosed: boolean;
  closedAt?: string;
  totalRevenue: number;
  totalShippingCost: number;
  totalBoxCost: number;
  totalNetProfit: number;
  totalOrders: number;
  total10kgBoxes: number;
  total5kgBoxes: number;
  note?: string;
}

export interface AppSettings {
  farmName: string;
  sellerPhone: string;
  bankInfo: BankAccountInfo;
  pricing: PricingConfig;
  defaultCarrier: string;
  dispatchNoticeTemplate: string;
  bankNoticeTemplate: string;
  shippingNoticeTemplate: string;
  preOrderInquiryTemplate?: string;
  settlements?: Record<string, SeasonSettlement>;
  customSeasons?: string[];
  deletedSeasons?: string[];
}

export interface ParsedOrderData {
  customerName?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  detected5kg?: number;
  detected10kg?: number;
  memo?: string;
  confidenceScore?: number;
}
