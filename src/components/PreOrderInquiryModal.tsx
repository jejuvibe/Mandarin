import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, Phone, CreditCard, Users } from 'lucide-react';
import { AppSettings, Customer } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './Toast';

interface PreOrderInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  customers?: Customer[];
}

export const PreOrderInquiryModal: React.FC<PreOrderInquiryModalProps> = ({
  isOpen,
  onClose,
  settings,
  customers = [],
}) => {
  const { showToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState('');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);

  if (!isOpen) return null;

  // Template rendering (Harvest turnaround notice without forced dispatch date)
  const template = settings.preOrderInquiryTemplate || `[감귤 주문 안내]
산지 직거래 햇노지감귤 가격 및 주문 안내드립니다.

🍊 판매 가격
• 노지 감귤 10kg: {price10kg}원
• 노지 감귤 5kg: {price5kg}원
(택배비 포함 무료 배송)

🏦 입금 계좌
• {bankName} {accountNumber}
• 예금주: {accountHolder}

🚚 발송 안내
입금 확인 후 수확하는 시간이 최대 1주일 정도 소요될 예정입니다.

📝 주문 방법
입금 후 아래 정보를 문자로 남겨주시면 확인 후 발송해 드립니다:
1. 받는 분 성함:
2. 휴대전화 번호:
3. 배송지 주소:
4. 주문 수량(10kg / 5kg):
5. 배송 요청사항(선택):

감사합니다!`;

  const cleanFarmName = (settings.farmName ? settings.farmName.replace('해찬솔농원', '해찬솔 농원') : '해찬솔 농원');
  const renderedMessage = template
    .replace(/{farmName}/g, cleanFarmName)
    .replace(/{price10kg}/g, settings.pricing.price10kg.toLocaleString('ko-KR'))
    .replace(/{price5kg}/g, settings.pricing.price5kg.toLocaleString('ko-KR'))
    .replace(/{bankName}/g, settings.bankInfo.bankName)
    .replace(/{accountNumber}/g, settings.bankInfo.accountNumber)
    .replace(/{accountHolder}/g, settings.bankInfo.accountHolder);

  const bankOnlyText = `${settings.bankInfo.bankName} ${settings.bankInfo.accountNumber} ${settings.bankInfo.accountHolder}`;

  const handleCopy = async (text: string, key: string, label: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast(`${label} 복사되었습니다!`, 'copy');
      setTimeout(() => setCopiedKey(null), 1600);
    }
  };

  const handleSendSMS = () => {
    const encodedBody = encodeURIComponent(renderedMessage);
    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      window.location.href = `sms:${cleanPhone}?body=${encodedBody}`;
    } else {
      window.location.href = `sms:?body=${encodedBody}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ecd2d2] bg-[#f7e2e2]/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-[#5c7eb1] shadow-2xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1f3d59]">
                주문 전 고객 안내 문자 (가격·계좌 안내)
              </h3>
              <p className="text-xs text-slate-500">
                아직 주문하지 않은 문의 고객에게 가격, 계좌 및 수확 안내 문자를 보냅니다.
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Optional recipient phone input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                받는 분 휴대전화 (선택 - 입력 시 바로 문자 전송 가능)
              </label>
              {customers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomerPickerOpen(!isCustomerPickerOpen)}
                  className="text-[11px] text-[#5c7eb1] hover:underline font-medium inline-flex items-center gap-0.5"
                >
                  <Users className="w-3 h-3" />
                  주소록에서 찾기
                </button>
              )}
            </div>
            <input
              type="tel"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              placeholder="010-0000-0000 (비워두면 문자앱에서 수신자 선택)"
              className="w-full p-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
            />

            {/* Quick address book picker dropdown if opened */}
            {isCustomerPickerOpen && customers.length > 0 && (
              <div className="mt-1.5 p-2 bg-[#f7e2e2]/40 rounded-xl border border-[#ecd2d2] max-h-36 overflow-y-auto space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">주소록 고객 선택:</span>
                <div className="flex flex-wrap gap-1">
                  {customers.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setTargetPhone(c.phone);
                        setIsCustomerPickerOpen(false);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-[#f7e2e2] border border-slate-200 text-slate-800 transition-colors"
                    >
                      {c.name} ({c.phone.slice(-4)})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Message Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">안내 메시지 내용 미리보기</span>
              <button
                type="button"
                onClick={() => handleCopy(bankOnlyText, 'bank-only', '계좌번호가')}
                className="text-[11px] font-semibold text-[#5c7eb1] hover:text-[#1f3d59] inline-flex items-center gap-1"
              >
                <CreditCard className="w-3 h-3" />
                {copiedKey === 'bank-only' ? '계좌 복사됨!' : '계좌번호만 복사'}
              </button>
            </div>
            <pre className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed select-all">
              {renderedMessage}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSendSMS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
            title="휴대폰의 기본 문자(SMS) 앱을 엽니다."
          >
            <Send className="w-4 h-4 text-slate-500" />
            문자앱(SMS) 열기
          </button>

          <button
            type="button"
            onClick={() => handleCopy(renderedMessage, 'full-preorder', '주문 안내 문자가')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5c7eb1] hover:bg-[#4d6c99] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            {copiedKey === 'full-preorder' ? (
              <>
                <Check className="w-4 h-4 text-[#62a4bc]" />
                복사 완료! 카톡·문자에 붙여넣기
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                안내 문자 전체 복사하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
