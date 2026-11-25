import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, ClipboardCopy, ArrowRight, User, Phone, MapPin, Package, FileText } from 'lucide-react';
import { parseKoreanOrderMessage } from '../utils/textParser';
import { ParsedOrderData } from '../types';
import { useToast } from './Toast';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedData: (data: ParsedOrderData) => void;
}

export const SmartPasteModal: React.FC<SmartPasteModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedData,
}) => {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedOrderData>({});
  const { showToast } = useToast();

  useEffect(() => {
    if (rawText.trim()) {
      const result = parseKoreanOrderMessage(rawText);
      setParsed(result);
    } else {
      setParsed({});
    }
  }, [rawText]);

  if (!isOpen) return null;

  const handleClipboardRead = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawText(text);
          showToast('클립보드에서 텍스트를 불러왔습니다', 'success');
          return;
        }
      }
      showToast('클립보드 권한이 필요합니다. 아래 입력창에 직접 붙여넣어 주세요.', 'info');
    } catch {
      showToast('클립보드 읽기가 차단되어 있습니다. 입력창에 길게 눌러 붙여넣기 해주세요.', 'info');
    }
  };

  const handleApply = () => {
    if (!parsed.customerName && !parsed.phone && !parsed.address) {
      showToast('분석된 정보가 없습니다. 텍스트를 입력해 주세요.', 'error');
      return;
    }
    onApplyParsedData(parsed);
    showToast('주문서에 자동 입력되었습니다!', 'success');
    onClose();
  };

  const loadSample = (sampleType: 'full' | 'partial' | 'mixed') => {
    if (sampleType === 'full') {
      setRawText(`[카톡 주문]
홍길동
010-9876-5432
제주시 애월읍 하귀동남3길 12 101동 502호
10kg 2박스 주문합니다. 문 앞에 놔주세요~`);
    } else if (sampleType === 'partial') {
      setRawText(`이순신 서울 강남구 테헤란로 152 강남파이낸스센터 18층
전화번호는 나중에 드릴게요 5kg 1상자 부탁해요`);
    } else {
      setRawText(`받는사람: 강감찬
배송지: 부산 해운대구 센텀남대로 35 1202호
전화: 010-3344-5566
품목: 10키로 1개, 5키로 1개`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#62a4bc]/15 flex items-center justify-center text-[#2d738d]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1b1430]">
                스마트 주문 메시지 자동 파싱
              </h3>
              <p className="text-xs text-slate-500">
                카톡이나 문자 주문을 그대로 붙여넣으면 이름, 연락처, 주소를 자동 분류합니다.
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
          {/* Quick Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                받은 주문 메시지 붙여넣기
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClipboardRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#1b1430] bg-[#f7e2e2] hover:bg-[#eed7d7] rounded-md transition-colors"
                >
                  <ClipboardCopy className="w-3.5 h-3.5 text-[#5c7eb1]" />
                  클립보드 붙여넣기
                </button>
              </div>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="예: 홍길동 010-1234-5678 제주시 애월로 12 10kg 1박스 문앞에 놔주세요&#10;(이름, 주소, 전화번호 순서 상관없이 인식됩니다)"
              rows={4}
              className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] placeholder:text-slate-400 text-slate-800 transition-all font-sans"
            />

            {/* Quick Test Samples */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">예시 불러오기:</span>
              <button
                type="button"
                onClick={() => loadSample('full')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                카톡 10kg 주문
              </button>
              <button
                type="button"
                onClick={() => loadSample('partial')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                주소+이름만 있는 경우
              </button>
              <button
                type="button"
                onClick={() => loadSample('mixed')}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                라벨형 주문서
              </button>
            </div>
          </div>

          {/* Real-time Parsed Preview Card */}
          <div className="p-4 rounded-xl border border-[#ecd2d2] bg-[#f7e2e2]/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5c7eb1]" />
                자동 감지된 항목
              </span>
              {parsed.confidenceScore !== undefined && parsed.confidenceScore > 0 && (
                <span className="text-[11px] font-semibold text-[#5c7eb1]">
                  인식 신뢰도: {parsed.confidenceScore}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Name */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">받는 분 성함</div>
                  <div className="text-sm font-semibold text-[#1b1430] truncate">
                    {parsed.customerName || <span className="text-slate-300 font-normal">미감지</span>}
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">휴대전화</div>
                  <div className="text-sm font-semibold text-[#1b1430] font-mono">
                    {parsed.phone || <span className="text-slate-300 font-normal font-sans">미감지</span>}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2 p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">배송지 주소</div>
                  <div className="text-sm font-semibold text-slate-800 leading-snug">
                    {parsed.address || <span className="text-slate-300 font-normal">미감지</span>}
                    {parsed.postalCode && (
                      <span className="ml-1.5 text-xs text-slate-500 font-normal">
                        ({parsed.postalCode})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items Detected */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">감귤 수량 감지</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {parsed.detected10kg || parsed.detected5kg ? (
                      <span className="space-x-1.5">
                        {parsed.detected10kg ? <span className="text-[#1b1430] font-bold">10kg {parsed.detected10kg}박스</span> : null}
                        {parsed.detected5kg ? <span className="text-[#5c7eb1] font-bold">5kg {parsed.detected5kg}박스</span> : null}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">수량 미포함 (기본 1박스 지정)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Memo */}
              <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-xs flex items-start gap-2.5">
                <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">배송 요청 메모</div>
                  <div className="text-xs font-medium text-slate-700 truncate">
                    {parsed.memo || <span className="text-slate-300 font-normal">없음</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1b1430] hover:bg-[#2c224d] active:scale-[0.98] rounded-xl shadow-sm transition-all"
          >
            <Check className="w-4 h-4 text-[#62a4bc]" />
            주문서에 자동 입력하기
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
