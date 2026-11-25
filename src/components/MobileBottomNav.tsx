import React from 'react';
import { ClipboardList, PlusCircle, Users, BarChart3, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'orders' | 'new-order' | 'customers' | 'revenue';
  onSelectTab: (tab: 'orders' | 'new-order' | 'customers' | 'revenue') => void;
  onOpenSettings: () => void;
  pendingPaymentCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  pendingPaymentCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {/* Tab 1: Orders */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors relative ${
            currentTab === 'orders' ? 'text-[#1b1430] font-bold' : 'text-slate-400 hover:text-[#1b1430]'
          }`}
        >
          <ClipboardList className={`w-5 h-5 ${currentTab === 'orders' ? 'text-[#5c7eb1]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">주문목록</span>
          {pendingPaymentCount > 0 && (
            <span className="absolute top-1 right-3.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Tab 2: New Order */}
        <button
          type="button"
          onClick={() => onSelectTab('new-order')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'new-order' ? 'text-[#1b1430] font-bold' : 'text-slate-400 hover:text-[#1b1430]'
          }`}
        >
          <PlusCircle className="w-5 h-5 text-[#5c7eb1]" />
          <span className="text-[10px] mt-1 tracking-tight">새 주문</span>
        </button>

        {/* Tab 3: Customers */}
        <button
          type="button"
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'customers' ? 'text-[#1b1430] font-bold' : 'text-slate-400 hover:text-[#1b1430]'
          }`}
        >
          <Users className={`w-5 h-5 ${currentTab === 'customers' ? 'text-[#5c7eb1]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">주소록</span>
        </button>

        {/* Tab 4: Revenue */}
        <button
          type="button"
          onClick={() => onSelectTab('revenue')}
          className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
            currentTab === 'revenue' ? 'text-[#1b1430] font-bold' : 'text-slate-400 hover:text-[#1b1430]'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${currentTab === 'revenue' ? 'text-[#5c7eb1]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">매출현황</span>
        </button>

        {/* Tab 5: Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center min-h-[44px] py-1 text-slate-400 hover:text-[#1b1430] transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">단가설정</span>
        </button>
      </div>
    </nav>
  );
};
