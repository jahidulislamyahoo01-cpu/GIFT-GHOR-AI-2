import React, { useRef } from 'react';
import {
  Printer,
  X,
  Copy,
  Check,
  Share2,
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
  advancedPay?: number;
}

interface BrandedInvoiceModalProps {
  order: InvoiceOrderData;
  isOpen: boolean;
  onClose: () => void;
  brandLogo?: string;
  brandName?: string;
}

// Clean Vector QR Code Component matching exact style
export const ReceiptQRCode: React.FC<{ value: string; trackingNum?: string; size?: number }> = ({
  value,
  trackingNum,
  size = 72,
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="border border-black p-1 bg-white inline-block">
        <svg
          width={size}
          height={size}
          viewBox="0 0 21 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="21" height="21" fill="white" />
          {/* Top-Left Finder */}
          <rect x="0" y="0" width="7" height="7" fill="black" />
          <rect x="1" y="1" width="5" height="5" fill="white" />
          <rect x="2" y="2" width="3" height="3" fill="black" />

          {/* Top-Right Finder */}
          <rect x="14" y="0" width="7" height="7" fill="black" />
          <rect x="15" y="1" width="5" height="5" fill="white" />
          <rect x="16" y="2" width="3" height="3" fill="black" />

          {/* Bottom-Left Finder */}
          <rect x="0" y="14" width="7" height="7" fill="black" />
          <rect x="1" y="15" width="5" height="5" fill="white" />
          <rect x="2" y="16" width="3" height="3" fill="black" />

          {/* Data Modules */}
          <rect x="8" y="1" width="2" height="1" fill="black" />
          <rect x="11" y="0" width="1" height="3" fill="black" />
          <rect x="8" y="3" width="1" height="3" fill="black" />
          <rect x="10" y="4" width="3" height="1" fill="black" />
          <rect x="8" y="8" width="5" height="5" fill="black" />
          <rect x="9" y="9" width="3" height="3" fill="white" />
          <rect x="10" y="10" width="1" height="1" fill="black" />
          <rect x="2" y="8" width="3" height="2" fill="black" />
          <rect x="0" y="11" width="2" height="1" fill="black" />
          <rect x="15" y="8" width="2" height="3" fill="black" />
          <rect x="18" y="10" width="3" height="1" fill="black" />
          <rect x="8" y="15" width="2" height="4" fill="black" />
          <rect x="11" y="14" width="3" height="2" fill="black" />
          <rect x="16" y="15" width="4" height="2" fill="black" />
          <rect x="15" y="18" width="2" height="3" fill="black" />
          <rect x="19" y="19" width="2" height="2" fill="black" />
        </svg>
      </div>
      <span className="text-[11px] font-mono tracking-tight text-black mt-1 font-semibold">
        {trackingNum || '303584913'}
      </span>
    </div>
  );
};

