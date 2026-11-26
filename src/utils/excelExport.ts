import * as XLSX from 'xlsx';
import { Order } from '../types';
import { cleanAddressForCourier } from './courier';

/**
 * 택배사 대량 접수 및 관리용 엑셀(.xlsx) 다운로드 유틸리티
 * 
 * 항목: 이름, 전화번호, 배송지주소, 품목, 수량
 */
export function exportCourierExcel(
  orders: Order[],
  titleSuffix = '택배접수목록'
): boolean {
  if (!orders || orders.length === 0) return false;

  const rows: Array<{
    '이름': string;
    '전화번호': string;
    '배송지주소': string;
    '품목': string;
    '수량': number;
  }> = [];

  orders.forEach((order) => {
    const cleanAddr = cleanAddressForCourier(
      order.address || '',
      order.customerName,
      order.phone
    ) || order.address || '';

    const items = order.items && order.items.length > 0 ? order.items : [];
    if (items.length === 0) {
      rows.push({
        '이름': order.customerName || '',
        '전화번호': order.phone || '',
        '배송지주소': cleanAddr,
        '품목': '감귤',
        '수량': 1,
      });
    } else {
      items.forEach((item) => {
        let itemLabel = item.name || '';
        const is10kg = item.type === '10kg' || /10\s*(?:kg|키로|킬로)/i.test(itemLabel);

        if (is10kg) {
          // 품목에서 10kg만 '노지감귤' 문구 제거 -> '10kg'
          itemLabel = itemLabel.replace(/노지\s*감귤\s*|노지감귤\s*|감귤\s*/g, '').trim() || '10kg';
        } else if (!itemLabel) {
          itemLabel = item.type === '5kg' ? '노지 감귤 5kg' : (item.type || '감귤');
        }

        rows.push({
          '이름': order.customerName || '',
          '전화번호': order.phone || '',
          '배송지주소': cleanAddr,
          '품목': itemLabel,
          '수량': item.quantity || 1,
        });
      });
    }
  });

  // Create worksheet from json
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set friendly column widths for Excel
  worksheet['!cols'] = [
    { wch: 14 }, // A: 이름
    { wch: 16 }, // B: 전화번호
    { wch: 45 }, // C: 배송지주소
    { wch: 11 }, // D: 품목 (너비 축소)
    { wch: 8 },  // E: 수량
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '택배접수목록');

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const fullFileName = `${dateStr}_${titleSuffix}.xlsx`;

  try {
    XLSX.writeFile(workbook, fullFileName);
  } catch {
    // Fallback using Blob URL
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fullFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return true;
}
