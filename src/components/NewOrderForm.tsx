import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Plus, Minus, ArrowLeft, Save, AlertCircle, RefreshCw, Check, MessageSquare } from 'lucide-react';
import { AppSettings, Customer, Order, OrderItem, OrderStatus, ParsedOrderData } from '../types';
import { parseKoreanOrderMessage } from '../utils/textParser';
import { SmartPasteModal } from './SmartPasteModal';
import { useToast } from './Toast';

interface NewOrderFormProps {
  settings: AppSettings;
  customers: Customer[];
  editingOrder?: Order | null;
  initialCustomer?: Customer | null;
  onSaveOrder: (order: Order, updatedPricing?: { price5kg: number; price10kg: number }) => void;
  onCancel: () => void;
  onOpenPreOrderModal?: () => void;
}

export const NewOrderForm: React.FC<NewOrderFormProps> = ({
  settings,
  customers,
  editingOrder,
  initialCustomer,
  onSaveOrder,
  onCancel,
  onOpenPreOrderModal,
}) => {
  const { showToast } = useToast();
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  // Form States - order strictly: Name -> Phone -> Address
  const [customerName, setCustomerName] = useState(
    editingOrder?.customerName || initialCustomer?.name || ''
  );
  const [phone, setPhone] = useState(
    editingOrder?.phone || initialCustomer?.phone || ''
  );
  const [address, setAddress] = useState(
    editingOrder?.address || initialCustomer?.address || ''
  );
  const [postalCode, setPostalCode] = useState(
    editingOrder?.postalCode || initialCustomer?.postalCode || ''
  );

  useEffect(() => {
    if (initialCustomer && !editingOrder) {
      setCustomerName(initialCustomer.name || '');
      setPhone(initialCustomer.phone || '');
      setAddress(initialCustomer.address || '');
      setPostalCode(initialCustomer.postalCode || '');
      if (initialCustomer.notes) setMemo(initialCustomer.notes);
    }
  }, [initialCustomer, editingOrder]);

  // Products: 10kg and 5kg with prices remembered from settings or order
  const [qty10kg, setQty10kg] = useState<number>(() => {
    if (editingOrder) {
      const item10 = editingOrder.items.find((i) => i.type === '10kg');
      return item10 ? item10.quantity : 0;
    }
    return 1; // default to 1 box 10kg
  });

  const [qty5kg, setQty5kg] = useState<number>(() => {
    if (editingOrder) {
      const item5 = editingOrder.items.find((i) => i.type === '5kg');
      return item5 ? item5.quantity : 0;
    }
    return 0;
  });

  const [unitPrice10kg, setUnitPrice10kg] = useState<number>(() => {
    if (editingOrder) {
      const item10 = editingOrder.items.find((i) => i.type === '10kg');
      if (item10) return item10.unitPrice;
    }
    return settings.pricing.price10kg;
  });

  const [unitPrice5kg, setUnitPrice5kg] = useState<number>(() => {
    if (editingOrder) {
      const item5 = editingOrder.items.find((i) => i.type === '5kg');
      if (item5) return item5.unitPrice;
    }
    return settings.pricing.price5kg;
  });

  // Shipping & Dispatch
  const totalBoxes = qty10kg + qty5kg;
  const defaultShipping = totalBoxes * settings.pricing.defaultShippingCost;

  const [shippingCost, setShippingCost] = useState<number>(() => {
    return editingOrder ? editingOrder.shippingCost : defaultShipping;
  });

  const [manualTotalAdjustment, setManualTotalAdjustment] = useState<number>(0);
  const [status, setStatus] = useState<OrderStatus>(() => {
    return editingOrder ? editingOrder.status : 'order_received';
  });

  // Default dispatch date: tomorrow or custom
  const getDefaultDispatchDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const [dispatchDate, setDispatchDate] = useState<string>(() => {
    return editingOrder ? editingOrder.dispatchDate : getDefaultDispatchDate();
  });

  const [carrier, setCarrier] = useState<string>(() => {
    return editingOrder ? editingOrder.carrier : settings.defaultCarrier;
  });

  const [trackingNumber, setTrackingNumber] = useState<string>(() => {
    return editingOrder ? editingOrder.trackingNumber : '';
  });

  const [memo, setMemo] = useState<string>(() => {
    return editingOrder?.memo || '';
  });

  const [isPaid, setIsPaid] = useState<boolean>(() => {
    return editingOrder ? editingOrder.isPaid : true;
  });

  // Keep shipping cost in sync if user changes box quantities and hasn't manually overridden
  useEffect(() => {
    if (!editingOrder) {
      setShippingCost(Math.max(1, totalBoxes) * settings.pricing.defaultShippingCost);
    }
  }, [totalBoxes, settings.pricing.defaultShippingCost, editingOrder]);

  // Box cost calculations (User requirement: 5kg, 10kg box cost is different)
  const boxPrice10kg = settings.pricing.boxPrice10kg || 1800;
  const boxPrice5kg = settings.pricing.boxPrice5kg || 1200;
  const calculatedBoxCost = (qty10kg * boxPrice10kg) + (qty5kg * boxPrice5kg);

  // Live Calculations
  const calculatedProductTotal = (qty10kg * unitPrice10kg) + (qty5kg * unitPrice5kg) + manualTotalAdjustment;
  const netProfit = calculatedProductTotal - shippingCost - calculatedBoxCost;
  const profitMargin = calculatedProductTotal > 0 ? Math.round((netProfit / calculatedProductTotal) * 100) : 0;

  const [rawPastedText, setRawPastedText] = useState('');
  const [parsedSummary, setParsedSummary] = useState('');

  // Handle Smart Parse Applied
  const handleApplyParsedData = (data: ParsedOrderData) => {
    if (data.customerName) setCustomerName(data.customerName);
    if (data.phone) setPhone(data.phone);
    if (data.address) setAddress(data.address);
    if (data.postalCode) setPostalCode(data.postalCode);
    if (data.memo) setMemo(data.memo);

    if (data.detected10kg !== undefined || data.detected5kg !== undefined) {
      if (data.detected10kg !== undefined) setQty10kg(data.detected10kg);
      if (data.detected5kg !== undefined) setQty5kg(data.detected5kg);
    }
  };

  const handleInlineParse = (text: string) => {
    setRawPastedText(text);
    if (!text.trim()) {
      setParsedSummary('');
      return;
    }
    const data = parseKoreanOrderMessage(text);
    handleApplyParsedData(data);
    const summaryItems: string[] = [];
    if (data.customerName) summaryItems.push(`성함: ${data.customerName}`);
    if (data.phone) summaryItems.push(`연락처: ${data.phone}`);
    if (data.address) summaryItems.push(`주소: ${data.address.slice(0, 16)}...`);
    if (data.detected10kg) summaryItems.push(`10kg ${data.detected10kg}박스`);
    if (data.detected5kg) summaryItems.push(`5kg ${data.detected5kg}박스`);

    if (summaryItems.length > 0) {
      setParsedSummary(`자동 추출 완료: ${summaryItems.join(' · ')}`);
      showToast('문자 분석 완료! 주문 정보가 자동으로 채워졌습니다.', 'success');
    } else {
      setParsedSummary('입력된 텍스트에서 주문 정보를 인식 중입니다.');
    }
  };

  const handleReadClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          handleInlineParse(text);
          return;
        }
      }
      showToast('클립보드가 비어있거나 권한이 없습니다. 텍스트 박스에 직접 붙여넣어 주세요.', 'info');
    } catch {
      showToast('클립보드 접근 권한이 없습니다. 텍스트 박스를 길게 눌러 붙여넣으세요.', 'info');
    }
  };

  // Select customer from address book
  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    if (c.notes) {
      setMemo(c.notes);
    }
    setIsCustomerPickerOpen(false);
    showToast(`${c.name} 고객 정보가 입력되었습니다.`, 'success');
  };

  // Phone auto formatting as user types
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    let formatted = raw;
    if (raw.length <= 3) {
      formatted = raw;
    } else if (raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else if (raw.length <= 11) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    }
    setPhone(formatted);
  };


  // Quick match existing customers as user types name
  const matchingCustomers = customerName.trim().length >= 2
    ? customers.filter((c) => c.name.includes(customerName.trim()))
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('받는 사람 성함을 입력해 주세요.', 'error');
      return;
    }
    if (!phone.trim()) {
      showToast('휴대전화 번호를 입력해 주세요.', 'error');
      return;
    }
    if (!address.trim()) {
      showToast('배송지 주소를 입력해 주세요.', 'error');
      return;
    }
    if (totalBoxes <= 0) {
      showToast('10kg 또는 5kg 수량을 최소 1박스 이상 선택해 주세요.', 'error');
      return;
    }

    const items: OrderItem[] = [];
    if (qty10kg > 0) {
      items.push({
        id: `ITEM-10-${Date.now()}`,
        type: '10kg',
        name: '노지 감귤 10kg',
        quantity: qty10kg,
        unitPrice: unitPrice10kg,
      });
    }
    if (qty5kg > 0) {
      items.push({
        id: `ITEM-5-${Date.now()}`,
        type: '5kg',
        name: '노지 감귤 5kg',
        quantity: qty5kg,
        unitPrice: unitPrice5kg,
      });
    }

    const newOrder: Order = {
      id: editingOrder ? editingOrder.id : `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 16),
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      postalCode: postalCode.trim() || undefined,
      items,
      totalAmount: calculatedProductTotal,
      shippingCost,
      boxCost: calculatedBoxCost,
      netProfit,
      status,
      dispatchDate,
      carrier,
      trackingNumber: trackingNumber.trim(),
      memo: memo.trim() || undefined,
      isPaid,
      paidAt: isPaid ? (editingOrder?.paidAt || new Date().toISOString().replace('T', ' ').slice(0, 16)) : undefined,
    };

    // Also pass along the updated unit prices so they persist for future orders!
    onSaveOrder(newOrder, { price5kg: unitPrice5kg, price10kg: unitPrice10kg });
    showToast(editingOrder ? '주문이 수정되었습니다.' : '새 주문이 등록되었습니다!', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Banner & Quick Shortcuts */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-[#264c67]">
                {editingOrder ? '주문 내역 수정' : '새 감귤 주문 접수'}
              </h2>
              {onOpenPreOrderModal && (
                <button
                  type="button"
                  onClick={onOpenPreOrderModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-xl border border-[#ecd2d2] bg-[#f7e2e2] hover:bg-[#eed7d7] text-[#1f3d59] transition-all shadow-2xs hover:scale-102 active:scale-98 cursor-pointer"
                  title="주문 전 고객에게 몇 kg 얼마, 계좌번호, 발송 안내 문자 전송"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#5c7eb1]" />
                  <span>주문 안내문자</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              이름, 휴대전화, 주소 순서로 입력하거나 아래 상자에 메시지를 바로 붙여넣으세요.
            </p>
          </div>
        </div>

        {/* Action Button: Address Book */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomerPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#ecd2d2] bg-[#f7e2e2]/60 hover:bg-[#f7e2e2] text-slate-800 transition-colors shadow-2xs"
          >
            <Users className="w-4 h-4 text-[#5c7eb1]" />
            <span>주소록</span>
          </button>
        </div>
      </div>

      {/* Direct Inline Paste Box (User requirement: 주문 접수 페이지에서 새감귤주문접수 아래 텍스트 박스 넣어서 바로 붙여넣을 수 있도록) */}
      {!editingOrder && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#62a4bc]/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-[#264c67] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#62a4bc]" />
              주문 문자·카톡 바로 붙여넣기 (이름, 전화번호, 주소, 수량 자동 추출)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReadClipboard}
                className="text-xs px-2.5 py-1 bg-[#62a4bc] hover:bg-[#5293a9] text-white font-semibold rounded-lg shadow-2xs inline-flex items-center gap-1 transition-colors"
                title="클립보드에 복사된 문자 자동 붙여넣기"
              >
                클립보드 붙여넣기
              </button>
              {rawPastedText && (
                <button
                  type="button"
                  onClick={() => {
                    setRawPastedText('');
                    setParsedSummary('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100"
                >
                  지우기
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={rawPastedText}
              onChange={(e) => handleInlineParse(e.target.value)}
              placeholder="카카오톡이나 문자메시지를 복사하여 이곳에 바로 붙여넣으세요. 이름, 휴대전화, 주소, 10kg/5kg 수량을 자동으로 분류하여 아래 입력란에 채워드립니다."
              className="w-full p-3 text-xs sm:text-sm bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] text-slate-800 placeholder-slate-400 leading-relaxed font-sans"
            />
          </div>

          {parsedSummary && (
            <div className="flex items-center justify-between text-xs text-[#264c67] bg-[#f7e2e2]/60 border border-[#ecd2d2] px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-[#5c7eb1] shrink-0" />
                <span>{parsedSummary}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Order Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-6">
        {/* Step 1: Recipient Information (Name -> Phone -> Address) */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1b1430] uppercase tracking-wider flex items-center gap-1.5">
              1. 받는 분 정보 (순서: 성함 → 휴대전화 → 주소)
            </span>
            <span className="text-[11px] text-[#5c7eb1] font-medium">
              * 필수 항목
            </span>
          </div>

          <div className="space-y-3.5">
            {/* 1. Name */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                받는 분 성함 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="예: 홍길동"
                className="w-full p-2.5 text-sm sm:text-base font-medium rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                required
              />

              {/* Suggestions from Address book */}
              {matchingCustomers.length > 0 && !editingOrder && (
                <div className="mt-1.5 p-2 bg-[#f7e2e2]/60 rounded-xl border border-[#ecd2d2] text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-[#264c67]">
                    주소록에 등록된 고객입니다:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {matchingCustomers.map((mc) => (
                      <button
                        type="button"
                        key={mc.id}
                        onClick={() => handleSelectCustomer(mc)}
                        className="px-2.5 py-1 bg-white hover:bg-[#f7e2e2] text-slate-800 font-medium rounded-lg border border-[#ecd2d2] shadow-xs text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <span>{mc.name}</span>
                        <span className="text-slate-400 text-[10px]">({mc.phone.slice(-4)})</span>
                        <span className="text-[#5c7eb1] text-[10px] font-bold">불러오기</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                휴대전화 번호 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-2.5 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#1b1430]"
                required
              />
            </div>

            {/* 3. Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  배송지 주소 (도로명 / 지번 및 동·호수) <span className="text-rose-500">*</span>
                </label>
                {postalCode && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    우편번호: {postalCode}
                  </span>
                )}
              </div>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 제주특별자치도 제주시 애월읍 애월로 123 102동 405호"
                rows={2}
                className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] text-slate-800 leading-snug"
                required
              />
            </div>

            {/* Delivery memo */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                배송 요청사항 (메모)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 문 앞에 두고 문자 부탁드립니다 / 경비실 보관"
                className="w-full p-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Citrus Options (10kg & 5kg) & Quantities */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1b1430] uppercase tracking-wider">
              2. 감귤 품목 선택 및 수량 (10kg / 5kg)
            </span>
            <span className="text-xs text-slate-500">
              총 상자 수: <strong className="text-[#1b1430] font-bold">{totalBoxes}</strong>박스
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 10kg Option */}
            <div className={`p-4 rounded-2xl border transition-all ${
              qty10kg > 0 ? 'border-[#5c7eb1] bg-[#5c7eb1]/10 shadow-xs' : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1b1430]">노지 감귤 10kg</h4>
                  <p className="text-[11px] text-slate-500">가장 선호하는 실속 선물·가정용 대용량</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">판매 단가</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="500"
                      value={unitPrice10kg}
                      onChange={(e) => setUnitPrice10kg(Number(e.target.value) || 0)}
                      className="w-20 text-right p-1 text-xs font-semibold rounded border border-slate-200 font-mono"
                    />
                    <span className="text-xs text-slate-600">원</span>
                  </div>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-700">10kg 수량</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty10kg(Math.max(0, qty10kg - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={qty10kg}
                    onChange={(e) => setQty10kg(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-12 text-center font-bold text-base font-mono rounded-lg border border-slate-200 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQty10kg(qty10kg + 1)}
                    className="w-8 h-8 rounded-lg border border-[#5c7eb1]/40 bg-[#5c7eb1]/15 hover:bg-[#5c7eb1]/25 flex items-center justify-center text-[#1b1430] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 5kg Option */}
            <div className={`p-4 rounded-2xl border transition-all ${
              qty5kg > 0 ? 'border-[#62a4bc] bg-[#62a4bc]/10 shadow-xs' : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#1b1430]">노지 감귤 5kg</h4>
                  <p className="text-[11px] text-slate-500">1~2인 가구 및 소가족 맞춤 소포장</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">판매 단가</div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="500"
                      value={unitPrice5kg}
                      onChange={(e) => setUnitPrice5kg(Number(e.target.value) || 0)}
                      className="w-20 text-right p-1 text-xs font-semibold rounded border border-slate-200 font-mono"
                    />
                    <span className="text-xs text-slate-600">원</span>
                  </div>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-700">5kg 수량</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty5kg(Math.max(0, qty5kg - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={qty5kg}
                    onChange={(e) => setQty5kg(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-12 text-center font-bold text-base font-mono rounded-lg border border-slate-200 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQty5kg(qty5kg + 1)}
                    className="w-8 h-8 rounded-lg border border-[#62a4bc]/40 bg-[#62a4bc]/15 hover:bg-[#62a4bc]/25 flex items-center justify-center text-[#1b1430] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Financials & Shipping Cost / Net Profit */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. 매출 및 택배비·박스비 비용처리 (순수익 자동 계산)
            </span>
            <span className="text-xs text-slate-500">
              * 판매금액 변경 시 다음 주문에도 기본 저장됩니다.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {/* Total Selling Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                총 판매 금액 (매출)
              </label>
              <div className="text-base font-bold text-slate-900 font-mono">
                {calculatedProductTotal.toLocaleString('ko-KR')}원
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>조정:</span>
                <input
                  type="number"
                  step="500"
                  value={manualTotalAdjustment}
                  onChange={(e) => setManualTotalAdjustment(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-16 p-0.5 text-xs rounded border border-slate-300 text-right font-mono"
                />
                <span>원</span>
              </div>
            </div>

            {/* Courier Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                택배비 비용
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="500"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(Number(e.target.value) || 0)}
                  className="w-24 p-1 text-sm font-bold text-rose-700 rounded-lg border border-slate-200 font-mono"
                />
                <span className="text-xs text-slate-500">원</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                ({totalBoxes}박스 기준)
              </div>
            </div>

            {/* Box Cost */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                박스비 원가
              </label>
              <div className="text-base font-bold text-[#5c7eb1] font-mono">
                -{calculatedBoxCost.toLocaleString('ko-KR')}원
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                10kg {qty10kg}장 + 5kg {qty5kg}장
              </div>
            </div>

            {/* Net Profit */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                최종 순수익
              </label>
              <div
                className={`text-base font-bold font-mono ${
                  netProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
                }`}
              >
                {netProfit > 0 ? '+' : ''}{netProfit.toLocaleString('ko-KR')}원
              </div>
              <div
                className={`text-[11px] font-medium mt-1 ${
                  netProfit < 0 ? 'text-rose-600' : 'text-[#2d738d]'
                }`}
              >
                순수익률 {profitMargin}%
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Dispatch Date, Status & Payment Confirmation */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-[#1b1430] uppercase tracking-wider">
              4. 발송일자 및 배송 상태 설정
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Dispatch Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                발송(예정)일
              </label>
              <input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 font-sans"
              />
            </div>

            {/* Order Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                주문 진행 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 font-medium"
              >
                <option value="order_received">주문 접수 (입금 완료)</option>
                <option value="payment_pending">입금 대기</option>
                <option value="delivered">배송 완료</option>
                <option value="cancelled">주문 취소</option>
              </select>

              {/* Payment checkbox */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5c7eb1] focus:ring-[#5c7eb1]"
                />
                <span className="text-xs font-medium text-slate-700">
                  입금 확인 완료됨
                </span>
              </label>
            </div>

            {/* Carrier & Tracking */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                이용 택배사
              </label>
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full p-2 text-sm rounded-xl border border-slate-200"
              >
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="우체국택배">우체국택배</option>
                <option value="농협택배">농협택배</option>
                <option value="한진택배">한진택배</option>
                <option value="롯데택배">롯데택배</option>
                <option value="로젠택배">로젠택배</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                운송장 번호 (선택)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="숫자만 입력 (나중에 입력 가능)"
                className="w-full p-2 text-sm font-mono rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          >
            취소
          </button>

          <button
            type="submit"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#5c7eb1] hover:bg-[#4d6c99] active:scale-[0.98] rounded-xl shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            {editingOrder ? '주문 수정 완료' : '감귤 주문 등록하기'}
          </button>
        </div>
      </form>

      {/* Address Book Picker Modal */}
      {isCustomerPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#264c67] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#5c7eb1]" />
                주소록에서 선택
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomerPickerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="고객 이름 또는 전화번호 검색"
                className="w-full p-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {customers
                .filter(
                  (c) =>
                    c.name.includes(customerSearch) ||
                    c.phone.includes(customerSearch) ||
                    c.address.includes(customerSearch)
                )
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-[#62a4bc] hover:bg-[#f7e2e2]/40 transition-colors flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1b1430]">{c.name}</span>
                        <span className="font-mono text-xs text-slate-600">{c.phone}</span>
                        {c.orderCount > 1 && (
                          <span className="text-[10px] bg-[#f7e2e2] text-[#1b1430] px-1 rounded font-semibold">
                            {c.orderCount}회 주문
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">{c.address}</div>
                    </div>
                    <span className="text-xs text-[#5c7eb1] font-bold shrink-0 mt-1">선택</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
