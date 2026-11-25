export interface CourierInfo {
  code: string;
  name: string;
  defaultTrackingUrl: (trackingNumber: string) => string;
}

export const COURIERS: CourierInfo[] = [
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
    code: 'cj',
    name: 'CJ대한통운',
    defaultTrackingUrl: (n) => `https://www.doortodoor.co.kr/tracking/jsp/cplus/mpbz0230.jsp?invc_no=${encodeURIComponent(n)}`,
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
 * Format order for courier booking copy paste
 * e.g. [수령인] 홍길동 | [전화] 010-1234-5678 | [주소] 제주 제주시 첨단로 123 | [품목] 노지감귤 10kg (1박스)
 */
export function formatCourierRow(
  name: string,
  phone: string,
  address: string,
  itemDesc: string,
  memo?: string
): string {
  const parts = [
    `받는분: ${name}`,
    `연락처: ${phone}`,
    `주소: ${address}`,
    `품목: ${itemDesc}`,
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
    const cleanAddr = `"${(o.address || '').replace(/"/g, '""')}"`;
    const cleanItem = `"${(o.itemSummary || '').replace(/"/g, '""')}"`;
    const cleanMemo = `"${(o.memo || '').replace(/"/g, '""')}"`;
    return [o.customerName, o.phone, cleanAddr, cleanItem, cleanMemo].join(',');
  });
  return [header, ...rows].join('\n');
}
