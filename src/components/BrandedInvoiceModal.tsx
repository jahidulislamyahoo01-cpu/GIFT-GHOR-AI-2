import React, { useRef } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  X,
  Phone,
  MapPin,
  Calendar,
  Package,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface InvoiceOrderData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productPrice: number;
  quantity: number;
  variant?: string;
  imageUrl?: string;
  deliveryLocation: 'inside_dhaka' | 'outside_dhaka';
  deliveryCharge: number;
  totalAmount: number;
  createdAt?: string;
  status?: string;
  source?: string;
}

interface BrandedInvoiceModalProps {
  order: InvoiceOrderData;
  isOpen: boolean;
  onClose: () => void;
  brandLogo?: string;
  brandName?: string;
}

export const BrandedInvoiceModal: React.FC<BrandedInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  brandLogo = 'https://giftghor.world/assets/logo.png',
  brandName = 'Gift Ghor',
}) => {
  const [copied, setCopied] = React.useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const subtotal = (order.productPrice || 0) * (order.quantity || 1);
  const isInsideDhaka = order.deliveryLocation === 'inside_dhaka';
  const deliveryCharge = order.deliveryCharge || (isInsideDhaka ? 70 : 130);
  const finalTotal = order.totalAmount || (subtotal + deliveryCharge);

  // Print invoice using browser native print with custom print styles
  const handlePrint = () => {
    window.print();
  };

  // Copy invoice text summary
  const handleCopySummary = () => {
    const text = `🧾 Gift Ghor Invoice Summary\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🆔 অর্ডার আইডি: #${order.orderNumber}\n` +
      `📅 তারিখ: ${formattedDate} (${formattedTime})\n` +
      `👤 ক্রেতার নাম: ${order.customerName || 'সম্মানিত ক্রেতা'}\n` +
      `📞 মোবাইল: ${order.customerPhone}\n` +
      `📍 ঠিকানা: ${order.customerAddress}\n` +
      `🛍️ প্রোডাক্ট: ${order.productName}${order.variant ? ` (${order.variant})` : ''} x ${order.quantity}টি\n` +
      `💰 সাবটোটাল: ৳${subtotal} BDT\n` +
      `🚚 ডেলিভারি চার্জ: ৳${deliveryCharge} BDT (${isInsideDhaka ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'})\n` +
      `💵 সর্বমোট COD বিল: ৳${finalTotal} BDT\n` +
      `━━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 ওয়েবসাইট: giftghor.world | হটলাইন: 01835062400`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp share
  const whatsappUrl = `https://wa.me/8801835062400?text=${encodeURIComponent(
    `আসসালামু আলাইকুম, আমি Gift Ghor থেকে #${order.orderNumber} অর্ডারটি করেছি।\nপ্রোডাক্ট: ${order.productName}\nমোট বিল: ৳${finalTotal} BDT`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      {/* Hidden print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 24px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col my-auto max-h-[95vh]">
        {/* Top Action Bar (Don't Print) */}
        <div className="no-print bg-gradient-to-r from-[#FDF7EE] via-white to-[#FDF7EE] px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-[#262626] leading-tight">
                অফিসিয়াল ক্যাশ মেমো / ইনভয়েস
              </h3>
              <p className="text-[10px] text-gray-500">
                অর্ডার #{order.orderNumber} • নিশ্চিত হয়েছে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="প্রিন্ট অথবা PDF হিসেবে সেভ করুন"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">প্রিন্ট / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          id="printable-invoice"
          ref={invoiceRef}
          className="p-5 sm:p-7 overflow-y-auto space-y-5 bg-white text-[#262626] text-xs"
        >
          {/* Header with Logo and Brand Identity */}
          <div className="flex items-start justify-between pb-5 border-b border-gray-200 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF7EE] border border-[#ECA548]/40 p-1 flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={brandLogo}
                    alt={brandName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://giftghor.world/assets/logo.png';
                    }}
                  />
                </div>
                <div>
                  <h1 className="font-black text-lg tracking-tight text-[#262626]">
                    {brandName}
                  </h1>
                  <p className="text-[10px] font-semibold text-[#ECA548] tracking-wider uppercase">
                    প্ৰিমিয়াম গিফট ও লাইফস্টাইল
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 pt-1">
                🌐 giftghor.world • 📞 হটলাইন: 01835062400
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30">
                CASH MEMO / INVOICE
              </span>
              <p className="font-mono font-black text-sm text-[#262626]">
                #{order.orderNumber}
              </p>
              <p className="text-[10px] text-gray-500">
                তারিখ: {formattedDate}
              </p>
              <p className="text-[10px] text-gray-400">
                সময়: {formattedTime}
              </p>
            </div>
          </div>

          {/* Customer Details Box */}
          <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-gray-150 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                গ্রাহকের বিবরণ (BILL TO)
              </span>
              <h4 className="font-bold text-sm text-[#262626]">
                {order.customerName || 'সম্মানিত ক্রেতা'}
              </h4>
              <p className="font-mono text-xs text-gray-700 font-semibold mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#ECA548]" />
                {order.customerPhone}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                ডেলিভারি ঠিকানা
              </span>
              <p className="text-xs text-gray-700 leading-relaxed font-medium flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#ECA548] shrink-0 mt-0.5" />
                <span>{order.customerAddress}</span>
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800">
                  {isInsideDhaka ? 'ঢাকার ভিতরে (৳৭০)' : 'ঢাকার বাইরে (৳১৩০)'}
                </span>
                <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800">
                  ক্যাশ অন ডেলিভারি
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-bold text-[11px] border-b border-gray-200">
                  <th className="p-3">আইটেম বিবরণ</th>
                  <th className="p-3 text-center">পরিমাণ</th>
                  <th className="p-3 text-right">মূল্য</th>
                  <th className="p-3 text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                <tr>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {order.imageUrl && (
                        <img
                          src={order.imageUrl}
                          alt={order.productName}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <span className="font-bold text-xs text-[#262626] block">
                          {order.productName}
                        </span>
                        {order.variant && (
                          <span className="text-[10px] text-gray-500 font-medium block">
                            কালার/ভ্যারিয়েন্ট: {order.variant}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-gray-700">
                    {order.quantity}টি
                  </td>
                  <td className="p-3 text-right text-gray-600 font-medium">
                    ৳{order.productPrice}
                  </td>
                  <td className="p-3 text-right font-bold text-[#262626]">
                    ৳{subtotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Breakdown Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <div className="space-y-1.5 text-[10.5px] text-gray-500 max-w-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>১০০% আসল প্রোডাক্ট ও নিরাপদ ডেলিভারি</span>
              </div>
              <p className="leading-relaxed">
                প্যাকেট খুলে চেক করে মূল্য পরিশোধ করার সুবিধা। কোনো সমস্যা হলে ২৪ ঘণ্টার মধ্যে আমাদের জানান।
              </p>
            </div>

            <div className="w-full sm:w-64 bg-gray-50 rounded-2xl p-3.5 border border-gray-150 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>আইটেম সাবটোটাল:</span>
                <span className="font-semibold">৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>ডেলিভারি চার্জ:</span>
                <span className="font-semibold">৳{deliveryCharge}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-sm text-[#262626]">
                <span>সর্বমোট প্রদেয় (COD):</span>
                <span className="text-[#ECA548]">৳{finalTotal} BDT</span>
              </div>
            </div>
          </div>

          {/* Footer Barcode Simulation & Sign */}
          <div className="pt-4 border-t border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              {/* Simulated barcode */}
              <div className="flex items-center space-x-0.5 h-6">
                <span className="w-0.5 h-6 bg-black" />
                <span className="w-1 h-6 bg-black" />
                <span className="w-0.5 h-6 bg-transparent" />
                <span className="w-1.5 h-6 bg-black" />
                <span className="w-0.5 h-6 bg-black" />
                <span className="w-1 h-6 bg-black" />
                <span className="w-0.5 h-6 bg-black" />
                <span className="w-1.5 h-6 bg-black" />
                <span className="w-0.5 h-6 bg-black" />
                <span className="w-2 h-6 bg-black" />
                <span className="w-0.5 h-6 bg-black" />
                <span className="w-1 h-6 bg-black" />
              </div>
              <span className="font-mono text-[9px] text-gray-400">
                {order.orderNumber}
              </span>
            </div>

            <p className="text-[10px] text-gray-400">
              Gift Ghor-এর সাথে থাকার জন্য ধন্যবাদ! ❤️
            </p>
          </div>
        </div>

        {/* Bottom Action Footer (Don't Print) */}
        <div className="no-print p-4 bg-gray-50 border-t border-gray-150 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে ✓' : 'মেমো কপি করুন'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp-এ শেয়ার</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              style={{ backgroundColor: '#ECA548' }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ইনভয়েস প্রিন্ট / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
