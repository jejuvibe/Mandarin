import React from 'react';
import { Settings } from 'lucide-react';
import { AppSettings } from '../types';

interface NavbarProps {
  currentTab: 'orders' | 'new-order' | 'customers' | 'revenue';
  onSelectTab: (tab: 'orders' | 'new-order' | 'customers' | 'revenue') => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  onOpenPreOrderModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  settings,
  onOpenSettings,
}) => {

  return (
    <header className="sticky top-0 z-40 bg-[#1f3d59] text-white shadow-sm border-b border-[#172e43]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: 🍊 해찬솔 농원 (귤 아이콘과 해찬솔 농원 사이 자연스러운 간격 적용) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-left font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap shrink-0 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span className="text-xl sm:text-2xl select-none leading-none">🍊</span>
            <span>{settings.farmName ? settings.farmName.replace('해찬솔농원', '해찬솔 농원') : '해찬솔 농원'}</span>
          </button>
        </div>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-200">
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'orders'
                ? 'text-white font-bold border-b-2 border-[#62a4bc]'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            주문 내역
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('new-order')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'new-order'
                ? 'text-white font-bold border-b-2 border-[#62a4bc]'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            주문 접수
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('customers')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'customers'
                ? 'text-white font-bold border-b-2 border-[#62a4bc]'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            주소록
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('revenue')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
              currentTab === 'revenue'
                ? 'text-white font-bold border-b-2 border-[#62a4bc]'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            매출·순수익 현황
          </button>
        </nav>

        {/* Zone 3: Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="판매금액 및 농원 설정"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
