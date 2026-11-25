import React, { useState, useEffect } from 'react';
import { AppSettings, Customer, Order, OrderStatus, ParsedOrderData, SeasonSettlement } from './types';
import { DEFAULT_SETTINGS, INITIAL_CUSTOMERS, INITIAL_ORDERS } from './data/initialData';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FarmHeroSummary } from './components/FarmHeroSummary';
import { OrderList } from './components/OrderList';
import { NewOrderForm } from './components/NewOrderForm';
import { AddressBook } from './components/AddressBook';
import { RevenueDashboard } from './components/RevenueDashboard';
import { SmartPasteModal } from './components/SmartPasteModal';
import { MessageTemplatesModal } from './components/MessageTemplatesModal';
import { SettingsModal } from './components/SettingsModal';
import { PreOrderInquiryModal } from './components/PreOrderInquiryModal';
import {
  isFirebaseConfigured,
  subscribeOrdersFromDb,
  saveOrderToDb,
  deleteOrderFromDb,
  subscribeCustomersFromDb,
  saveCustomerToDb,
  deleteCustomerFromDb,
  subscribeSettingsFromDb,
  saveSettingsToDb,
} from './services/firebase';

const STORAGE_KEYS = {
  ORDERS: 'jeju_tangerine_orders_v1',
  CUSTOMERS: 'jeju_tangerine_customers_v1',
  SETTINGS: 'jeju_tangerine_settings_v1',
};

