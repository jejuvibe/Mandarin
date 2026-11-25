import React, { useState } from 'react';
import {
  DollarSign,
  Truck,
  TrendingUp,
  Package,
  Calendar,
  Download,
  PieChart,
  CheckCircle2,
  Lock,
  Unlock,
  FileCheck,
  Printer,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import { Order, AppSettings, SeasonSettlement } from '../types';
import { generateCourierCSV } from '../utils/courier';
import { getOrderSeasonKey, getAllSeasonKeys, getNextSeasonKey, formatSeasonLabel, calculateSeasonTotals } from '../utils/season';
import { useToast } from './Toast';

interface RevenueDashboardProps {
  orders: Order[];
  settings: AppSettings;
  onSaveSettlement: (seasonKey: string, settlement: SeasonSettlement) => void;
  onReopenSettlement: (seasonKey: string) => void;
  onAddSeason?: (newSeasonKey: string) => void;
  onDeleteSeason?: (seasonKey: string) => void;
}

export const RevenueDashboard: React.FC<RevenueDashboardProps> = ({
  orders,
  settings,
  onSaveSettlement,
  onReopenSettlement,
  onAddSeason,
  onDeleteSeason,
}) => {
  const { showToast } = useToast();
  const availableSeasons = getAllSeasonKeys(orders, settings.customSeasons, settings.deletedSeasons);
  const nextSeasonKey = getNextSeasonKey(availableSeasons);
  const currentSeasonKey = getOrderSeasonKey(new Date().toISOString().slice(0, 10));

  const handleCreateNextSeason = () => {
    if (onAddSeason) {
      onAddSeason(nextSeasonKey);
      setSelectedSeason(nextSeasonKey);
      showToast(`${nextSeasonKey} 새 감귤 시즌이 생성되었습니다!`, 'success');
    }
  };

  const handleDeleteSelectedSeason = () => {
    if (!onDeleteSeason) return;

    if (seasonOrders.length > 0) {
      showToast(
        `${formatSeasonLabel(selectedSeason)}에 등록된 주문(${seasonOrders.length}건)이 있어 시즌을 삭제할 수 없습니다.`,
        'error'
      );
      return;
    }

    onDeleteSeason(selectedSeason);
    const remainingSeasons = availableSeasons.filter((sk) => sk !== selectedSeason);
    if (remainingSeasons.length > 0) {
      setSelectedSeason(remainingSeasons[0]);
    } else {
      setSelectedSeason(currentSeasonKey);
    }
    showToast(`${selectedSeason} 감귤 시즌이 삭제되었습니다.`, 'info');
  };

  const [selectedSeason, setSelectedSeason] = useState<string>(availableSeasons[0] || currentSeasonKey);
  const [periodFilter, setPeriodFilter] = useState<'season' | 'month' | 'today'>('season');
  const [monthFilter, setMonthFilter] = useState<string>(''); // e.g. '2026-12' or '2027-01'
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementNote, setSettlementNote] = useState('');

  const currentSettlement = settings.settlements?.[selectedSeason];
  const isSeasonClosed = currentSettlement?.isClosed;

  // Filter orders by season and sub-filters
  const seasonOrders = orders.filter((order) => {
    if (order.status === 'cancelled') return false;
    const seasonKey = getOrderSeasonKey(order.createdAt || order.dispatchDate);
    if (seasonKey !== selectedSeason) return false;

    if (periodFilter === 'month' && monthFilter) {
      const orderMonth = order.createdAt.slice(0, 7);
      if (orderMonth !== monthFilter) return false;
    }
    if (periodFilter === 'today') {
      const todayStr = new Date().toISOString().slice(0, 10);
      if (order.createdAt.slice(0, 10) !== todayStr) return false;
    }

    return true;
  });

  // Calculate totals
  const totalRevenue = seasonOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalShippingCost = seasonOrders.reduce((sum, o) => sum + o.shippingCost, 0);
  const totalBoxCost = seasonOrders.reduce((sum, o) => sum + (o.boxCost || 0), 0);
  const totalNetProfit = totalRevenue - totalShippingCost - totalBoxCost;
  const profitMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  // Box calculations
  let total10kgBoxes = 0;
  let total5kgBoxes = 0;

  seasonOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.type === '10kg') total10kgBoxes += item.quantity;
      if (item.type === '5kg') total5kgBoxes += item.quantity;
    });
  });

  const totalBoxes = total10kgBoxes + total5kgBoxes;
  const boxPrice10kg = settings.pricing.boxPrice10kg || 1800;
  const boxPrice5kg = settings.pricing.boxPrice5kg || 1200;

  // Status breakdown: only payment_pending, order_received, delivered
  const statusCounts = {
    payment_pending: seasonOrders.filter((o) => o.status === 'payment_pending').length,
    order_received: seasonOrders.filter((o) => o.status === 'order_received' || o.status === 'preparing' || o.status === 'in_transit').length,
    delivered: seasonOrders.filter((o) => o.status === 'delivered').length,
  };

  // Perform Final Settlement Closing
  const handleConfirmSettlement = () => {
    const settlementData: SeasonSettlement = {
      seasonKey: selectedSeason,
      seasonName: formatSeasonLabel(selectedSeason),
      isClosed: true,
      closedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      totalRevenue,
      totalShippingCost,
      totalBoxCost,
      totalNetProfit,
      totalOrders: seasonOrders.length,
      total10kgBoxes,
      total5kgBoxes,
      note: settlementNote.trim() || undefined,
    };

    onSaveSettlement(selectedSeason, settlementData);
    setIsSettlementModalOpen(false);
    showToast(`${selectedSeason} 감귤 시즌이 최종 마감 및 정산되었습니다.`, 'success');
  };

  const handleReopenSeason = () => {
    onReopenSettlement(selectedSeason);
    showToast(`${formatSeasonLabel(selectedSeason)} 시즌 정산 마감이 해제되었습니다.`, 'info');
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvContent = generateCourierCSV(
      seasonOrders.map((o) => ({
        customerName: o.customerName,
        phone: o.phone,
        address: o.address,
        itemSummary: o.items.map((i) => `${i.name} ${i.quantity}박스`).join(' / '),
        memo: o.memo,
      }))
    );

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeju-citrus-${selectedSeason}-settlement.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('정산 및 주문 내역이 CSV로 다운로드되었습니다.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Season Selection & Settlement Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-[#5c7eb1]" />
            감귤 시즌 선택:
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="p-2 text-xs sm:text-sm font-bold text-[#1b1430] rounded-xl border border-slate-200 bg-[#f7e2e2]/30 hover:bg-[#f7e2e2]/60 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30"
          >
            {availableSeasons.map((sk) => (
              <option key={sk} value={sk}>
                {formatSeasonLabel(sk)} {settings.settlements?.[sk]?.isClosed ? '(마감완료)' : ''}
              </option>
            ))}
          </select>

          {/* New Season Button */}
          <button
            type="button"
            onClick={handleCreateNextSeason}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-dashed border-[#5c7eb1] text-[#1f3d59] bg-[#5c7eb1]/10 hover:bg-[#5c7eb1]/20 transition-colors shadow-2xs"
            title="그다음 연도 새 감귤 시즌 생성"
          >
            <Plus className="w-3.5 h-3.5 text-[#5c7eb1]" />
            새 시즌 추가 (+ {nextSeasonKey})
          </button>

          {/* Delete Season Button */}
          <button
            type="button"
            onClick={handleDeleteSelectedSeason}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs"
            title={`${selectedSeason} 감귤 시즌 삭제 (등록된 주문이 없는 경우만 삭제 가능)`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            시즌 삭제
          </button>

          {isSeasonClosed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f7e2e2] text-[#1b1430] text-xs font-semibold border border-[#ecd2d2]">
              <Lock className="w-3.5 h-3.5 text-[#5c7eb1]" />
              시즌 마감 완료 ({currentSettlement?.closedAt})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#62a4bc]/15 text-[#1b1430] text-xs font-semibold border border-[#62a4bc]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#2d738d]" />
              시즌 진행 중 (실시간 집계)
            </span>
          )}
        </div>

        {/* Action Buttons: Final Settlement & CSV */}
        <div className="flex items-center gap-2">
          {isSeasonClosed ? (
            <button
              type="button"
              onClick={handleReopenSeason}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              마감 해제
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSettlementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-[#1b1430] hover:bg-[#2c224d] text-white shadow-xs transition-colors"
            >
              <FileCheck className="w-4 h-4" />
              시즌 최종 마감 및 정산
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            정산서 다운로드
          </button>
        </div>
      </div>

      {/* Cross-Year Month Filtering inside Selected Season */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 font-medium">상세 기간:</span>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('season');
              setMonthFilter('');
            }}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              periodFilter === 'season'
                ? 'bg-[#1b1430] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            시즌 전체 (11월~1월/2월)
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('month');
              const [y1] = selectedSeason.split('-');
              setMonthFilter(`${y1}-11`);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              periodFilter === 'month' && monthFilter.endsWith('-11')
                ? 'bg-[#5c7eb1] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            11월 (시즌 개시)
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('month');
              const [y1] = selectedSeason.split('-');
              setMonthFilter(`${y1}-12`);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              periodFilter === 'month' && monthFilter.endsWith('-12')
                ? 'bg-[#5c7eb1] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            12월 (성수기 출하)
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('month');
              const [, y2] = selectedSeason.split('-');
              setMonthFilter(`${y2}-01`);
            }}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              periodFilter === 'month' && monthFilter.endsWith('-01')
                ? 'bg-[#5c7eb1] text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            익년 1월 (설 대목/마감)
          </button>
        </div>

        <div className="text-slate-500 font-medium">
          해당 기간 주문: <strong className="text-[#1b1430]">{seasonOrders.length}</strong>건
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">총 판매 매출액</span>
            <div className="p-1.5 rounded-lg bg-[#f7e2e2] text-[#5c7eb1]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#1b1430] font-mono tracking-tight">
              {totalRevenue.toLocaleString('ko-KR')}
              <span className="text-xs sm:text-sm font-medium text-slate-500 ml-1">원</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              총 {seasonOrders.length}건 유효 주문
            </div>
          </div>
        </div>

        {/* 2. Total Shipping Cost */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">총 택배비 (비용)</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono tracking-tight">
              -{totalShippingCost.toLocaleString('ko-KR')}
              <span className="text-xs sm:text-sm font-medium text-rose-500 ml-1">원</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              건별/상자당 배송 원가
            </div>
          </div>
        </div>

        {/* 3. Total Box Cost (User requested: 5kg, 10kg different box cost) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">총 박스비 원가</span>
            <div className="p-1.5 rounded-lg bg-[#f7e2e2] text-[#5c7eb1]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#5c7eb1] font-mono tracking-tight">
              -{totalBoxCost.toLocaleString('ko-KR')}
              <span className="text-xs sm:text-sm font-medium text-[#5c7eb1] ml-1">원</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 leading-tight">
              10kg: {total10kgBoxes}장(장당 {boxPrice10kg}원) · 5kg: {total5kgBoxes}장(장당 {boxPrice5kg}원)
            </div>
          </div>
        </div>

        {/* 4. Final Net Profit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-medium">최종 순수익 (매출 - 택배비 - 박스비)</span>
            <div className="p-1.5 rounded-lg bg-[#62a4bc]/15 text-[#2d738d]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                totalNetProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
              }`}
            >
              {totalNetProfit > 0 ? '+' : ''}{totalNetProfit.toLocaleString('ko-KR')}
              <span
                className={`text-xs sm:text-sm font-medium ml-1 ${
                  totalNetProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
                }`}
              >
                원
              </span>
            </div>
            <div
              className={`text-[11px] font-medium mt-1 ${
                totalNetProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
              }`}
            >
              순수익률 {profitMargin}% (마진)
            </div>
          </div>
        </div>
      </div>

      {/* Shipment Breakdown & Box Production Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box Production Analysis */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1b1430] uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#5c7eb1]" />
            {selectedSeason} 시즌 출하 상자 내역
          </h3>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-[#5c7eb1]/10 border border-[#5c7eb1]/30">
              <div className="text-[11px] text-slate-500">10kg 출하량</div>
              <div className="text-lg font-bold text-[#1b1430] font-mono mt-0.5">
                {total10kgBoxes}박스
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                박스비: {(total10kgBoxes * boxPrice10kg).toLocaleString('ko-KR')}원
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#62a4bc]/15 border border-[#62a4bc]/30">
              <div className="text-[11px] text-slate-500">5kg 출하량</div>
              <div className="text-lg font-bold text-[#1b1430] font-mono mt-0.5">
                {total5kgBoxes}박스
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                박스비: {(total5kgBoxes * boxPrice5kg).toLocaleString('ko-KR')}원
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[11px] text-slate-500">총 출하량</div>
              <div className="text-lg font-bold text-[#1b1430] font-mono mt-0.5">
                {totalBoxes}박스
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                총 박스비: {totalBoxCost.toLocaleString('ko-KR')}원
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1b1430] uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-[#5c7eb1]" />
            시즌 배송 현황
          </h3>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-rose-600">입금 대기</div>
              <div className="text-base font-bold text-[#1b1430] font-mono mt-0.5">
                {statusCounts.payment_pending}건
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-[#5c7eb1] font-semibold">주문 접수</div>
              <div className="text-base font-bold text-[#1b1430] font-mono mt-0.5">
                {statusCounts.order_received}건
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] text-[#2d738d] font-semibold">배송 완료</div>
              <div className="text-base font-bold text-[#1b1430] font-mono mt-0.5">
                {statusCounts.delivered}건
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Season Final Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#5c7eb1]" />
                <h3 className="text-base font-bold text-[#1b1430]">
                  {formatSeasonLabel(selectedSeason)} 최종 마감 및 정산서
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div className="p-3.5 bg-[#f7e2e2]/60 rounded-xl border border-[#ecd2d2] text-xs text-[#1b1430] space-y-1">
                <p className="font-bold">최종 정산 안내</p>
                <p>
                  11월부터 익년 1월/2월까지의 모든 감귤 주문, 택배비, 5kg/10kg 박스 원가를 확정하여 순수익을 마감 처리합니다.
                </p>
              </div>

              {/* Settlement Summary Sheet */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">감귤 시즌</span>
                  <span className="font-bold text-[#1b1430]">{selectedSeason} 시즌</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">총 유효 주문 건수</span>
                  <span className="font-bold text-[#1b1430]">{seasonOrders.length}건</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">총 출하 상자</span>
                  <span className="font-bold text-[#1b1430]">
                    {totalBoxes}박스 (10kg: {total10kgBoxes} / 5kg: {total5kgBoxes})
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">총 판매 매출액 (+)</span>
                  <span className="font-bold font-mono text-[#1b1430]">
                    {totalRevenue.toLocaleString('ko-KR')}원
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">총 배송 택배비 (-)</span>
                  <span className="font-bold font-mono text-rose-700">
                    -{totalShippingCost.toLocaleString('ko-KR')}원
                  </span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">총 박스비 원가 (-)</span>
                  <span className="font-bold font-mono text-[#5c7eb1]">
                    -{totalBoxCost.toLocaleString('ko-KR')}원
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 flex justify-between text-sm">
                  <span className="font-bold text-[#1b1430]">최종 확정 순수익 (=)</span>
                  <span
                    className={`font-black font-mono text-base ${
                      totalNetProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
                    }`}
                  >
                    {totalNetProfit > 0 ? '+' : ''}{totalNetProfit.toLocaleString('ko-KR')}원 ({profitMargin}%)
                  </span>
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  정산 비고 / 특이사항 (선택)
                </label>
                <input
                  type="text"
                  value={settlementNote}
                  onChange={(e) => setSettlementNote(e.target.value)}
                  placeholder="예: 영농자금 정산 완료, 1월 중순 수확 완료"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmSettlement}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1b1430] hover:bg-[#2c224d] rounded-xl inline-flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-[#62a4bc]" />
                시즌 최종 마감 확정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