export const BrandedInvoiceModal: React.FC<BrandedInvoiceModalProps> = ({
  order,
  isOpen,
  onClose,
  brandLogo = 'https://giftghor.world/assets/logo.png',
}) => {
  const [copied, setCopied] = React.useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

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

  // Barcode / Tracking code below QR
  const trackingNumber = '30' + (numericInvoice.padStart(7, '0'));

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      {/* CSS Styles for Clean Native Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[96vh]">
        {/* Top Control Bar (Non-Printable) */}
        <div className="no-print bg-gray-100 px-5 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">GIFT GHOR Official Invoice</span>
            <span className="text-xs text-gray-500 font-mono">#{numericInvoice}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Clean Invoice Matching Image Design 1:1 */}
        <div
          id="printable-invoice"
          ref={invoiceRef}
          className="p-6 sm:p-8 overflow-y-auto bg-white text-black text-xs font-sans space-y-4"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {/* Top Header Section */}
          <div className="flex items-start justify-between">
            {/* Left: Logo & Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <img
                  src={brandLogo}
                  alt="Gift Ghor"
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://giftghor.world/assets/logo.png';
                  }}
                />
              </div>
              <p className="text-xs text-gray-800 font-medium">
                Date: {formattedDate}
              </p>
            </div>

            {/* Center: Invoice Number */}
            <div className="text-center pt-1">
              <span className="text-xs text-gray-800 block font-normal">Invoice Number:</span>
              <span className="text-xl font-bold text-black font-sans tracking-wide block mt-1">
                {numericInvoice}
              </span>
            </div>

            {/* Right: QR Code & Tracking Code */}
            <div>
              <ReceiptQRCode value={numericInvoice} trackingNum={trackingNumber} size={68} />
            </div>
          </div>

          {/* Top Separator Line */}
          <hr className="border-t border-gray-300 my-3" />

          {/* From & Bill To Boxes */}
          <div className="grid grid-cols-2 gap-4">
            {/* From Box */}
            <div className="border border-gray-700 bg-white">
              <div className="border-b border-gray-700 px-3 py-1.5 font-bold text-xs text-black">
                From
              </div>
              <div className="p-3 space-y-0.5 text-[11px] text-gray-900 leading-normal">
                <p className="font-bold uppercase tracking-tight">GIFT GHOR</p>
                <p>MogBazar,Dhaka</p>
                <p>+8801522126525</p>
              </div>
            </div>

            {/* Bill To Box */}
            <div className="border border-gray-700 bg-white">
              <div className="border-b border-gray-700 px-3 py-1.5 font-bold text-xs text-black">
                Bill To
              </div>
              <div className="p-3 space-y-0.5 text-[11px] text-gray-900 leading-tight">
                <p className="font-semibold text-black">{order.customerName || 'Customer'}</p>
                <p className="font-mono text-gray-800">{order.customerPhone || 'N/A'}</p>
                <p className="text-gray-800 break-words leading-snug">{order.customerAddress || 'Dhaka'}</p>
              </div>
            </div>
          </div>

          {/* Product Description Table */}
          <div className="pt-2">
            <table className="w-full border border-gray-800 border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-black">
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold w-10">
                    No.
                  </th>
                  <th className="border-r border-gray-800 px-3 py-2 text-left font-bold">
                    Product Description
                  </th>
                  <th className="border-r border-gray-800 px-2 py-2 text-center font-bold w-14">
                    QTY
                  </th>
                  <th className="border-r border-gray-800 px-3 py-2 text-right font-bold w-32">
                    Unit Price
                  </th>
                  <th className="px-3 py-2 text-right font-bold w-32">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-black align-top">
                  <td className="border-r border-gray-800 px-2 py-2.5 text-center font-medium">
                    1
                  </td>
                  <td className="border-r border-gray-800 px-3 py-2.5 space-y-0.5">
                    <p className="font-medium text-black">{order.productName}</p>
                    {order.variant && (
                      <p className="text-[10px] text-gray-600 font-normal">
                        {order.productName.split(' ')[0]} Wallet: {order.variant}
                      </p>
                    )}
                  </td>
                  <td className="border-r border-gray-800 px-2 py-2.5 text-center font-medium">
                    {qty}
                  </td>
                  <td className="border-r border-gray-800 px-3 py-2.5 text-right font-mono">
                    <span className="float-left text-gray-700">BDT</span>
                    <span>{unitPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold">
                    <span className="float-left text-gray-700">BDT</span>
                    <span>{subtotal.toFixed(2)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown Section */}
          <div className="flex justify-end pt-1">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-gray-800">
                <span className="font-medium">Sub Total</span>
                <span className="font-mono">
                  BDT {subtotal.toFixed(2)}
                </span>
              </div>

              {deliveryCharge > 0 && (
                <div className="flex justify-between items-center text-gray-800">
                  <span className="font-medium">
                    Delivery Charge ({isInside ? 'Inside Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span className="font-mono">
                    BDT {deliveryCharge.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-black font-bold pt-1">
                <span>Grand Total</span>
                <span className="font-mono">
                  BDT {grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-gray-800">
                <span className="font-medium">Advanced Pay</span>
                <span className="font-mono">
                  BDT {advancedPay.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-black font-bold pt-1 border-t border-gray-300">
                <span>Due Pay</span>
                <span className="font-mono">
                  BDT {duePay.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Separator & Footer */}
          <hr className="border-t border-gray-300 my-4" />

          <div className="text-center text-xs text-gray-900 space-y-1">
            <p className="font-medium">Thank you!</p>
            <p className="font-mono text-[11px] text-gray-700">
              +8801522126525 | support@giftghorbd.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
