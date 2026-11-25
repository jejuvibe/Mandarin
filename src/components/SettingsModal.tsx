import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Settings as SettingsIcon,
  CreditCard,
  DollarSign,
  Truck,
  Download,
  Upload,
  Cloud,
} from 'lucide-react';
import { AppSettings, Order, Customer } from '../types';
import { DEFAULT_SETTINGS } from '../data/initialData';
import { COURIERS } from '../utils/courier';
import { useToast } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  orders: Order[];
  customers: Customer[];
  onImportData: (data: { orders: Order[]; customers: Customer[]; settings: AppSettings }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  orders,
  customers,
  onImportData,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings || DEFAULT_SETTINGS);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && settings) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentPricing = formData?.pricing || DEFAULT_SETTINGS.pricing;
  const currentBankInfo = formData?.bankInfo || DEFAULT_SETTINGS.bankInfo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    showToast('설정이 저장되었습니다. 다음 주문부터 기본 반영됩니다.', 'success');
    onClose();
  };

  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: formData,
      orders,
      customers,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeju-citrus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('주문 및 주소록 데이터가 백업 파일로 저장되었습니다.', 'success');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.orders && Array.isArray(json.orders)) {
          onImportData({
            orders: json.orders,
            customers: json.customers || [],
            settings: json.settings || formData,
          });
          showToast(`백업 파일에서 주문 ${json.orders.length}건을 복원했습니다.`, 'success');
          onClose();
        } else {
          showToast('올바른 백업 파일 형식이 아닙니다.', 'error');
        }
      } catch {
        showToast('파일 파싱 중 오류가 발생했습니다.', 'error');
      }
    };
    reader.readAsText(file);
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                농원 및 판매 단가 관리 설정
              </h3>
              <p className="text-xs text-slate-500">
                마지막 저장된 금액이 새로운 주문에 자동으로 기본 적용됩니다.
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

        {/* Body Form */}
        <form id="settings-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Section 1: Pricing & Courier Defaults */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5 uppercase tracking-wide">
              <DollarSign className="w-4 h-4 text-[#5c7eb1]" />
              감귤 판매 단가 및 원가 설정 (택배비 + 5kg/10kg 박스비)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  10kg 기본 판매가
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    value={currentPricing.price10kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...currentPricing, price10kg: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2.5 pr-8 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#1b1430]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  5kg 기본 판매가
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500"
                    value={currentPricing.price5kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...currentPricing, price5kg: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2.5 pr-8 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#1b1430]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  상자당 택배비 (기본 배송원가)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    value={currentPricing.defaultShippingCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...currentPricing, defaultShippingCost: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2.5 pr-8 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-rose-700"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  10kg 박스 원가 (박스비)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    value={currentPricing.boxPrice10kg ?? 1800}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...currentPricing, boxPrice10kg: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2.5 pr-8 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#1b1430]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                </div>
                <span className="text-[10px] text-slate-400">10kg 1박스 출하시 원가 차감</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  5kg 박스 원가 (박스비)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    value={currentPricing.boxPrice5kg ?? 1200}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...currentPricing, boxPrice5kg: Number(e.target.value) || 0 },
                      })
                    }
                    className="w-full p-2.5 pr-8 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#5c7eb1]"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">원</span>
                </div>
                <span className="text-[10px] text-slate-400">5kg 1박스 출하시 원가 차감</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 2: Farm & Bank Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5 uppercase tracking-wide">
              <CreditCard className="w-4 h-4 text-[#5c7eb1]" />
              농원 정보 및 입금 계좌 안내
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  농원/상호명
                </label>
                <input
                  type="text"
                  value={formData.farmName}
                  onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  대표자/판매자 연락처
                </label>
                <input
                  type="text"
                  value={formData.sellerPhone}
                  onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono"
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  입금 은행명
                </label>
                <input
                  type="text"
                  value={currentBankInfo.bankName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...currentBankInfo, bankName: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                  placeholder="예: 농협, 카카오뱅크, 국민"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  예금주 성명
                </label>
                <input
                  type="text"
                  value={currentBankInfo.accountHolder || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...currentBankInfo, accountHolder: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                  placeholder="예: 홍길동(제주감귤)"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={currentBankInfo.accountNumber || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...currentBankInfo, accountNumber: e.target.value },
                    })
                  }
                  className="w-full p-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono"
                  placeholder="351-0000-0000-00"
                  required
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 3: Default Courier */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5 uppercase tracking-wide">
              <Truck className="w-4 h-4 text-[#62a4bc]" />
              주 이용 택배사
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COURIERS.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  onClick={() => setFormData({ ...formData, defaultCarrier: c.name })}
                  className={`p-2.5 text-xs font-medium rounded-xl border transition-all text-center ${
                    formData.defaultCarrier === c.name
                      ? 'border-[#5c7eb1] bg-[#5c7eb1]/15 text-[#1b1430] font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 4: Firebase Cloud Realtime Sync Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5 uppercase tracking-wide">
              <Cloud className="w-4 h-4 text-emerald-600" />
              파이어베이스 클라우드 실시간 동기화
            </h4>
            <div className="p-3.5 rounded-xl border bg-emerald-50/80 border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <p className="font-bold text-emerald-950">클라우드 실시간 연동 활성화됨</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    프로젝트: <code className="font-mono font-semibold">mandarin-order-haechansol</code> (휴대폰·PC 자동 동기화 중)
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs shrink-0">
                연결 완료 ✓
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 5: Backup & Reset */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              데이터 백업 및 복원
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                전체 데이터 백업 (JSON 다운로드)
              </button>

              <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                백업 파일 복원
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            form="settings-form"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#1b1430] hover:bg-[#2c224d] active:scale-[0.98] rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};
