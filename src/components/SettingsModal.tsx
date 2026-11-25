import React, { useState } from 'react';
import {
  X,
  Save,
  Settings as SettingsIcon,
  CreditCard,
  DollarSign,
  Truck,
  Download,
  Upload,
  RefreshCw,
  Cloud,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppSettings, Order, Customer } from '../types';
import { COURIERS } from '../utils/courier';
import { useToast } from './Toast';
import {
  getActiveFirebaseConfig,
  saveCustomFirebaseConfig,
  isFirebaseConfigured,
  FirebaseAppConfig,
} from '../services/firebase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  orders: Order[];
  customers: Customer[];
  onImportData: (data: { orders: Order[]; customers: Customer[]; settings: AppSettings }) => void;
  onResetToDefault: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  orders,
  customers,
  onImportData,
  onResetToDefault,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const { showToast } = useToast();

  // Firebase configuration state
  const [fbConfig, setFbConfig] = useState<FirebaseAppConfig>(() => getActiveFirebaseConfig());
  const [isFbConfiguredState, setIsFbConfiguredState] = useState<boolean>(() => isFirebaseConfigured());
  const [rawConfigInput, setRawConfigInput] = useState('');
  const [showFbDetails, setShowFbDetails] = useState(false);
  const [showFbGuide, setShowFbGuide] = useState(false);

  if (!isOpen) return null;

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

  const handleParseRawConfig = (text: string) => {
    setRawConfigInput(text);
    if (!text.trim()) return;

    const extract = (key: string): string => {
      const match = text.match(new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`));
      return match ? match[1] : '';
    };

    const parsedApiKey = extract('apiKey');
    const parsedProjectId = extract('projectId');

    if (parsedApiKey || parsedProjectId) {
      setFbConfig((prev) => ({
        ...prev,
        apiKey: parsedApiKey || prev.apiKey,
        authDomain: extract('authDomain') || (parsedProjectId ? `${parsedProjectId}.firebaseapp.com` : prev.authDomain),
        projectId: parsedProjectId || prev.projectId,
        storageBucket: extract('storageBucket') || (parsedProjectId ? `${parsedProjectId}.appspot.com` : prev.storageBucket),
        messagingSenderId: extract('messagingSenderId') || prev.messagingSenderId,
        appId: extract('appId') || prev.appId,
      }));
      showToast('파이어베이스 설정 정보가 자동으로 감지되었습니다.', 'info');
    }
  };

  const handleSaveFirebaseConfig = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!fbConfig.apiKey || fbConfig.apiKey === 'YOUR_API_KEY' || !fbConfig.projectId || fbConfig.projectId === 'YOUR_PROJECT_ID') {
      showToast('올바른 API Key와 Project ID를 입력해주세요.', 'error');
      return;
    }
    saveCustomFirebaseConfig(fbConfig);
    setIsFbConfiguredState(true);
    showToast('파이어베이스 설정이 저장되었습니다! 클라우드 동기화를 시작합니다.', 'success');
  };

  const handleDisconnectFirebase = (e: React.MouseEvent) => {
    e.preventDefault();
    saveCustomFirebaseConfig(null);
    setFbConfig(getActiveFirebaseConfig());
    setIsFbConfiguredState(false);
    showToast('파이어베이스 연동이 해제되었습니다. 로컬 브라우저 저장 모드로 전환되었습니다.', 'info');
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
                    value={formData.pricing.price10kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, price10kg: Number(e.target.value) || 0 },
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
                    value={formData.pricing.price5kg}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, price5kg: Number(e.target.value) || 0 },
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
                    value={formData.pricing.defaultShippingCost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, defaultShippingCost: Number(e.target.value) || 0 },
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
                    value={formData.pricing.boxPrice10kg || 1800}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, boxPrice10kg: Number(e.target.value) || 0 },
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
                    value={formData.pricing.boxPrice5kg || 1200}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, boxPrice5kg: Number(e.target.value) || 0 },
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
                  value={formData.bankInfo.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...formData.bankInfo, bankName: e.target.value },
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
                  value={formData.bankInfo.accountHolder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...formData.bankInfo, accountHolder: e.target.value },
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
                  value={formData.bankInfo.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankInfo: { ...formData.bankInfo, accountNumber: e.target.value },
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

          {/* Section 4: Firebase Cloud Database Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1b1430] flex items-center gap-1.5 uppercase tracking-wide">
                <Cloud className="w-4 h-4 text-[#5c7eb1]" />
                파이어베이스 클라우드 실시간 동기화
              </h4>
              <button
                type="button"
                onClick={() => setShowFbGuide(!showFbGuide)}
                className="inline-flex items-center gap-1 text-[11px] text-[#5c7eb1] hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showFbGuide ? '가이드 닫기' : '초보자 설정 가이드'}
              </button>
            </div>

            {/* Status card */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                isFbConfiguredState
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isFbConfiguredState ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <div>
                  <p className="font-semibold">
                    {isFbConfiguredState
                      ? '클라우드 실시간 연동 활성화됨'
                      : '로컬 브라우저 저장 모드 (파이어베이스 미연동)'}
                  </p>
                  <p className="text-[11px] opacity-80">
                    {isFbConfiguredState
                      ? `프로젝트 ID: ${fbConfig.projectId} (휴대폰·PC 실시간 동기화 중)`
                      : '컴퓨터 브라우저에만 데이터가 보관됩니다. 여러 기기에서 보려면 파이어베이스를 연동하세요.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFbDetails(!showFbDetails)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 transition-colors shrink-0 ml-2"
              >
                {showFbDetails ? '접기' : '설정 열기'}
              </button>
            </div>

            {/* Beginner Quick Guide Card */}
            {showFbGuide && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
                <p className="font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  파이어베이스 3분 설정 요약:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 font-bold underline"
                    >
                      console.firebase.google.com
                    </a>{' '}
                    접속 후 구글 로그인
                  </li>
                  <li>
                    <strong>[프로젝트 추가]</strong> 클릭하여 프로젝트 생성 (예: haechansol-citrus)
                  </li>
                  <li>
                    메인 화면에서 <strong>웹(&lt;/&gt;)</strong> 아이콘 클릭하여 앱 등록 후 나타나는{' '}
                    <code>firebaseConfig</code> 복사
                  </li>
                  <li>
                    좌측 메뉴 <strong>[Firestore Database]</strong> 클릭 →{' '}
                    <strong>[데이터베이스 만들기]</strong> (위치: 서울 asia-northeast3)
                  </li>
                  <li>
                    아래 [설정 열기]를 눌러 복사한 코드를 붙여넣고 [저장] 누르면 즉시 연동 완료!
                  </li>
                </ol>
              </div>
            )}

            {/* Expanded Config Details */}
            {showFbDetails && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    📋 파이어베이스 콘솔 코드 그대로 붙여넣기 (자동 분석)
                  </label>
                  <textarea
                    rows={3}
                    value={rawConfigInput}
                    onChange={(e) => handleParseRawConfig(e.target.value)}
                    placeholder={'const firebaseConfig = {\n  apiKey: "AIza...",\n  projectId: "haechansol-order",\n  ...\n};'}
                    className="w-full p-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c7eb1]/30 focus:border-[#5c7eb1]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    콘솔에서 복사한 코드 덩어리를 통째로 붙여넣으시면 아래 항목들이 자동으로 입력됩니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">apiKey</label>
                    <input
                      type="text"
                      value={fbConfig.apiKey}
                      onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                      className="w-full p-1.5 text-xs font-mono rounded border border-slate-200 bg-white"
                      placeholder="AIzaSy..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">projectId</label>
                    <input
                      type="text"
                      value={fbConfig.projectId}
                      onChange={(e) =>
                        setFbConfig({
                          ...fbConfig,
                          projectId: e.target.value,
                          authDomain: `${e.target.value}.firebaseapp.com`,
                        })
                      }
                      className="w-full p-1.5 text-xs font-mono rounded border border-slate-200 bg-white"
                      placeholder="haechansol-order"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">appId</label>
                    <input
                      type="text"
                      value={fbConfig.appId}
                      onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                      className="w-full p-1.5 text-xs font-mono rounded border border-slate-200 bg-white"
                      placeholder="1:123456789:web:abcdef"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      messagingSenderId
                    </label>
                    <input
                      type="text"
                      value={fbConfig.messagingSenderId}
                      onChange={(e) => setFbConfig({ ...fbConfig, messagingSenderId: e.target.value })}
                      className="w-full p-1.5 text-xs font-mono rounded border border-slate-200 bg-white"
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isFbConfiguredState && (
                    <button
                      type="button"
                      onClick={handleDisconnectFirebase}
                      className="text-xs text-rose-600 hover:text-rose-700 underline"
                    >
                      연동 해제 (로컬 모드로 전환)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1b1430] text-white hover:bg-[#2c224d] transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    파이어베이스 연동 저장
                  </button>
                </div>
              </div>
            )}
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

              <a
                href="./tangerine-order-app.zip"
                download="haechansol-order-app.zip"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                title="깃허브에 업로드할 전체 소스코드 압축파일 다운로드"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                깃허브 업로드용 전체 소스코드(ZIP) 다운로드
              </a>

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

              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  showToast('기본 예시 데이터로 초기화되었습니다.', 'info');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                예시 데이터 초기화
              </button>
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
