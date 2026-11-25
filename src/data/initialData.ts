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
  defaultCarrier: 'CJ대한통운',
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

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_ORDERS: Order[] = [];
