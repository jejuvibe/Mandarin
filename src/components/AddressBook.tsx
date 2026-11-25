import React, { useState } from 'react';
import { Search, UserPlus, Phone, MapPin, ShoppingBag, Calendar, Copy, Check, Edit2, Trash2, Plus, Users } from 'lucide-react';
import { Customer } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { useToast } from './Toast';

interface AddressBookProps {
  customers: Customer[];
  onSelectCustomerForOrder: (customer: Customer) => void;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const AddressBook: React.FC<AddressBookProps> = ({
  customers,
  onSelectCustomerForOrder,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.replace(/[^0-9]/g, '').includes(searchTerm.replace(/[^0-9]/g, '')) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = async (e: React.MouseEvent, text: string, key: string, label: string) => {
    e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      showToast(`${label} 복사되었습니다!`, 'copy');
      setTimeout(() => setCopiedKey(null), 1400);
    }
  };

  const handleOpenNewCustomer = () => {
    setEditingCustomer({
      id: `CUST-${Date.now()}`,
      name: '',
      phone: '',
      address: '',
      orderCount: 0,
      totalSpent: 0,
      lastOrderedAt: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setIsEditing(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.phone) {
      showToast('성함과 연락처를 입력해 주세요.', 'error');
      return;
    }
    onSaveCustomer(editingCustomer);
    showToast('고객 정보가 주소록에 저장되었습니다.', 'success');
    setIsEditing(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="주소록 검색 (이름, 휴대전화, 주소)"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 shrink-0 font-medium">
            등록된 고객: <strong className="text-[#264c67] font-bold">{filteredCustomers.length}</strong>명
          </span>
          <button
            type="button"
            onClick={handleOpenNewCustomer}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#5c7eb1] hover:bg-[#4d6c99] text-white transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            새 고객 등록
          </button>
        </div>
      </div>

      {/* Customer List: Tabular Format (User requirement: 주소록으로 표형식으로 길 나열) */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#f7e2e2] text-[#5c7eb1] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#264c67]">검색된 주소록 정보가 없습니다.</p>
          <p className="text-xs text-slate-400">주문이 등록되면 고객 정보가 자동으로 주소록에 누적됩니다.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[880px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 w-32 whitespace-nowrap">이름</th>
                  <th className="py-3 px-3.5 w-36 whitespace-nowrap">전화번호</th>
                  <th className="py-3 px-3.5 min-w-[220px]">배송지 주소</th>
                  <th className="py-3 px-3.5 w-28 whitespace-nowrap text-right">주문 누적</th>
                  <th className="py-3 px-3.5 w-28 whitespace-nowrap text-center">최근 주문</th>
                  <th className="py-3 px-3.5 min-w-[160px]">특이사항 / 메모</th>
                  <th className="py-3 px-3.5 w-32 whitespace-nowrap text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[#f7e2e2]/30 transition-colors"
                  >
                    {/* 1. 성함 */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#264c67] text-xs sm:text-sm">
                          {customer.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, customer.name, `name-${customer.id}`, '성함이')}
                          className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs"
                          title="이름 복사"
                        >
                          {copiedKey === `name-${customer.id}` ? (
                            <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                        {customer.orderCount > 1 && (
                          <span className="text-[10px] font-bold text-[#264c67] bg-[#f7e2e2] border border-[#ecd2d2] px-1.5 py-0.2 rounded-full">
                            {customer.orderCount}회
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. 전화번호 */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center justify-between gap-1 font-mono">
                        <span className="text-xs font-semibold text-slate-800">
                          {customer.phone}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, customer.phone, `phone-${customer.id}`, '전화번호가')}
                          className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs shrink-0"
                          title="전화번호 복사"
                        >
                          {copiedKey === `phone-${customer.id}` ? (
                            <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. 배송지 주소 */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-start justify-between gap-1.5 group">
                        <span className="text-xs text-slate-800 leading-snug break-keep">
                          {customer.address}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(e, customer.address, `addr-${customer.id}`, '주소가')}
                          className="text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 transition-colors inline-flex items-center shadow-2xs shrink-0"
                          title="주소 복사"
                        >
                          {copiedKey === `addr-${customer.id}` ? (
                            <Check className="w-2.5 h-2.5 text-[#5c7eb1]" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 4. 누적 주문/금액 */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right">
                      <div className="font-bold text-[#264c67] font-mono text-xs">
                        {customer.totalSpent.toLocaleString('ko-KR')}원
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        총 {customer.orderCount}건 주문
                      </div>
                    </td>

                    {/* 5. 최근 주문일 */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center text-xs text-slate-600 font-mono">
                      {customer.lastOrderedAt || '-'}
                    </td>

                    {/* 6. 특이사항 / 메모 */}
                    <td className="py-3 px-3.5 text-xs text-slate-600">
                      {customer.notes ? (
                        <span className="line-clamp-2 bg-slate-50 p-1 rounded border border-slate-100" title={customer.notes}>
                          {customer.notes}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 7. 관리 & 새 주문 작성 */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectCustomerForOrder(customer)}
                          className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#62a4bc] hover:bg-[#5293a9] text-white transition-colors shadow-2xs inline-flex items-center gap-0.5"
                          title="이 고객으로 새 주문 작성"
                        >
                          <Plus className="w-3 h-3" />
                          주문
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsEditing(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                          title="고객 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCustomer(customer.id);
                            showToast(`${customer.name} 고객 정보가 삭제되었습니다.`, 'info');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="고객 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add Customer Modal */}
      {isEditing && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#264c67]">
                {editingCustomer.id.startsWith('CUST-') ? '고객 정보 등록' : '고객 정보 수정'}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">고객 성함 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">휴대전화 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc] font-mono text-[#264c67]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">기본 배송지 주소 <span className="text-rose-500">*</span></label>
                <textarea
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">고객 특이사항 / 메모</label>
                <input
                  type="text"
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="예: 10kg 자주 주문, 문 앞 보관 선호"
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#62a4bc]/30 focus:border-[#62a4bc]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#5c7eb1] hover:bg-[#4d6c99] rounded-xl transition-colors"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
