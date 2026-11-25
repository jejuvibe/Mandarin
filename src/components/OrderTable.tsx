import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Edit, Trash2, FileText } from 'lucide-react';
import { Order, OrderStatus, AppSettings } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './Toast';

interface OrderTableProps {
  orders: Order[];
  settings: AppSettings;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus, dispatchDate?: string, trackingNumber?: string) => void;
  onOpenMessageModal: (order: Order) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onOpenMessageModal,
}) => {
  const { showToast } = useToast();
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const handleCellCopy = async (e: React.MouseEvent, text: string, cellKey: string, label: string) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedCell(cellKey);
      showToast(`${label} 복사되었습니다!`, 'copy');
      setTimeout(() => setCopiedCell(null), 1400);
    }
  };

  const handleToggleDelivered = (order: Order, checked: boolean) => {
    if (checked) {
      const today = new Date().toISOString().slice(0, 10);
      onUpdateStatus(order.id, 'delivered', order.dispatchDate || today);
      showToast(`${order.customerName}님 발송완료 처리되었습니다. (목록 하단으로 이동)`, 'success');
    } else {
      onUpdateStatus(order.id, 'order_received');
      showToast(`${order.customerName}님 마감이 해제되었습니다. (주문접수 상태로 상단 이동)`, 'info');
    }
  };

  const handleDispatchDateChange = (orderId: string, newDate: string, currentStatus: OrderStatus) => {
    onUpdateStatus(orderId, currentStatus, newDate);
    showToast('발송(예정)일이 변경되었습니다.', 'success');
  };

  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'payment_pending':
        return (
          <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-1.5 py-0.5 rounded">
            입금대기
          </span>
        );
      case 'order_received':
      case 'preparing':
      case 'in_transit':
        return (
          <span className="text-[11px] font-semibold text-[#1f3d59] bg-[#f7e2e2] border border-[#ecd2d2] px-1.5 py-0.5 rounded">
            주문접수
          </span>
        );
      case 'delivered':
        return (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
            배송완료
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            취소
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold select-none">
              <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">발송완료/마감</th>
              <th className="py-2.5 px-2 w-20 whitespace-nowrap">이름</th>
              <th className="py-2.5 px-2 w-28 whitespace-nowrap">전화번호</th>
              <th className="py-2.5 px-3 min-w-[220px]">배송지 주소</th>
              <th className="py-2.5 px-2 w-20 whitespace-nowrap">수량</th>
              <th className="py-2.5 px-2 w-24 whitespace-nowrap text-right">금액</th>
              <th className="py-2.5 px-2 w-32 whitespace-nowrap text-center">발송(예정)일</th>
              <th className="py-2.5 px-2 w-20 whitespace-nowrap text-center">발송현황</th>
              <th className="py-2.5 px-1.5 w-20 whitespace-nowrap text-center">관리</th>
              <th className="py-2.5 px-2 min-w-[100px] max-w-[160px]">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {orders.map((order, idx) => {
              const isDelivered = order.status === 'delivered';
              const isFirstDelivered = isDelivered && idx > 0 && orders[idx - 1].status !== 'delivered';

              return (
                <React.Fragment key={order.id}>
                  {isFirstDelivered && (
                    <tr className="bg-slate-100/90 border-y border-slate-200 select-none">
                      <td colSpan={10} className="py-1.5 px-3 text-[11px] font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#5c7eb1]" />
                          발송완료 마감된 주문 (하단 정렬)
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={`transition-colors ${
                      isDelivered ? 'bg-slate-50/70 text-slate-500' : 'hover:bg-[#f7e2e2]/30'
                    }`}
                  >
                    {/* 1. 발송완료 체크박스 & 마감해제 */}
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`check-${order.id}`}
                          checked={isDelivered}
                          onChange={(e) => handleToggleDelivered(order, e.target.checked)}
                          className="w-4 h-4 rounded text-[#5c7eb1] focus:ring-[#5c7eb1] cursor-pointer accent-[#5c7eb1]"
                          title={isDelivered ? '체크 해제 시 마감 해제 (상단으로 복원)' : '체크 시 발송완료 (하단으로 이동)'}
                        />
                        {isDelivered ? (
                          <button
                            type="button"
                            onClick={() => handleToggleDelivered(order, false)}
                            className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs"
                            title="발송완료 마감을 해제하고 상단 접수 목록으로 복원합니다"
                          >
                            마감해제
                          </button>
                        ) : (
                          <label
                            htmlFor={`check-${order.id}`}
                            className="text-[11px] font-bold text-slate-600 cursor-pointer"
                          >
                            완료
                          </label>
                        )}
                      </div>
                    </td>

                  {/* 2. 이름 + 복사 */}
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span
                        className={`font-bold text-xs sm:text-sm ${
                          isDelivered ? 'text-slate-600' : 'text-[#1f3d59]'
                        }`}
                      >
                        {order.customerName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCellCopy(e, order.customerName, `name-${order.id}`, '성함이')}
                        className="text-[10px] p-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs"
                        title="이름 복사"
                      >
                        {copiedCell === `name-${order.id}` ? (
                          <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 3. 전화번호 + 복사 */}
                  <td className="py-2.5 px-2 whitespace-nowrap font-mono text-xs">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-700">{order.phone}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCellCopy(e, order.phone, `phone-${order.id}`, '전화번호가')}
                        className="text-[10px] p-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs"
                        title="전화번호 복사"
                      >
                        {copiedCell === `phone-${order.id}` ? (
                          <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 4. 배송지 주소 (넓게 확보, 2줄 허용) + 복사 */}
                  <td className="py-2.5 px-3 text-xs">
                    <div className="flex items-start gap-1.5">
                      <span
                        className="line-clamp-2 leading-relaxed text-slate-700 select-all break-keep"
                        title={order.address}
                      >
                        {order.address}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCellCopy(e, order.address, `addr-${order.id}`, '주소가')}
                        className="text-[10px] p-0.5 mt-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs shrink-0"
                        title="주소 복사"
                      >
                        {copiedCell === `addr-${order.id}` ? (
                          <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 5. 수량 (작고 깔끔한 박스 형태) */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-xs">
                    <div className="flex flex-wrap items-center gap-1">
                      {order.items.map((item) => (
                        <span
                          key={item.id}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold leading-tight shadow-2xs ${
                            item.type === '10kg'
                              ? 'bg-[#f7e2e2] text-[#1f3d59] border-[#ecd2d2]'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-[9px] text-slate-500 font-normal">{item.type}</span>
                          <span className="text-[#5c7eb1] font-mono">{item.quantity}박스</span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 6. 결제 금액 (순수익) */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-right font-mono text-xs">
                    <div className="font-bold text-slate-900">
                      {order.totalAmount.toLocaleString('ko-KR')}원
                    </div>
                    <div
                      className="text-[10px] text-[#5c7eb1] font-semibold"
                      title={`택배비 -${order.shippingCost}원 / 박스비 -${order.boxCost || 0}원`}
                    >
                      +{order.netProfit.toLocaleString('ko-KR')}원
                    </div>
                  </td>

                  {/* 7. 발송(예정)일 (아이콘 없이 바로 달력 선택 및 직접 입력) */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-center">
                    <input
                      type="date"
                      value={order.dispatchDate || ''}
                      onChange={(e) => handleDispatchDateChange(order.id, e.target.value, order.status)}
                      onClick={(e) => {
                        try {
                          (e.currentTarget as HTMLInputElement).showPicker?.();
                        } catch {
                          // fallback
                        }
                      }}
                      className="w-32 px-2 py-0.5 text-xs font-sans text-slate-800 bg-white border border-slate-200 hover:border-[#5c7eb1] focus:border-[#5c7eb1] focus:ring-1 focus:ring-[#5c7eb1]/30 rounded-lg shadow-2xs transition-colors cursor-pointer text-center outline-none"
                      title="클릭하여 달력 선택 또는 날짜 직접 입력"
                    />
                  </td>

                  {/* 8. 발송현황 (발송(예정)일 다음에 배치) */}
                  <td className="py-2.5 px-2 whitespace-nowrap text-center">
                    {renderStatusBadge(order.status)}
                  </td>

                  {/* 9. 관리 액션 버튼들 */}
                  <td className="py-2.5 px-1.5 whitespace-nowrap text-center">
                    <div className="inline-flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenMessageModal(order)}
                        className="p-1 text-slate-500 hover:text-[#5c7eb1] hover:bg-slate-100 rounded transition-colors"
                        title="고객 안내문 복사"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        title="주문 수정"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteOrder(order.id);
                          showToast(`${order.customerName}님의 주문이 삭제되었습니다.`, 'info');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="주문 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* 10. 메모 (제일 오른쪽) */}
                  <td className="py-2.5 px-2 text-xs text-slate-600">
                    {order.memo ? (
                      <div
                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded max-w-[160px] truncate"
                        title={order.memo}
                      >
                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{order.memo}</span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