function TangerineAppContent() {
  const { showToast } = useToast();

  // 1. Persistent State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Replace previous default templates if they contained older wording
        const isOldDispatchTmpl = !parsed.dispatchNoticeTemplate || parsed.dispatchNoticeTemplate.includes('맛있고 달콤하게 익은') || parsed.dispatchNoticeTemplate.includes('[{farmName} 발송 안내]');
        const isOldBankTmpl = !parsed.bankNoticeTemplate || parsed.bankNoticeTemplate.includes('입금 확인 즉시 수확하여') || parsed.bankNoticeTemplate.includes('[{farmName} 주문 및 입금 안내]');
        const isOldShippingTmpl = !parsed.shippingNoticeTemplate || parsed.shippingNoticeTemplate.includes('상큼한 햇살') || parsed.shippingNoticeTemplate.includes('[{farmName} 배송 출발 안내]');
        const isOldPreOrderTmpl =
          !parsed.preOrderInquiryTemplate ||
          parsed.preOrderInquiryTemplate.includes('안녕하세요') ||
          parsed.preOrderInquiryTemplate.includes('싱싱한') ||
          parsed.preOrderInquiryTemplate.includes('산지직송 직거래') ||
          parsed.preOrderInquiryTemplate.includes('{dispatchDate}') ||
          parsed.preOrderInquiryTemplate.includes('정성껏 포장하여 발송해 드립니다');

        const isOldBank = !parsed.bankInfo || parsed.bankInfo.bankName === '농협' || parsed.bankInfo.accountHolder === '오제주(햇살농원)';
        const isOldPricing = !parsed.pricing || parsed.pricing.price10kg === 42000;

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          farmName: (!parsed.farmName || parsed.farmName === '제주 햇살농원 감귤' || parsed.farmName === '해찬솔농원') ? '해찬솔 농원' : parsed.farmName.replace('해찬솔농원', '해찬솔 농원'),
          sellerPhone: (!parsed.sellerPhone || parsed.sellerPhone === '010-9123-5678') ? DEFAULT_SETTINGS.sellerPhone : parsed.sellerPhone,
          bankInfo: isOldBank ? DEFAULT_SETTINGS.bankInfo : parsed.bankInfo,
          pricing: isOldPricing
            ? DEFAULT_SETTINGS.pricing
            : {
                ...DEFAULT_SETTINGS.pricing,
                ...(parsed.pricing || {}),
              },
          dispatchNoticeTemplate: isOldDispatchTmpl ? DEFAULT_SETTINGS.dispatchNoticeTemplate : parsed.dispatchNoticeTemplate,
          bankNoticeTemplate: isOldBankTmpl ? DEFAULT_SETTINGS.bankNoticeTemplate : parsed.bankNoticeTemplate,
          shippingNoticeTemplate: isOldShippingTmpl ? DEFAULT_SETTINGS.shippingNoticeTemplate : parsed.shippingNoticeTemplate,
          preOrderInquiryTemplate: isOldPreOrderTmpl ? DEFAULT_SETTINGS.preOrderInquiryTemplate : parsed.preOrderInquiryTemplate,
        };
      }
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const LEGACY_DUMMY_NAMES = ['김서연', '박민우', '이정희', '최동현', '한수진', '강호진', '윤지현'];

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsedOrders: Order[] = JSON.parse(saved);
        // Remove legacy dummy orders
        const cleaned = parsedOrders.filter((o) => !LEGACY_DUMMY_NAMES.includes(o.customerName));
        if (cleaned.length > 0) {
          return cleaned.map((o) => {
            if (o.status === 'in_transit' || o.status === 'preparing') {
              return { ...o, status: 'order_received' as OrderStatus };
            }
            return o;
          });
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_ORDERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed: Customer[] = JSON.parse(saved);
        const cleaned = parsed.filter((c) => !LEGACY_DUMMY_NAMES.includes(c.name));
        if (cleaned.length > 0) {
          return cleaned;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CUSTOMERS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  }, [customers]);

  // Real-time synchronization with Firebase if configured
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const unsubOrders = subscribeOrdersFromDb((remoteOrders) => {
      if (remoteOrders.length > 0) {
        setOrders(remoteOrders);
      }
    });

    const unsubCustomers = subscribeCustomersFromDb((remoteCustomers) => {
      if (remoteCustomers.length > 0) {
        setCustomers(remoteCustomers);
      }
    });

    const unsubSettings = subscribeSettingsFromDb((remoteSettings) => {
      setSettings((prev) => ({
        ...prev,
        ...remoteSettings,
      }));
    });

    return () => {
      unsubOrders();
      unsubCustomers();
      unsubSettings();
    };
  }, []);

  // UI Navigation & Modals State
  const [currentTab, setCurrentTab] = useState<'orders' | 'new-order' | 'customers' | 'revenue'>('orders');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedCustomerForOrder, setSelectedCustomerForOrder] = useState<Customer | null>(null);

  // Modals
  const [isSmartPasteModalOpen, setIsSmartPasteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPreOrderModalOpen, setIsPreOrderModalOpen] = useState(false);
  const [messageModalOrder, setMessageModalOrder] = useState<Order | null>(null);

  // Handlers for Orders
  const handleSaveOrder = (
    savedOrder: Order,
    updatedPricing?: { price5kg: number; price10kg: number }
  ) => {
    // 1. Update orders list (replace or prepend)
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === savedOrder.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedOrder;
        return copy;
      }
      return [savedOrder, ...prev];
    });

    // Sync order to Firebase if configured
    if (isFirebaseConfigured()) {
      saveOrderToDb(savedOrder);
    }

    // 2. Remember latest unit prices for future orders (User requirement!)
    if (updatedPricing) {
      setSettings((prev) => {
        const nextSettings = {
          ...prev,
          pricing: {
            ...prev.pricing,
            price5kg: updatedPricing.price5kg,
            price10kg: updatedPricing.price10kg,
          },
        };
        if (isFirebaseConfigured()) {
          saveSettingsToDb(nextSettings);
        }
        return nextSettings;
      });
    }

    // 3. Automatically add or update customer in address book (User requirement!)
    setCustomers((prev) => {
      const cleanPhone = savedOrder.phone.replace(/[^0-9]/g, '');
      const existingIdx = prev.findIndex(
        (c) => c.phone.replace(/[^0-9]/g, '') === cleanPhone || (c.name === savedOrder.customerName && cleanPhone.length > 8 && c.phone.replace(/[^0-9]/g, '').slice(-8) === cleanPhone.slice(-8))
      );

      let targetCustomer: Customer;
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        targetCustomer = {
          ...existing,
          name: savedOrder.customerName,
          phone: savedOrder.phone,
          address: savedOrder.address,
          orderCount: existing.orderCount + (editingOrder ? 0 : 1),
          totalSpent: existing.totalSpent + (editingOrder ? 0 : savedOrder.totalAmount),
          lastOrderedAt: savedOrder.createdAt.slice(0, 10),
          notes: savedOrder.memo ? (existing.notes ? `${existing.notes} / ${savedOrder.memo}` : savedOrder.memo) : existing.notes,
        };
        const updatedList = [...prev];
        updatedList[existingIdx] = targetCustomer;
        if (isFirebaseConfigured()) {
          saveCustomerToDb(targetCustomer);
        }
        return updatedList;
      } else {
        targetCustomer = {
          id: `CUST-${Date.now()}`,
          name: savedOrder.customerName,
          phone: savedOrder.phone,
          address: savedOrder.address,
          orderCount: 1,
          totalSpent: savedOrder.totalAmount,
          lastOrderedAt: savedOrder.createdAt.slice(0, 10),
          notes: savedOrder.memo,
        };
        if (isFirebaseConfigured()) {
          saveCustomerToDb(targetCustomer);
        }
        return [targetCustomer, ...prev];
      }
    });

    // Reset states and switch to orders tab
    setEditingOrder(null);
    setSelectedCustomerForOrder(null);
    setCurrentTab('orders');
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (isFirebaseConfigured()) {
      deleteOrderFromDb(orderId);
    }
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    dispatchDate?: string,
    trackingNumber?: string
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status,
            dispatchDate: dispatchDate !== undefined ? dispatchDate : o.dispatchDate,
            trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber,
          };
          if (isFirebaseConfigured()) {
            saveOrderToDb(updated);
          }
          return updated;
        }
        return o;
      })
    );
  };

  // Handlers for Customers
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.id === customer.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = customer;
        return copy;
      }
      return [customer, ...prev];
    });
    if (isFirebaseConfigured()) {
      saveCustomerToDb(customer);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (isFirebaseConfigured()) {
      deleteCustomerFromDb(id);
    }
  };

  const handleSelectCustomerForOrder = (customer: Customer) => {
    setSelectedCustomerForOrder(customer);
    setEditingOrder(null);
    setCurrentTab('new-order');
  };

  // Smart Parse Handled at Root level
  const handleApplyParsedDataFromModal = (data: ParsedOrderData) => {
    // Open new order form and pre-seed with parsed data
    const tempCustomer: Customer = {
      id: `PARSED-${Date.now()}`,
      name: data.customerName || '',
      phone: data.phone || '',
      address: data.address || '',
      postalCode: data.postalCode || undefined,
      orderCount: 0,
      totalSpent: 0,
      lastOrderedAt: new Date().toISOString().slice(0, 10),
      notes: data.memo || '',
    };
    setSelectedCustomerForOrder(tempCustomer);
    setEditingOrder(null);
    setCurrentTab('new-order');
  };

  // Season Settlement Handlers
  const handleSaveSettlement = (seasonKey: string, settlement: SeasonSettlement) => {
    setSettings((prev) => ({
      ...prev,
      settlements: {
        ...(prev.settlements || {}),
        [seasonKey]: settlement,
      },
    }));
  };

  const handleReopenSettlement = (seasonKey: string) => {
    setSettings((prev) => {
      const updated = { ...(prev.settlements || {}) };
      delete updated[seasonKey];
      return {
        ...prev,
        settlements: updated,
      };
    });
  };

  const handleAddSeason = (newSeasonKey: string) => {
    setSettings((prev) => {
      const existing = prev.customSeasons || [];
      if (existing.includes(newSeasonKey)) return prev;
      const updated = {
        ...prev,
        customSeasons: [...existing, newSeasonKey],
      };
      if (isFirebaseConfigured()) {
        saveSettingsToDb(updated);
      }
      return updated;
    });
  };

  const handleDeleteSeason = (seasonKey: string) => {
    setSettings((prev) => {
      const custom = (prev.customSeasons || []).filter((s) => s !== seasonKey);
      const deleted = Array.from(new Set([...(prev.deletedSeasons || []), seasonKey]));
      const settlements = { ...(prev.settlements || {}) };
      delete settlements[seasonKey];
      const updated = {
        ...prev,
        customSeasons: custom,
        deletedSeasons: deleted,
        settlements,
      };
      if (isFirebaseConfigured()) {
        saveSettingsToDb(updated);
      }
      return updated;
    });
  };

  // Data reset & restore
  const handleImportData = (data: { orders: Order[]; customers: Customer[]; settings: AppSettings }) => {
    if (data.orders) setOrders(data.orders);
    if (data.customers) setCustomers(data.customers);
    if (data.settings) setSettings(data.settings);
  };

  const handleResetToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
    setOrders(INITIAL_ORDERS);
    setCustomers(INITIAL_CUSTOMERS);
  };

  const pendingPaymentCount = orders.filter((o) => o.status === 'payment_pending').length;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1430] pb-20 md:pb-12">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setEditingOrder(null);
          setSelectedCustomerForOrder(null);
          setCurrentTab(tab);
        }}
        settings={settings}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPreOrderModal={() => setIsPreOrderModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        {/* Farm Hero & Today Summary Banner */}
        {currentTab === 'orders' && (
          <FarmHeroSummary
            orders={orders}
            settings={settings}
            onOpenSmartPaste={() => {
              setEditingOrder(null);
              setSelectedCustomerForOrder(null);
              setCurrentTab('new-order');
            }}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setSelectedCustomerForOrder(null);
              setCurrentTab('new-order');
            }}
            onOpenPreOrderModal={() => setIsPreOrderModalOpen(true)}
          />
        )}

        {/* Dynamic Tab Views */}
        {currentTab === 'orders' && (
          <OrderList
            orders={orders}
            settings={settings}
            onEditOrder={(order) => {
              setEditingOrder(order);
              setCurrentTab('new-order');
            }}
            onDeleteOrder={handleDeleteOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onOpenNewOrder={() => {
              setEditingOrder(null);
              setSelectedCustomerForOrder(null);
              setCurrentTab('new-order');
            }}
            onOpenSmartPaste={() => {
              setEditingOrder(null);
              setSelectedCustomerForOrder(null);
              setCurrentTab('new-order');
            }}
            onOpenMessageModal={(order) => setMessageModalOrder(order)}
          />
        )}

        {currentTab === 'new-order' && (
          <NewOrderForm
            settings={settings}
            customers={customers}
            editingOrder={editingOrder}
            initialCustomer={selectedCustomerForOrder}
            onSaveOrder={handleSaveOrder}
            onCancel={() => {
              setEditingOrder(null);
              setSelectedCustomerForOrder(null);
              setCurrentTab('orders');
            }}
            onOpenPreOrderModal={() => setIsPreOrderModalOpen(true)}
          />
        )}

        {currentTab === 'customers' && (
          <AddressBook
            customers={customers}
            onSelectCustomerForOrder={handleSelectCustomerForOrder}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {currentTab === 'revenue' && (
          <RevenueDashboard
            orders={orders}
            settings={settings}
            onSaveSettlement={handleSaveSettlement}
            onReopenSettlement={handleReopenSettlement}
            onAddSeason={handleAddSeason}
            onDeleteSeason={handleDeleteSeason}
          />
        )}
      </main>

      {/* Mobile Sticky Thumb Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setEditingOrder(null);
          setSelectedCustomerForOrder(null);
          setCurrentTab(tab);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        pendingPaymentCount={pendingPaymentCount}
      />

      {/* Modals */}
      <SmartPasteModal
        isOpen={isSmartPasteModalOpen}
        onClose={() => setIsSmartPasteModalOpen(false)}
        onApplyParsedData={handleApplyParsedDataFromModal}
      />

      <MessageTemplatesModal
        isOpen={!!messageModalOrder}
        onClose={() => setMessageModalOrder(null)}
        order={messageModalOrder}
        settings={settings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings(newSettings)}
        orders={orders}
        customers={customers}
        onImportData={handleImportData}
        onResetToDefault={handleResetToDefault}
      />

      <PreOrderInquiryModal
        isOpen={isPreOrderModalOpen}
        onClose={() => setIsPreOrderModalOpen(false)}
        settings={settings}
        customers={customers}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TangerineAppContent />
    </ToastProvider>
  );
}
