import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Truck,
  FileText,
} from 'lucide-react';
import { InvoiceOrderData, ReceiptQRCode } from './BrandedInvoiceModal';

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

  // Format date DD-MM-YYYY
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const day = String(orderDate.getDate()).padStart(2, '0');
  const month = String(orderDate.getMonth() + 1).padStart(2, '0');
  const year = orderDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  // Numbers
  const unitPrice = Number(order.productPrice || 0);
  const qty = Number(order.quantity || 1);
  const subtotal = unitPrice * qty;
  const isInside = order.deliveryLocation === 'inside_dhaka';
  const deliveryCharge = order.deliveryCharge !== undefined ? Number(order.deliveryCharge) : (isInside ? 70 : 130);
  const grandTotal = order.totalAmount || (subtotal + deliveryCharge);
  const advancedPay = Number(order.advancedPay || 0);
  const duePay = Math.max(0, grandTotal - advancedPay);

  // Extract clean numerical invoice number
  const numericInvoice = order.orderNumber
    ? order.orderNumber.replace(/\D/g, '') || '3178967'
    : '3178967';

  // Barcode / Tracking code
  const trackingNumber = '30' + (numericInvoice.padStart(7, '0'));

  const handleCopy = () => {
    const text = `🧾 GIFT GHOR Official Invoice (${formattedDate})\n` +
      `Invoice Number: ${numericInvoice}\n` +
      `-----------------------------\n` +
      `Customer: ${order.customerName || 'Customer'}\n` +
      `Phone: ${order.customerPhone}\n` +
      `Address: ${order.customerAddress}\n` +
      `Product: ${order.productName} x ${qty}\n` +
      `Grand Total: BDT ${grandTotal.toFixed(2)}\n` +
      `Due Pay: BDT ${duePay.toFixed(2)}\n` +
      `Contact: +8801522126525 | support@giftghorbd.com`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="my-2.5 bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden text-black font-sans text-xs">
      {/* Printable / Clean Receipt Card Content Matching IMG_1529 1:1 */}
      <div className="p-4 sm:p-5 space-y-3.5 bg-white">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          {/* Logo & Date */}
          <div className="space-y-1.5">
            <img
              src="https://giftghor.world/assets/logo.png"
              alt="Gift Ghor"
              className="w-8 h-8 object-contain"
            />
            <p className="text-[11px] text-gray-800 font-medium">
              Date: {formattedDate}
            </p>
          </div>

          {/* Center Invoice Number */}
          <div className="text-center pt-0.5">
            <span className="text-[10px] text-gray-700 block">Invoice Number:</span>
            <span className="text-base font-bold text-black font-sans tracking-wide block mt-0.5">
              {numericInvoice}
            </span>
          </div>

          {/* Right QR Code Box */}
          <div>
            <ReceiptQRCode value={numericInvoice} trackingNum={trackingNumber} size={52} />
          </div>
        </div>

        <hr className="border-t border-gray-300 my-2" />

        {/* From & Bill To Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-[11px]">
          {/* From Box */}
          <div className="border border-gray-700 bg-white">
            <div className="border-b border-gray-700 px-2 py-1 font-bold text-[11px] text-black">
              From
            </div>
            <div className="p-2 space-y-0.5 text-gray-900 leading-tight">
              <p className="font-bold uppercase tracking-tight">GIFT GHOR</p>
              <p>MogBazar,Dhaka</p>
              <p>+8801522126525</p>
            </div>
          </div>

          {/* Bill To Box */}
          <div className="border border-gray-700 bg-white">
            <div className="border-b border-gray-700 px-2 py-1 font-bold text-[11px] text-black">
              Bill To
            </div>
            <div className="p-2 space-y-0.5 text-gray-900 leading-tight">
              <p className="font-semibold text-black">{order.customerName || 'Customer'}</p>
              <p className="font-mono text-gray-800">{order.customerPhone || 'N/A'}</p>
              <p className="text-gray-800 break-words line-clamp-2 leading-tight">{order.customerAddress || 'Dhaka'}</p>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="pt-1">
          <table className="w-full border border-gray-800 border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-gray-800 text-black bg-gray-50">
                <th className="border-r border-gray-800 px-1.5 py-1.5 text-center font-bold w-7">
                  No.
                </th>
                <th className="border-r border-gray-800 px-2 py-1.5 text-left font-bold">
                  Product Description
                </th>
                <th className="border-r border-gray-800 px-1.5 py-1.5 text-center font-bold w-10">
                  QTY
                </th>
                <th className="border-r border-gray-800 px-2 py-1.5 text-right font-bold">
                  Unit Price
                </th>
                <th className="px-2 py-1.5 text-right font-bold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-black align-top">
                <td className="border-r border-gray-800 px-1.5 py-2 text-center font-medium">
                  1
                </td>
                <td className="border-r border-gray-800 px-2 py-2 space-y-0.5">
                  <p className="font-medium text-black leading-tight">{order.productName}</p>
                  {order.variant && (
                    <p className="text-[9.5px] text-gray-600 font-normal">
                      {order.productName.split(' ')[0]} Wallet: {order.variant}
                    </p>
                  )}
                </td>
                <td className="border-r border-gray-800 px-1.5 py-2 text-center font-medium">
                  {qty}
                </td>
                <td className="border-r border-gray-800 px-2 py-2 text-right font-mono text-[10.5px]">
                  <span>BDT {unitPrice.toFixed(2)}</span>
                </td>
                <td className="px-2 py-2 text-right font-mono font-semibold text-[10.5px]">
                  <span>BDT {subtotal.toFixed(2)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-0.5">
          <div className="w-48 space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-gray-800">
              <span>Sub Total</span>
              <span className="font-mono">BDT {subtotal.toFixed(2)}</span>
            </div>

            {deliveryCharge > 0 && (
              <div className="flex justify-between items-center text-gray-800">
                <span>Delivery Charge</span>
                <span className="font-mono">BDT {deliveryCharge.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-black font-bold pt-0.5">
              <span>Grand Total</span>
              <span className="font-mono">BDT {grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-800">
              <span>Advanced Pay</span>
              <span className="font-mono">BDT {advancedPay.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-black font-bold pt-0.5 border-t border-gray-300">
              <span>Due Pay</span>
              <span className="font-mono">BDT {duePay.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <hr className="border-t border-gray-300 my-2" />

        {/* Footer */}
        <div className="text-center text-[11px] text-gray-900 space-y-0.5">
          <p className="font-medium">Thank you!</p>
          <p className="font-mono text-[10px] text-gray-700">
            +8801522126525 | support@giftghorbd.com
          </p>
        </div>

        {/* In-Chat Interactive Action Row */}
        <div className="pt-2 flex items-center gap-2 no-print border-t border-dashed border-gray-200">
          <button
            type="button"
            onClick={() => onOpenInvoiceModal(order)}
            className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-black hover:bg-gray-800 text-white transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট / ফুল ইনভয়েস</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onTrackOrder && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.orderNumber)}
              className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition flex items-center gap-1 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-gray-600" />
              <span>Track</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
