import React, { useState } from 'react';
import { Search, Plus, Copy, Package } from 'lucide-react';
import { Order, OrderStatus, AppSettings } from '../types';
import { OrderTable } from './OrderTable';
import { copyToClipboard } from '../utils/clipboard';
import { formatCourierRow, formatBulkCourierOrders } from '../utils/courier';
import { getOrderSeasonKey, getAllSeasonKeys } from '../utils/season';
import { useToast } from './Toast';

interface OrderListProps {
  orders: Order[];
  settings: AppSettings;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, dispatchDate?: string, trackingNumber?: string) => void;
  onOpenNewOrder: () => void;
  onOpenSmartPaste: () => void;
  onOpenMessageModal: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  settings,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onOpenNewOrder,
  onOpenSmartPaste,
  onOpenMessageModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { showToast } = useToast();

  const availableSeasons = getAllSeasonKeys(orders, settings.customSeasons, settings.deletedSeasons);

  // Filtered list
  const filteredOrders = orders.filter((order) => {
    // Search match
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchName = order.customerName.toLowerCase().includes(term);
      const matchPhone = order.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, ''));
      const matchAddr = order.address.toLowerCase().includes(term);
      const matchTracking = (order.trackingNumber || '').includes(term);
      if (!matchName && !matchPhone && !matchAddr && !matchTracking) return false;
    }

    // Status filter: Only payment_pending, order_received, delivered
    if (statusFilter !== 'all') {
      if (statusFilter === 'order_received') {
        if (order.status !== 'order_received' && order.status !== 'preparing' && order.status !== 'in_transit') {
          return false;
        }
      } else if (order.status !== statusFilter) {
        return false;
      }
    }

    // Season filter (12월 ~ 익년 1월/2월 연결 시즌)
    if (seasonFilter !== 'all') {
      const orderSeason = getOrderSeasonKey(order.createdAt || order.dispatchDate);
      if (orderSeason !== seasonFilter) return false;
    }

    // Date filter
    if (dateFilter && order.dispatchDate !== dateFilter) {
      return false;
    }

    return true;
  });

  // Count orders by status
  const paymentPendingCount = orders.filter((o) => o.status === 'payment_pending').length;
  const receivedOrdersCount = orders.filter(
    (o) => o.status === 'order_received' || o.status === 'preparing' || o.status === 'in_transit'
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  // Bulk copy only orders that are in 'order_received' status (User requirement)
  const handleBulkCopy = async () => {
    const targetOrders = filteredOrders.filter(
      (o) => o.status === 'order_received' || o.status === 'preparing' || o.status === 'in_transit'
    );

    if (targetOrders.length === 0) {
      showToast('주문접수(발송 대기) 상태인 주문이 없습니다.', 'info');
      return;
    }

    const fullText = formatBulkCourierOrders(targetOrders);
    const ok = await copyToClipboard(fullText);
    if (ok) {
      showToast(`[주문접수] ${targetOrders.length}건의 택배정보가 발송내역별로 복사되었습니다!`, 'copy');
    }
  };

  // Sort orders:
  // 1. Uncompleted/Pending dispatch orders (status !== 'delivered') float to the TOP.
  // 2. Completed/Delivered orders (status === 'delivered') sink to the BOTTOM.
  // 3. Within each group, sort by date (dispatchDate or createdAt) descending.
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aDelivered = a.status === 'delivered';
    const bDelivered = b.status === 'delivered';

    if (!aDelivered && bDelivered) return -1;
    if (aDelivered && !bDelivered) return 1;

    const dateA = a.dispatchDate || a.createdAt || '';
    const dateB = b.dispatchDate || b.createdAt || '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return (b.id || '').localeCompare(a.id || '');
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search & Quick Actions Bar (Ultra-Compact & Slim) */}
      <div className="bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5 sm:gap-2">
          {/* Left group: Status Filter Tabs + Season + Date */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Status Buttons: Compact segmented buttons */}
            <div className="inline-flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-0.5 cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#5c7eb1] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>전체</span>
                <span className="font-mono text-[10px]">({orders.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('payment_pending')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-0.5 cursor-pointer ${
                  statusFilter === 'payment_pending'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>입금대기</span>
                <span className="font-mono text-[10px]">({paymentPendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('order_received')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-0.5 cursor-pointer ${
                  statusFilter === 'order_received'
                    ? 'bg-[#487294] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>주문접수</span>
                <span className="font-mono text-[10px]">({receivedOrdersCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('delivered')}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-0.5 cursor-pointer ${
                  statusFilter === 'delivered'
                    ? 'bg-[#264c67] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>배송완료</span>
                <span className="font-mono text-[10px]">({deliveredCount})</span>
              </button>
            </div>

            {/* Season Selector */}
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="py-1 px-2 text-[11px] rounded-lg border border-slate-200 font-medium bg-slate-50 text-slate-700 outline-none cursor-pointer hover:border-slate-300 shrink-0"
            >
              <option value="all">모든 시즌</option>
              {availableSeasons.map((sk) => (
                <option key={sk} value={sk}>
                  {sk} 시즌
                </option>
              ))}
            </select>

            {/* Date Picker */}
            <div className="flex items-center gap-0.5 shrink-0">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                onClick={(e) => {
                  try {
                    (e.currentTarget as HTMLInputElement).showPicker?.();
                  } catch {
                    // fallback
                  }
                }}
                className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-white font-sans text-slate-700 hover:border-[#5c7eb1] cursor-pointer shadow-2xs outline-none"
                title="클릭하여 달력 선택 또는 날짜 직접 입력"
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter('')}
                  className="text-[10px] text-slate-400 hover:text-slate-700 px-1 cursor-pointer"
                  title="날짜 필터 초기화"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right group: 주문검색 (택배정보 일괄복사 바로 왼쪽 배치) + 택배정보 일괄복사 */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto">
            {/* Search Input: Placed directly on the LEFT of 택배정보 일괄복사 */}
            <div className="relative flex-1 lg:w-56 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="주문 검색 (이름, 번호, 주소)"
                className="w-full pl-7 pr-6 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#62a4bc] focus:border-[#62a4bc] bg-slate-50/50 hover:bg-white transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  title="검색어 지우기"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Bulk copy button */}
            <button
              type="button"
              onClick={handleBulkCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[#f7e2e2] hover:bg-[#eed7d7] text-[#264c67] border border-[#ecd2d2] transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
              title="주문접수 상태인 주문만 골라서 택배 접수용 양식으로 일괄 복사합니다."
            >
              <Copy className="w-3 h-3 text-[#5c7eb1]" />
              <span>택배정보 일괄복사</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-[#5c7eb1] text-[10px] font-medium text-white tracking-normal font-sans leading-none">
                {receivedOrdersCount}건
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Orders List Container */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#f7e2e2] text-[#5c7eb1] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#264c67]">
              {orders.length > 0 ? '선택한 조건에 맞는 주문이 없습니다' : '등록된 주문이 없습니다'}
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              {orders.length > 0
                ? `현재 전체 주문이 ${orders.length}건 있습니다. 아래 버튼을 눌러 필터를 해제해 보세요.`
                : '새로운 감귤 주문을 등록하거나 메시지를 붙여넣어 보세요.'}
            </p>
          </div>
          {orders.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('');
                setSeasonFilter('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5c7eb1] hover:bg-[#4d6c99] rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              전체 주문 보기 (필터 초기화: 총 {orders.length}건)
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#5c7eb1] hover:bg-[#4d6c99] rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              첫 주문 등록하기
            </button>
          )}
        </div>
      ) : (
        /* Tabular Format: Pass sortedOrders so uncompleted orders are at top, completed orders at bottom */
        <OrderTable
          orders={sortedOrders}
          settings={settings}
          onEditOrder={onEditOrder}
          onDeleteOrder={onDeleteOrder}
          onUpdateStatus={onUpdateStatus}
          onOpenMessageModal={onOpenMessageModal}
        />
      )}
    </div>
  );
};
