import { AppSettings, Customer, Order } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  farmName: '해찬솔 농원',
  sellerPhone: '010-4512-2448',
  bankInfo: {
    bankName: '카카오뱅크',
    accountNumber: '3333-06-7706075',
    accountHolder: '이정선',
  },
  pricing: {
    price5kg: 20000,
    price10kg: 25000,
    boxPrice5kg: 800,           // 5kg 박스 원가 800원
    boxPrice10kg: 1000,         // 10kg 박스 원가 1000원
    defaultShippingCost: 4500,  // 상자당 기본 택배비
  },
  defaultCarrier: '우체국택배',
  dispatchNoticeTemplate:
`[발송예정 안내]
{customerName} 고객님, 정성껏 수확한 노지감귤({itemSummary})이 {dispatchDate}에 {carrier}로 발송될 예정입니다.
감사합니다!`,
  bankNoticeTemplate:
`[주문 입금 안내]
{customerName}님, 제주 감귤 주문이 정상 접수되었습니다.

• 주문 내역: {itemSummary}
• 총 결제 금액: {totalAmount}원
• 입금 계좌: {bankName} {accountNumber}
• 예금주: {accountHolder}

입금 확인 후 수확하여 {dispatchDate}에 발송해 드립니다. 감사합니다.`,
  shippingNoticeTemplate:
`[배송 출발 안내]
{customerName}님, 주문하신 감귤({itemSummary})이 오늘 발송되었습니다.

• 택배사: {carrier}
• 운송장번호: {trackingNumber}
• 배송조회: {trackingUrl}

감사합니다.`,
  preOrderInquiryTemplate:
`[감귤 주문 안내]
산지 직거래 햇노지감귤 가격 및 주문 안내드립니다.

🍊 판매 가격
• 노지 감귤 10kg: {price10kg}원
• 노지 감귤 5kg: {price5kg}원
(택배비 포함 무료 배송)

🏦 입금 계좌
• {bankName} {accountNumber}
• 예금주: {accountHolder}

🚚 발송 안내
입금 확인 후 수확하는 시간이 최대 1주일 정도 소요될 예정입니다.

📝 주문 방법
입금 후 아래 정보를 문자로 남겨주시면 확인 후 발송해 드립니다:
1. 받는 분 성함:
2. 휴대전화 번호:
3. 배송지 주소:
4. 주문 수량(10kg / 5kg):
5. 배송 요청사항(선택):

감사합니다!`,
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-001',
    name: '오현석',
    phone: '010-3847-1928',
    address: '서울특별시 송파구 올림픽로 300 롯데캐슬 103동 1502호',
    postalCode: '05551',
    orderCount: 1,
    totalSpent: 25000,
    lastOrderedAt: '2026-11-24',
    notes: '10kg 감귤 주문 고객',
  },
  {
    id: 'CUST-002',
    name: '김정아',
    phone: '010-4921-8274',
    address: '경기도 성남시 분당구 판교역로 146 판교푸르지오 205동 801호',
    postalCode: '13524',
    orderCount: 1,
    totalSpent: 45000,
    lastOrderedAt: '2026-11-24',
    notes: '5kg, 10kg 선물용 주문',
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-20261124-001',
    createdAt: '2026-11-24 14:20',
    customerName: '오현석',
    phone: '010-3847-1928',
    address: '서울특별시 송파구 올림픽로 300 롯데캐슬 103동 1502호',
    postalCode: '05551',
    items: [
      {
        id: 'ITEM-1',
        type: '10kg',
        name: '노지 감귤 10kg',
        quantity: 1,
        unitPrice: 25000,
      },
    ],
    totalAmount: 25000,
    shippingCost: 4500,
    boxCost: 1000,
    netProfit: 19500,
    status: 'order_received',
    dispatchDate: '2026-11-25',
    carrier: '우체국택배',
    trackingNumber: '',
    memo: '부재 시 경비실에 맡겨주세요',
    isPaid: true,
    paidAt: '2026-11-24 14:35',
  },
  {
    id: 'ORD-20261124-002',
    createdAt: '2026-11-24 11:05',
    customerName: '김정아',
    phone: '010-4921-8274',
    address: '경기도 성남시 분당구 판교역로 146 판교푸르지오 205동 801호',
    postalCode: '13524',
    items: [
      {
        id: 'ITEM-2',
        type: '5kg',
        name: '노지 감귤 5kg',
        quantity: 1,
        unitPrice: 20000,
      },
      {
        id: 'ITEM-3',
        type: '10kg',
        name: '노지 감귤 10kg',
        quantity: 1,
        unitPrice: 25000,
      },
    ],
    totalAmount: 45000,
    shippingCost: 9000,
    boxCost: 1800,
    netProfit: 34200,
    status: 'order_received',
    dispatchDate: '2026-11-26',
    carrier: '우체국택배',
    trackingNumber: '',
    memo: '문 앞 배송 요망',
    isPaid: true,
    paidAt: '2026-11-24 11:15',
  },
];
