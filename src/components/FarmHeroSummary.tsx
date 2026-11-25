import React from 'react';
import { Calendar, MessageSquare, Plus, Package, ClipboardList } from 'lucide-react';
import { AppSettings, Order } from '../types';

interface FarmHeroSummaryProps {
  orders: Order[];
  settings: AppSettings;
  onOpenSmartPaste: () => void;
  onOpenNewOrder: () => void;
  onOpenPreOrderModal: () => void;
}

export const FarmHeroSummary: React.FC<FarmHeroSummaryProps> = ({
  orders,
  onOpenNewOrder,
  onOpenPreOrderModal,
}) => {
  // Orders ready for packaging & dispatch (order_received, preparing, in_transit)
  // Excludes delivered (배송완료), cancelled, and payment_pending (입금대기)
  const pendingPackingOrders = orders.filter(
    (o) => o.status === 'order_received' || o.status === 'preparing' || o.status === 'in_transit'
  );
  const pendingOrders = orders.filter((o) => o.status === 'payment_pending');

  // Breakdown of pending packing boxes by weight (10kg, 5kg, custom)
  const packingBreakdown = pendingPackingOrders.reduce(
    (acc, order) => {
      order.items?.forEach((item) => {
        if (item.type === '10kg') {
          acc.qty10kg += item.quantity || 0;
        } else if (item.type === '5kg') {
          acc.qty5kg += item.quantity || 0;
        } else {
          const label = item.name || '기타';
          acc.custom[label] = (acc.custom[label] || 0) + (item.quantity || 0);
        }
      });
      return acc;
    },
    { qty10kg: 0, qty5kg: 0, custom: {} as Record<string, number> }
  );

  const totalPendingBoxes =
    packingBreakdown.qty10kg +
    packingBreakdown.qty5kg +
    Object.values(packingBreakdown.custom).reduce((a, b) => a + b, 0);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#f7e2e2] text-slate-800 shadow-2xs border border-[#ecd2d2] p-2.5 sm:p-3 space-y-2">
      {/* 상단 헤더: 귤주문관리 타이틀 & 액션 버튼 */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Left: 귤주문관리 타이틀 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ClipboardList className="w-4 h-4 text-[#5c7eb1]" />
          <h1 className="text-sm sm:text-base font-bold text-[#1f3d59] tracking-tight whitespace-nowrap">
            귤주문관리
          </h1>
        </div>

        {/* Right: 주문안내문자 & 주문접수 버튼 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenPreOrderModal}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-[#1f3d59] border border-[#ecd2d2] transition-all shadow-2xs hover:scale-101 active:scale-98 whitespace-nowrap cursor-pointer"
            title="주문 전 고객에게 가격, 계좌번호, 발송안내 문자 전송"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#5c7eb1]" />
            <span>주문안내문자</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewOrder}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#5c7eb1] hover:bg-[#4d6c99] text-white transition-all shadow-xs active:scale-98 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>주문접수</span>
          </button>
        </div>
      </div>

      {/* 내부 하얀색 미포장 내역 박스 */}
      <div className="bg-white rounded-lg sm:rounded-xl border border-[#ecd2d2] shadow-2xs px-2.5 py-2 sm:px-3 sm:py-2">
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          {/* Left / Center: 미포장내역 -> 10kg, 5kg 박스 -> (총 N건 / M박스 작업 필요) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* 1. 미포장내역 라벨 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Package className="w-4 h-4 text-[#5c7eb1] shrink-0" />
              <span className="text-sm font-bold text-[#1f3d59] tracking-tight whitespace-nowrap">
                미포장내역
              </span>
            </div>

            {/* 2. 10kg 박스 (소프트 블러시 핑크 배색) */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#f7e2e2] border border-[#ecd2d2] shadow-2xs whitespace-nowrap text-xs">
              <span className="text-slate-500 font-normal text-[11px]">10kg</span>
              <span className="text-[#5c7eb1] font-bold font-mono text-xs sm:text-sm">
                {packingBreakdown.qty10kg}박스
              </span>
            </div>

            {/* 2. 5kg 박스 (소프트 슬레이트/화이트 배색) */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 shadow-2xs whitespace-nowrap text-xs">
              <span className="text-slate-500 font-normal text-[11px]">5kg</span>
              <span className="text-[#5c7eb1] font-bold font-mono text-xs sm:text-sm">
                {packingBreakdown.qty5kg}박스
              </span>
            </div>

            {/* 맞춤 박스 (있을 경우) */}
            {Object.entries(packingBreakdown.custom).map(([name, qty]) => (
              <div
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-50 border border-slate-200 shadow-2xs whitespace-nowrap text-xs"
              >
                <span className="text-slate-500 font-normal text-[11px]">{name}</span>
                <span className="text-[#5c7eb1] font-bold font-mono text-xs sm:text-sm">
                  {qty}박스
                </span>
              </div>
            ))}

            {/* 3. 박스 없이 글씨만 빨간색 (0박스와 비슷한 text-xs sm:text-sm 크기) */}
            <span
              className={`text-xs sm:text-sm font-bold whitespace-nowrap ml-0.5 ${
                totalPendingBoxes > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {totalPendingBoxes > 0
                ? `(총 ${pendingPackingOrders.length}건 / ${totalPendingBoxes}박스 작업 필요)`
                : '(포장 완료 ✨)'}
            </span>
          </div>

          {/* Right: 그 오른쪽으로 발송 예정 1건 | 입금 대기 1건 표시 */}
          <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[#5c7eb1] flex items-center gap-1 font-semibold text-[11px]">
                <Calendar className="w-3 h-3 text-[#5c7eb1]" />
                발송 예정
              </span>
              <span className="font-bold text-[#1f3d59] font-mono ml-0.5 text-xs">
                {pendingPackingOrders.length}건
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-500 font-medium">입금 대기</span>
              <span className="font-bold text-rose-600 font-mono ml-0.5 text-xs">
                {pendingOrders.length}건
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
