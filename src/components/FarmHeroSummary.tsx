import React from 'react';
import { Calendar, MessageSquare, Plus } from 'lucide-react';
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
  // All pending dispatch orders (excluding delivered, cancelled, and pending payment)
  const pendingDispatchOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'payment_pending'
  );
  const pendingOrders = orders.filter((o) => o.status === 'payment_pending');

  return (
    /* Compact banner: 귤주문관리 옆에 주문안내문자, 주문접수 나란히 배치하여 슬림하고 깔끔하게 */
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[#f7e2e2] text-slate-800 shadow-xs border border-[#ecd2d2]">
      <div className="relative z-10 px-3.5 py-2.5 sm:px-5 sm:py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: 귤주문관리 + 주문안내문자 + 주문접수 나란히 배치 */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-base select-none leading-none">🍊</span>
            <h1 className="text-sm sm:text-base font-bold text-[#1f3d59] tracking-tight whitespace-nowrap">
              귤주문관리
            </h1>
          </div>

          <div className="h-3.5 w-px bg-[#ecd2d2] hidden sm:block" />

          {/* Compact buttons: 주문안내문자 & 주문접수 */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onOpenPreOrderModal}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-[#1f3d59] border border-[#ecd2d2] transition-all shadow-2xs hover:scale-101 active:scale-98 whitespace-nowrap cursor-pointer"
              title="주문 전 고객에게 가격, 계좌번호, 발송안내 문자 전송"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#5c7eb1]" />
              <span>주문안내문자</span>
            </button>

            <button
              type="button"
              onClick={onOpenNewOrder}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5c7eb1] hover:bg-[#4d6c99] text-white transition-all shadow-xs active:scale-98 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>주문접수</span>
            </button>
          </div>
        </div>

        {/* Right: Quick KPI Chip (발송 예정 & 입금 대기) */}
        <div className="shrink-0 flex items-center gap-2.5 text-xs bg-white/90 border border-[#ecd2d2] px-3 py-1.5 rounded-lg shadow-2xs">
          <div className="flex items-center gap-1">
            <span className="text-[#5c7eb1] flex items-center gap-1 font-semibold">
              <Calendar className="w-3 h-3 text-[#5c7eb1]" />
              발송 예정
            </span>
            <span className="font-bold text-[#1f3d59] font-mono ml-0.5">
              {pendingDispatchOrders.length}건
            </span>
          </div>
          <span className="text-[#ecd2d2]">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">입금 대기</span>
            <span className="font-bold text-rose-600 font-mono ml-0.5">
              {pendingOrders.length}건
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
