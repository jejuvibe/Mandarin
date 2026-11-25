export interface CourierInfo {
  code: string;
  name: string;
  defaultTrackingUrl: (trackingNumber: string) => string;
}

export const COURIERS: CourierInfo[] = [
  {
    code: 'cj',
    name: 'CJ대한통운',
    defaultTrackingUrl: (n) => `https://www.doortodoor.co.kr/tracking/jsp/cplus/mpbz0230.jsp?invc_no=${encodeURIComponent(n)}`,
  },
  {
    code: 'epost',
    name: '우체국택배',
    defaultTrackingUrl: (n) => `https://service.epost.go.kr/trace.RetrieveDomRcvTraceList.comm?sid1=${encodeURIComponent(n)}`,
  },
  {
    code: 'nonghyup',
    name: '농협택배',
    defaultTrackingUrl: (n) => `https://tracker.delivery/#/kr.nonghyup/${encodeURIComponent(n)}`,
  },
  {
    code: 'hanjin',
    name: '한진택배',
    defaultTrackingUrl: (n) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${encodeURIComponent(n)}`,
  },
  {
    code: 'lotte',
    name: '롯데택배',
    defaultTrackingUrl: (n) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${encodeURIComponent(n)}`,
  },
  {
    code: 'logen',
    name: '로젠택배',
    defaultTrackingUrl: (n) => `https://www.ilogen.com/web/personal/trace/${encodeURIComponent(n)}`,
  },
];

export function getTrackingUrl(carrierName: string, trackingNumber: string): string {
  if (!trackingNumber) return '';
  const cleanNumber = trackingNumber.replace(/[^0-9]/g, '');
  const matched = COURIERS.find(c => carrierName.includes(c.name) || c.name.includes(carrierName));
  if (matched) {
    return matched.defaultTrackingUrl(cleanNumber);
  }
  // Generic delivery tracker portal
  return `https://tracker.delivery/#/${encodeURIComponent(cleanNumber)}`;
}

/**
 * Cleans an address string for courier dispatch or bulk copying:
 * - Strips trailing phone numbers (e.g. 01038831378, 010-3883-1378)
 * - Strips citrus quantities and box info (e.g. 10키로2박스, 5kg 1박스, 10kg, 2박스)
 * - Strips recipient name from beginning or end of address if accidentally attached
 * - Strips leading address prefix labels (주소:, 받는분: 등)
 */
export function cleanAddressForCourier(
  address: string,
  customerName?: string,
  phone?: string
): string {
  if (!address) return '';
  let cleaned = address.trim();

  // 1. Strip phone numbers (both formatted and unformatted)
  if (phone) {
    const rawDigits = phone.replace(/[^0-9]/g, '');
    if (rawDigits.length >= 8) {
      cleaned = cleaned.replace(new RegExp(rawDigits, 'g'), ' ');
    }
    const cleanPhonePattern = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(cleanPhonePattern, 'g'), ' ');
  }
  cleaned = cleaned.replace(/(?:01[016789]|02|0[3-6][1-5])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, ' ');
  cleaned = cleaned.replace(/01[016789]\d{7,8}/g, ' ');

  // 2. Strip citrus quantities & box counts
  cleaned = cleaned.replace(/(\d+\s*(?:키로|킬로|kg|Kg|KG)\s*\d+\s*(?:박스|상자|box))/gi, ' ');
  cleaned = cleaned.replace(/(\d+\s*(?:키로|킬로|kg|Kg|KG))/gi, ' ');
  cleaned = cleaned.replace(/(\d+\s*(?:박스|상자|box))/gi, ' ');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 3. Strip recipient name at beginning or end if accidentally duplicated
  if (customerName && customerName.trim().length >= 2) {
    const trimmedName = customerName.trim();
    const escaped = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp('^' + escaped + '(?:님|고객님|고객|귀하)?(?:\\s+|$)', 'i'), '');
    cleaned = cleaned.replace(new RegExp('(?:\\s+|^)' + escaped + '(?:님|고객님|고객|귀하)?$', 'i'), '');
  }

  // 4. Strip prefix labels
  cleaned = cleaned.replace(/^(?:주소|배송지|배송지주소|받는곳|받는분)\s*[:：]\s*/i, '');

  // 5. Clean up extra spaces and trailing punctuation
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[,;\-\.]+$/, '').trim();

  return cleaned;
}

/**
 * Format order for courier booking copy paste
 * e.g. 받는분: 홍길동 | 연락처: 010-1234-5678 | 주소: 제주 제주시 첨단로 123 | 배송메모: 부재 시 경비실
 */
export function formatCourierRow(
  name: string,
  phone: string,
  address: string,
  memo?: string
): string {
  const cleanAddr = cleanAddressForCourier(address, name, phone);
  const parts = [
    `받는분: ${name}`,
    `연락처: ${phone}`,
    `주소: ${cleanAddr}`,
  ];
  if (memo) {
    parts.push(`배송메모: ${memo}`);
  }
  return parts.join(' | ');
}

/**
 * Generate CSV text for bulk courier upload
 */
export function generateCourierCSV(orders: Array<{
  customerName: string;
  phone: string;
  address: string;
  itemSummary: string;
  memo?: string;
}>): string {
  const header = ['받는분성함', '휴대전화', '배송지주소', '주문상품', '배송요청사항'].join(',');
  const rows = orders.map(o => {
    const cleanAddr = `"${cleanAddressForCourier(o.address || '', o.customerName, o.phone).replace(/"/g, '""')}"`;
    const cleanItem = `"${(o.itemSummary || '').replace(/"/g, '""')}"`;
    const cleanMemo = `"${(o.memo || '').replace(/"/g, '""')}"`;
    return [o.customerName, o.phone, cleanAddr, cleanItem, cleanMemo].join(',');
  });
  return [header, ...rows].join('\n');
}
