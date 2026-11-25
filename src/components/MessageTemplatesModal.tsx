import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, CreditCard, Truck, Send } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { getTrackingUrl } from '../utils/courier';
import { useToast } from './Toast';

interface MessageTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  settings: AppSettings;
}

export const MessageTemplatesModal: React.FC<MessageTemplatesModalProps> = ({
  isOpen,
  onClose,
  order,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'dispatch' | 'bank' | 'shipping'>('dispatch');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { showToast } = useToast();

  if (!isOpen || !order) return null;

  const itemSummary = order.items
    .map((item) => `${item.name.replace('노지 감귤 ', '')} ${item.quantity}박스`)
    .join(', ');

  const trackingUrl = order.trackingNumber
    ? getTrackingUrl(order.carrier, order.trackingNumber)
    : '';

  // Format order's dispatch date from order record (e.g. 2026-11-27 -> 11월 27일)
  const formatKoreanDate = (dStr?: string) => {
    if (!dStr) return '발송예정일';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
    }
    return dStr;
  };

  const formattedDispatchDate = formatKoreanDate(order.dispatchDate);

  // Render templates with automatic replacement from order record
  const renderTemplate = (tmpl: string) => {
    const cleanFarmName = settings.farmName ? settings.farmName.replace('해찬솔농원', '해찬솔 농원') : '해찬솔 농원';
    return tmpl
      .replace(/{farmName}/g, cleanFarmName)
      .replace(/{customerName}/g, order.customerName)
      .replace(/{phone}/g, order.phone)
      .replace(/{address}/g, order.address)
      .replace(/{itemSummary}/g, itemSummary)
      .replace(/{totalAmount}/g, order.totalAmount.toLocaleString('ko-KR'))
      .replace(/{bankName}/g, settings.bankInfo.bankName)
      .replace(/{accountNumber}/g, settings.bankInfo.accountNumber)
      .replace(/{accountHolder}/g, settings.bankInfo.accountHolder)
      .replace(/{dispatchDate}/g, formattedDispatchDate)
      .replace(/{carrier}/g, order.carrier || settings.defaultCarrier)
      .replace(/{trackingNumber}/g, order.trackingNumber || '(발송 당일 등록 예정)')
      .replace(/{trackingUrl}/g, trackingUrl || '(운송장 등록 후 확인 가능)');
  };

  const dispatchMsg = renderTemplate(settings.dispatchNoticeTemplate);
  const bankMsg = renderTemplate(settings.bankNoticeTemplate);
  const shippingMsg = renderTemplate(settings.shippingNoticeTemplate);
  const simpleBankOnly = `${settings.bankInfo.bankName} ${settings.bankInfo.accountNumber} ${settings.bankInfo.accountHolder} (${order.totalAmount.toLocaleString('ko-KR')}원)`;

  const currentMsg =
    activeTab === 'dispatch' ? dispatchMsg : activeTab === 'bank' ? bankMsg : shippingMsg;

  const handleCopy = async (text: string, key: string, label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      showToast(`${label} 복사되었습니다!`, 'copy');
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const handleSendSMS = () => {
    const encodedBody = encodeURIComponent(currentMsg);
    window.location.href = `sms:${order.phone}?body=${encodedBody}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#62a4bc]/15 flex items-center justify-center text-[#2d738d]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1b1430]">
                고객 안내 메시지 복사
              </h3>
              <p className="text-xs text-slate-500">
                {order.customerName} 고객님 ({order.phone}) · 발송일: {formattedDispatchDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 p-1 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('dispatch')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'dispatch'
                ? 'bg-[#1b1430] text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-[#1b1430]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            발송예정 안내
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'bank'
                ? 'bg-[#1b1430] text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-[#1b1430]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            주문 입금 안내
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'shipping'
                ? 'bg-[#1b1430] text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-[#1b1430]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            배송 출발 안내
          </button>
        </div>

        {/* Body Preview */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Quick Bank Account Snippet if bank tab */}
          {activeTab === 'bank' && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-600">계좌번호 단독 복사</div>
                <div className="text-xs sm:text-sm font-mono font-bold text-[#1b1430] truncate">
                  {simpleBankOnly}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(simpleBankOnly, 'simple-bank', '계좌번호가')}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#1b1430] text-white text-xs font-medium hover:bg-[#2c224d] flex items-center gap-1 shadow-xs transition-colors"
              >
                {copiedKey === 'simple-bank' ? <Check className="w-3.5 h-3.5 text-[#62a4bc]" /> : <Copy className="w-3.5 h-3.5" />}
                계좌만 복사
              </button>
            </div>
          )}

          {/* Message Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">메시지 내용 미리보기</span>
              <span className="text-[11px] text-slate-400">카카오톡이나 문자로 전송하세요</span>
            </div>
            <pre className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-all">
              {currentMsg}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSendSMS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors"
          >
            <Send className="w-4 h-4 text-slate-500" />
            문자앱 열기
          </button>

          <button
            type="button"
            onClick={() => handleCopy(currentMsg, 'full-msg', '안내 메시지가')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1b1430] hover:bg-[#2c224d] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            {copiedKey === 'full-msg' ? (
              <>
                <Check className="w-4 h-4 text-[#62a4bc]" />
                복사 완료!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                메시지 전체 복사하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
