import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  Truck,
  MapPin,
  Phone,
  Package,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { InvoiceOrderData } from './BrandedInvoiceModal';

interface DigitalReceiptCardProps {
  order: InvoiceOrderData;
  onOpenInvoiceModal: (order: InvoiceOrderData) => void;
  onTrackOrder?: (query: string) => void;
}

export const DigitalReceiptCard: React.FC<DigitalReceiptCardProps> = ({
  order,
  onOpenInvoiceModal,
  onTrackOrder,
}) => {
  const [copied, setCopied] = useState(false);

  const isInsideDhaka = order.deliveryLocation === 'inside_dhaka';
  const subtotal = (order.productPrice || 0) * (order.quantity || 1);
  const deliveryCharge = order.deliveryCharge || (isInsideDhaka ? 70 : 130);
  const totalAmount = order.totalAmount || (subtotal + deliveryCharge);

  const handleCopy = () => {
    const text = `🧾 Gift Ghor ডিজিটাল রিসিট (#${order.orderNumber})\n` +
      `👤 ক্রেতা: ${order.customerName || 'সম্মানিত ক্রেতা'}\n` +
      `📞 মোবাইল: ${order.customerPhone}\n` +
      `📍 ঠিকানা: ${order.customerAddress}\n` +
      `🛍️ প্রোডাক্ট: ${order.productName}${order.variant ? ` (${order.variant})` : ''} x ${order.quantity}টি\n` +
      `💰 মোট বিল: ৳${totalAmount} BDT (ক্যাশ অন ডেলিভারি)\n` +
      `🌐 giftghor.world`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="my-2 bg-white rounded-2xl border border-amber-200/90 shadow-sm overflow-hidden text-xs text-[#262626] animate-fadeIn">
      {/* Receipt Header */}
      <div className="bg-gradient-to-r from-[#FDF7EE] via-amber-50/50 to-white px-3.5 py-2.5 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#ECA548] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🧾
          </div>
          <div>
            <span className="font-extrabold text-[12px] text-[#262626] block leading-tight">
              ডিজিটাল ক্যাশ মেমো
            </span>
            <span className="font-mono text-[10px] text-gray-500 font-bold">
              #{order.orderNumber}
            </span>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>কনফার্মড (COD)</span>
        </span>
      </div>

      {/* Product Summary Row */}
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-2.5 bg-gray-50 p-2 rounded-xl border border-gray-150">
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
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-[11.5px] text-[#262626] line-clamp-1">
              {order.productName}
            </h5>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
              {order.variant && (
                <span className="text-[#ECA548] font-bold">কালার: {order.variant}</span>
              )}
              <span>পরিমাণ: {order.quantity}টি</span>
            </div>
          </div>
          <span className="font-extrabold text-xs text-[#262626] shrink-0">
            ৳{subtotal}
          </span>
        </div>

        {/* Customer & Location */}
        <div className="space-y-1 text-[11px] text-gray-600 px-0.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#ECA548]" />
              <span className="font-mono font-semibold">{order.customerPhone}</span>
            </span>
            <span className="text-gray-400">({order.customerName || 'ক্রেতা'})</span>
          </div>

          <div className="flex items-start gap-1 text-gray-600">
            <MapPin className="w-3 h-3 text-[#ECA548] shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{order.customerAddress}</span>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="pt-2 border-t border-gray-150 space-y-1 text-[11px]">
          <div className="flex justify-between text-gray-500">
            <span>ডেলিভারি চার্জ:</span>
            <span>৳{deliveryCharge} ({isInsideDhaka ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'})</span>
          </div>
          <div className="flex justify-between font-extrabold text-xs text-[#262626] pt-1 border-t border-dashed border-gray-200">
            <span>সর্বমোট প্রদেয় বিল (COD):</span>
            <span className="text-[#ECA548]">৳{totalAmount} BDT</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenInvoiceModal(order)}
            className="flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold bg-[#ECA548] hover:bg-[#d6913a] text-white transition flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ইনভয়েস দেখুন / প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center gap-1 active:scale-95"
            title="মেমো কপি করুন"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'কপি' : 'কপি'}</span>
          </button>

          {onTrackOrder && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.orderNumber)}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition flex items-center gap-1 active:scale-95"
              title="ট্র্যাকিং দেখুন"
            >
              <Truck className="w-3 h-3 text-gray-500" />
              <span>ট্র্যাক</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
