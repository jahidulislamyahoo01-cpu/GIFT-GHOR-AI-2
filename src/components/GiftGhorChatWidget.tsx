import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Gift,
  ChevronRight,
  Image as ImageIcon,
  RotateCcw,
  Menu,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Search,
  ShoppingBag,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';
import { products as defaultCatalog } from '../db/scraped_products';
import { detectDeliveryLocation } from '../utils/addressDetector';
import { BrandedInvoiceModal, InvoiceOrderData } from './BrandedInvoiceModal';
import { DigitalReceiptCard } from './DigitalReceiptCard';

interface WidgetProps {
  initialOpen?: boolean;
  standalone?: boolean;
  isIframeEmbed?: boolean;
}

export const GiftGhorChatWidget: React.FC<WidgetProps> = ({
  initialOpen = false,
  standalone = false,
  isIframeEmbed = false,
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen || standalone);

  // PostMessage for Iframe Embed Resizing
  useEffect(() => {
    if (isIframeEmbed && window.parent) {
      window.parent.postMessage(isOpen ? 'giftghor-open' : 'giftghor-close', '*');
    }
  }, [isOpen, isIframeEmbed]);

  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const [sessionMeta, setSessionMeta] = useState<{
    requestedHuman: boolean;
    humanRequestedAt: string | null;
    adminConnected: boolean;
    mode: 'ai' | 'admin_takeover';
  }>({
    requestedHuman: false,
    humanRequestedAt: null,
    adminConnected: false,
    mode: 'ai',
  });

  // Catalog Products & Quick Order Modal State
  const [catalogProducts, setCatalogProducts] = useState<any[]>(defaultCatalog || []);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSelectingProduct, setIsSelectingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderProduct, setOrderProduct] = useState<{
    id?: string;
    title: string;
    price: number;
    imageUrl?: string;
    variants?: Array<{ name: string; label: string; colorCode?: string; imageUrl: string }>;
  }>({
    id: defaultCatalog[0]?.id || '1333107',
    title: defaultCatalog[0]?.title || 'Cute Daisy Flower 3D Patch Mini Folding Ladies Wallet',
    price: defaultCatalog[0]?.price || 350,
    imageUrl: defaultCatalog[0]?.imageUrl || 'https://assets.zatiqeasy.com/easy/uploads/166014/inventories/be/80/1000015315-5963012600247387/original.jpg',
    variants: defaultCatalog[0]?.variants || [],
  });
  const [selectedVariant, setSelectedVariant] = useState<{
    name: string;
    label: string;
    colorCode?: string;
    imageUrl: string;
  } | null>(
    (defaultCatalog[0]?.variants && defaultCatalog[0]?.variants.length > 0)
      ? defaultCatalog[0].variants[0]
      : null
  );
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custLocation, setCustLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [autoDetectedReason, setAutoDetectedReason] = useState<string>('');
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<InvoiceOrderData | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [locationInfo, setLocationInfo] = useState<any>(null);

  // Auto detect user live location & IP on mount
  useEffect(() => {
    fetch('https://ipwho.is/')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success) {
          const isDhaka = /dhaka/i.test(data.city || '') || /dhaka/i.test(data.region || '');
          setLocationInfo({
            ip: data.ip,
            city: data.city || 'Dhaka',
            region: data.region || 'Dhaka Division',
            country: data.country || 'Bangladesh',
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.connection?.isp || data.org || 'ISP Network',
            isInsideDhaka: isDhaka,
            device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser',
          });
        }
      })
      .catch(() => {
        fetch('https://ipapi.co/json/')
          .then((r) => r.json())
          .then((d) => {
            if (d && d.ip) {
              const isDhaka = /dhaka/i.test(d.city || '') || /dhaka/i.test(d.region || '');
              setLocationInfo({
                ip: d.ip,
                city: d.city || 'Dhaka',
                region: d.region || 'Dhaka Division',
                country: d.country_name || 'Bangladesh',
                latitude: d.latitude,
                longitude: d.longitude,
                isp: d.org || 'ISP Network',
                isInsideDhaka: isDhaka,
                device: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Safari',
              });
            }
          })
          .catch(() => {});
      });
  }, []);

  // Smart auto-detect delivery location based on address
  const handleAddressChange = (val: string) => {
    setCustAddress(val);
    if (val.trim()) {
      const detected = detectDeliveryLocation(
        val,
        branding.deliveryRates?.insideDhakaCost || 70,
        branding.deliveryRates?.outsideDhakaCost || 130
      );
      if (detected.confidence !== 'none') {
        setCustLocation(detected.location);
        setAutoDetectedReason(detected.reason);
      } else {
        setAutoDetectedReason('');
      }
    } else {
      setAutoDetectedReason('');
    }
  };

  // Sync real product catalog from server
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setCatalogProducts(data.products);
        }
      })
      .catch(() => {});
  }, []);

  // Order Tracking Modal State
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Original Brand Colors: Warm Amber/Honey #ECA548 & Charcoal #262626
  const [branding, setBranding] = useState<{
    fontFamily: string;
    storeName: string;
    widgetTitle: string;
    widgetSubtitle: string;
    logoUrl: string;
    primaryColor: string;
    welcomeMessage: string;
    quickReplies: string[];
    showOnlineStatus: boolean;
    deliveryRates?: {
      insideDhakaCost: number;
      outsideDhakaCost: number;
      codAvailable: boolean;
    };
    products?: Array<{
      id: string;
      title: string;
      price: number;
      imageUrl?: string;
      category?: string;
      url?: string;
    }>;
  }>({
    fontFamily: 'sans-serif',
    storeName: 'Gift Ghor',
    widgetTitle: 'Gift Ghor Assistant',
    widgetSubtitle: 'Online | Instant replies in বাংলা & English',
    logoUrl: '',
    primaryColor: '#ECA548',
    welcomeMessage: 'আসসালামু আলাইকুম! আমি গিফট ঘর এর এআই অ্যাসিস্ট্যান্ট। কীভাবে সাহায্য করতে পারি?',
    quickReplies: [
      '🎁 আমার অফার',
      '🛍️ প্রোডাক্ট ক্যাটালগ',
      '🚚 ডেলিভারি চার্জ কত?',
      '📦 অর্ডার ট্র্যাকিং',
      '⚡ ১-ক্লিক অর্ডার',
    ],
    showOnlineStatus: true,
    deliveryRates: {
      insideDhakaCost: 70,
      outsideDhakaCost: 130,
      codAvailable: true,
    },
    products: [],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('ছবির সাইজ সর্বোচ্চ 8MB হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Initialize or restore session ID
  useEffect(() => {
    let storedId = localStorage.getItem('giftghor_chat_session_id');
    if (!storedId) {
      storedId = 'ghor-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('giftghor_chat_session_id', storedId);
    }
    setSessionId(storedId);

    // Fetch public branding
    fetch('/api/public/branding')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) {
          setBranding((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.log('Using default branding', err));

    const teaserTimer = setTimeout(() => {
      setShowTeaser(true);
    }, 3000);

    return () => clearTimeout(teaserTimer);
  }, []);

  // PostMessage for Teaser expanding in widget mode
  useEffect(() => {
    if (isIframeEmbed) {
      if (showTeaser && !isOpen) {
        window.parent.postMessage('giftghor-teaser-show', '*');
      } else if (!isOpen && !showTeaser) {
        window.parent.postMessage('giftghor-teaser-hide', '*');
      }
    }
  }, [showTeaser, isOpen, isIframeEmbed]);

  // Fetch session messages without wiping or hiding cards
  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/chat/session/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSessionMeta({
            requestedHuman: !!data.requestedHuman,
            humanRequestedAt: data.humanRequestedAt || null,
            adminConnected: !!data.adminConnected || data.mode === 'admin_takeover',
            mode: data.mode || 'ai',
          });
        }
        if (data && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.log('Session fetch err', err));
  }, [sessionId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Periodic poll for live admin replies
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    const interval = setInterval(() => {
      fetch(`/api/chat/session/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setSessionMeta({
              requestedHuman: !!data.requestedHuman,
              humanRequestedAt: data.humanRequestedAt || null,
              adminConnected: !!data.adminConnected || data.mode === 'admin_takeover',
              mode: data.mode || 'ai',
            });
          }
          if (data && Array.isArray(data.messages) && data.messages.length > 0) {
            const lastIncoming = data.messages[data.messages.length - 1]?.id;
            const lastCurrent = messages[messages.length - 1]?.id;
            if (data.messages.length !== messages.length || (lastIncoming && lastIncoming !== lastCurrent)) {
              setMessages(data.messages);
            }
          }
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if ((!messageText && !selectedImage) || isTyping) return;

    const imageToSend = selectedImage;
    setSelectedImage(null);
    setInputVal('');
    setShowTeaser(false);
    setShowQuickMenu(false);

    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      sessionId,
      sender: 'user',
      text: messageText || 'ছবি সংযুক্ত করা হয়েছে',
      image: imageToSend || undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          text: messageText,
          imageBase64: imageToSend,
          sender: 'user',
          locationInfo,
          pageContext: {
            url: window.location.href,
            title: document.title,
            content: document.body.innerText.substring(0, 1000),
          },
        }),
      });

      const data = await response.json();
      if (data.session && Array.isArray(data.session.messages)) {
        setMessages(data.session.messages);
      } else if (data.reply) {
        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sessionId,
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => {
          if (prev.some((m) => m.text === data.reply && m.sender === 'bot')) return prev;
          return [...prev, botMsg];
        });
      }
    } catch (err) {
      console.error('Send error', err);
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sessionId,
        sender: 'bot',
        text: 'সংযোগ জনিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা সরাসরি আমাদের পেজে মেসেজ দিন।',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    const newSessionId = 'ghor-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
    localStorage.setItem('giftghor_chat_session_id', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
    setShowQuickMenu(false);
  };

  const handleOpenOrderModal = (productTitle = '', price = 0, imageUrl = '', variantName = '') => {
    let chosen = catalogProducts.find(
      (p) =>
        (productTitle && p.title.toLowerCase().includes(productTitle.toLowerCase())) ||
        (productTitle && productTitle.toLowerCase().includes(p.title.toLowerCase()))
    );
    if (!chosen && catalogProducts.length > 0) {
      chosen = catalogProducts[0];
    }
    if (chosen) {
      const vars = chosen.variants || [];
      let defaultVar = vars.length > 0 ? vars[0] : null;
      if (variantName && vars.length > 0) {
        const found = vars.find(
          (v: any) =>
            v.name.toLowerCase() === variantName.toLowerCase() ||
            v.label.toLowerCase().includes(variantName.toLowerCase())
        );
        if (found) defaultVar = found;
      }
      setOrderProduct({
        id: chosen.id,
        title: chosen.title,
        price: price || chosen.price,
        imageUrl: defaultVar?.imageUrl || imageUrl || chosen.imageUrl,
        variants: vars,
      });
      setSelectedVariant(defaultVar);
    } else {
      setOrderProduct({
        title: productTitle || defaultCatalog[0]?.title || 'Cute Daisy Flower 3D Patch Mini Folding Ladies Wallet',
        price: price || defaultCatalog[0]?.price || 350,
        imageUrl: imageUrl || defaultCatalog[0]?.imageUrl,
        variants: defaultCatalog[0]?.variants || [],
      });
      setSelectedVariant(defaultCatalog[0]?.variants?.[0] || null);
    }
    setOrderQuantity(1);
    setIsSelectingProduct(false);
    setShowOrderModal(true);
    setShowQuickMenu(false);
  };

  const handleSubmitQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custPhone.trim() || !custAddress.trim() || isSubmittingOrder) return;
    setIsSubmittingOrder(true);

    const qty = Math.max(1, Number(orderQuantity) || 1);
    const deliveryCharge = custLocation === 'inside_dhaka' ? 70 : 130;
    const totalAmount = (orderProduct.price * qty) + deliveryCharge;
    const chosenVariantLabel = selectedVariant ? (selectedVariant.label || selectedVariant.name) : '';

    try {
      const res = await fetch('/api/orders/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: custName.trim() || 'সম্মানিত ক্রেতা',
          customerPhone: custPhone.trim(),
          customerAddress: custAddress.trim(),
          productName: orderProduct.title,
          productPrice: orderProduct.price,
          deliveryLocation: custLocation,
          quantity: qty,
          variant: chosenVariantLabel,
          sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowOrderModal(false);
        setIsSelectingProduct(false);
        const orderNum = data.orderNumber;

        const currentOrderData: InvoiceOrderData = {
          orderNumber: orderNum,
          customerName: custName.trim() || 'সম্মানিত ক্রেতা',
          customerPhone: custPhone.trim(),
          customerAddress: custAddress.trim(),
          productName: orderProduct.title,
          productPrice: orderProduct.price,
          quantity: qty,
          variant: chosenVariantLabel,
          imageUrl: selectedVariant?.imageUrl || orderProduct.imageUrl,
          deliveryLocation: custLocation,
          deliveryCharge,
          totalAmount,
          createdAt: new Date().toISOString(),
          status: 'confirmed',
          source: 'chat_instant',
        };

        // Immediately open branded invoice modal for the customer
        setInvoiceModalOrder(currentOrderData);
        setShowInvoiceModal(true);

        const confirmText = `✅ **অর্ডার সফলভাবে কনফার্ম হয়েছে!**\n\n` +
          `🆔 **অর্ডার আইডি:** #${orderNum}\n` +
          `🛍️ **প্রোডাক্ট:** ${orderProduct.title}\n` +
          (chosenVariantLabel ? `🎨 **কালার / ভ্যারিয়েন্ট:** ${chosenVariantLabel}\n` : '') +
          `🔢 **পরিমাণ:** ${qty}টি\n` +
          `👤 **নাম:** ${custName || 'সম্মানিত ক্রেতা'}\n` +
          `📞 **মোবাইল:** ${custPhone}\n` +
          `📍 **ঠিকানা:** ${custAddress}\n` +
          `💰 **সর্বমোট বিল:** ৳${totalAmount} BDT (ক্যাশ অন ডেলিভারি)\n\n` +
          `আমরা দ্রুত পার্সেলটি প্যাক করে আপনার দেওয়া ঠিকানায় পাঠিয়ে দিচ্ছি। ধন্যবাদ! ❤️`;

        const newMsg: ChatMessage = {
          id: 'ord-msg-' + Date.now(),
          sessionId,
          sender: 'bot',
          text: confirmText,
          timestamp: new Date().toISOString(),
          receiptOrder: currentOrderData,
        };

        setMessages((prev) => [...prev, newMsg]);
        setCustName('');
        setCustPhone('');
        setCustAddress('');
        setAutoDetectedReason('');
        setOrderQuantity(1);
      } else {
        alert(data.error || 'অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (err) {
      alert('নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleExecuteTracking = async (queryToTrack?: string) => {
    const targetQ = (queryToTrack || trackQuery).trim();
    if (!targetQ) return;
    setIsTrackingLoading(true);
    setTrackResult(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetQ }),
      });
      const data = await res.json();
      setTrackResult(data);
    } catch (err) {
      setTrackResult({ success: false, message: 'ট্র্যাকিং সার্ভারে সংযোগ করতে সমস্যা হয়েছে।' });
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Structured action cards (Reference style from IMG_1503 & IMG_1504)
  const mainActionOptions = [
    {
      id: 'offers',
      emoji: '🎁',
      title: 'আমার অফার ও হট ডিলস',
      action: () => handleSendMessage('আপনাদের বর্তমান স্পেশাল অফার ও হট ডিলগুলো কি কি?'),
    },
    {
      id: 'products',
      emoji: '🛍️',
      title: 'ট্রেন্ডি লেডিস ব্যাগ ও ওয়ালেট',
      action: () => handleSendMessage('আপনাদের ট্রেন্ডি ব্যাগ ও ওয়ালেটের সেরা কালেকশনগুলো দেখান'),
    },
    {
      id: 'delivery',
      emoji: '🚚',
      title: 'ডেলিভারি চার্জ ও সময়',
      action: () => handleSendMessage('ডেলিভারি চার্জ কত এবং ঢাকায় বা ঢাকার বাইরে কত দিনে পৌঁছায়?'),
    },
    {
      id: 'tracking',
      emoji: '📦',
      title: 'অর্ডার ট্র্যাক করুন (Steadfast)',
      action: () => {
        setShowTrackingModal(true);
        setShowQuickMenu(false);
      },
    },
  ];

  const extendedActionOptions = [
    {
      id: 'quick-order',
      emoji: '⚡',
      title: '১-ক্লিক ইনস্ট্যান্ট অর্ডার',
      action: () => handleOpenOrderModal(),
    },
    {
      id: 'live-support',
      emoji: '👩‍💼',
      title: 'লাইভ প্রতিনিধির সাথে কথা বলুন',
      action: () => handleSendMessage('আমি সরাসরি একজন লাইভ প্রতিনিধির সাথে কথা বলতে চাই'),
    },
    {
      id: 'policy',
      emoji: '🛡️',
      title: 'রিটার্ন ও রিপ্লেসমেন্ট পলিসি',
      action: () => handleSendMessage('প্রোডাক্টে কোনো সমস্যা থাকলে রিটার্ন বা রিপ্লেসমেন্ট পলিসি কি?'),
    },
  ];

  return (
    <div id="giftghor-support-root" className="relative z-50 font-sans text-[#262626]">
      {/* Floating launcher trigger button (Gift Ghor Amber Brand Color #ECA548) */}
      {!standalone && (
        <div className={`fixed flex flex-col items-end gap-3 z-50 ${isIframeEmbed ? 'bottom-0 right-0' : 'bottom-6 right-6'}`}>
          {/* Teaser notification bubble */}
          <AnimatePresence>
            {!isOpen && showTeaser && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="bg-white rounded-2xl p-3.5 shadow-xl border border-gray-100 max-w-[280px] relative cursor-pointer group hover:border-[#ECA548] transition-all"
                onClick={() => {
                  setIsOpen(true);
                  setShowTeaser(false);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FDF7EE] text-[#ECA548] flex items-center justify-center shrink-0 font-bold text-sm overflow-hidden border border-[#ECA548]/20">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <span>🎁</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#262626]">Gift Ghor AI</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTeaser(false);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      হ্যালো! ব্যাগ বা ওয়ালেট দেখতে অথবা অর্ডারের তথ্যের জন্য ট্যাপ করুন।
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-2 right-6 w-3.5 h-3.5 bg-white border-b border-r border-gray-100 transform rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Launcher Button (Original Brand Color #ECA548) */}
          <motion.button
            id="giftghor-chat-launcher-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTeaser(false);
            }}
            aria-label="Open Gift Ghor Chat"
            style={{ backgroundColor: branding.primaryColor || '#ECA548' }}
            className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-shadow hover:shadow-[#ECA548]/40"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close-icon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="w-6 h-6 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat-icon"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="relative"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* Main Chat Window (Clean, spacious UI inspired by reference) */}
      <AnimatePresence>
        {(isOpen || standalone) && (
          <motion.div
            id="giftghor-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col bg-[#F9FAFB] overflow-hidden shadow-2xl border border-gray-200/80 ${
              standalone
                ? 'w-full h-full max-w-lg mx-auto rounded-3xl'
                : isIframeEmbed
                ? 'fixed top-0 left-0 w-full h-[calc(100%-80px)] rounded-3xl z-50'
                : 'fixed bottom-24 right-4 sm:right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-7.5rem)] rounded-3xl z-50'
            }`}
          >
            {/* 1. Header: Clean, minimalist, zero-clutter */}
            <div className="bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              {/* Brand Logo & Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center text-[#ECA548] font-black text-sm shrink-0 border border-[#ECA548]/30 overflow-hidden">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt={branding.storeName || "Logo"}
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <Gift className="w-4 h-4 text-[#ECA548]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-[#262626]">
                      {branding.storeName || 'Gift Ghor'}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ECA548]"></span>
                    <span className="text-[11px] font-semibold text-[#ECA548] uppercase tracking-wider">
                      AI
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button: Circular, Clean */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResetChat}
                  title="নতুন চ্যাট শুরু করুন"
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                {!standalone && (
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Chat"
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors shadow-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Admin Connected / Live Notification Banner (Minimal pill) */}
            {sessionMeta.adminConnected || sessionMeta.mode === 'admin_takeover' ? (
              <div className="bg-emerald-500 text-white px-4 py-1.5 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold text-[11px]">এডমিন বিশেষজ্ঞ লাইভ যুক্ত আছেন</span>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
            ) : null}

            {/* 2. Chat Feed Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F8F9FA]">
              {/* Permanent Welcome Greeting & Quick Action Cards: ALWAYS PRESENT, NEVER VANISHES */}
              <div className="flex flex-col items-start">
                <div className="flex items-start gap-2.5 max-w-[88%]">
                  {/* Bot Avatar */}
                  <div className="w-7 h-7 rounded-full bg-white border border-[#ECA548]/30 shadow-xs flex items-center justify-center shrink-0 mt-0.5 text-[#ECA548] overflow-hidden">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Bot" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <Gift className="w-3.5 h-3.5 text-[#ECA548]" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {/* Welcome Message Bubble (Clean off-white) */}
                    <div className="bg-white text-[#262626] border border-gray-150 rounded-2xl rounded-tl-xs px-4 py-3 text-[13.5px] leading-relaxed shadow-xs">
                      <div className="font-semibold text-[#262626] mb-1">হ্যালো! 👋</div>
                      <div className="text-gray-700 leading-relaxed mb-2">
                        আমি গিফট ঘর এর এআই অ্যাসিস্ট্যান্ট!
                      </div>
                      <div className="text-gray-600 text-xs leading-relaxed">
                        কীভাবে সাহায্য করতে পারি? সরাসরি দেখতে বা অর্ডার করতে নিচের অপশনগুলোতে ট্যাপ করুন:
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permanent Structured Option Cards Container (Inspired by reference UI) */}
                <div className="w-full mt-3 pl-9 pr-1 space-y-2">
                  <div className="bg-white/90 border border-gray-200/70 rounded-2xl p-2 space-y-1.5 shadow-xs">
                    {mainActionOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={opt.action}
                        className="w-full bg-white hover:bg-[#FDF7EE]/50 active:scale-[0.99] border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all text-left group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{opt.emoji}</span>
                          <span className="text-xs font-semibold text-[#262626] group-hover:text-[#ECA548] transition-colors">
                            {opt.title}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#ECA548] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </button>
                    ))}

                    {/* Expandable More Options */}
                    <AnimatePresence>
                      {showMoreOptions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5 overflow-hidden pt-1"
                        >
                          {extendedActionOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={opt.action}
                              className="w-full bg-white hover:bg-[#FDF7EE]/50 active:scale-[0.99] border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all text-left group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{opt.emoji}</span>
                                <span className="text-xs font-semibold text-[#262626] group-hover:text-[#ECA548] transition-colors">
                                  {opt.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#ECA548] group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Toggle "+ আরো অপশন" Button */}
                    <button
                      type="button"
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      className="w-full bg-gray-50 hover:bg-[#FDF7EE]/70 border border-dashed border-gray-200 rounded-xl px-3.5 py-2 flex items-center justify-between transition-colors text-left group"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 group-hover:text-[#ECA548]">
                        <span>{showMoreOptions ? '−' : '+'}</span>
                        <span>{showMoreOptions ? 'কম দেখান' : 'আরো দেখুন'}</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                          showMoreOptions ? 'rotate-180 text-[#ECA548]' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Conversation Messages */}
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start gap-2.5 max-w-[88%]">
                      {/* Bot Avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-white border border-[#ECA548]/30 shadow-xs flex items-center justify-center shrink-0 mt-0.5 text-[#ECA548] overflow-hidden">
                          {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Bot" className="w-full h-full object-contain p-0.5" />
                          ) : (
                            <Gift className="w-3.5 h-3.5 text-[#ECA548]" />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                            isUser
                              ? 'bg-[#ECA548] text-white rounded-br-xs font-medium shadow-xs'
                              : 'bg-white text-[#262626] border border-gray-150 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.image && (
                            <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-100 max-w-[220px]">
                              <img src={msg.image} alt="Uploaded" className="w-full h-auto max-h-48 object-cover rounded-xl" />
                            </div>
                          )}

                          <div className="whitespace-pre-line leading-relaxed">
                            {(() => {
                              if (!msg.text) return '';
                              const urlRegex = /(https?:\/\/[^\s\)\*]+)/g;
                              const parts = msg.text.split(urlRegex);
                              return parts.map((part, i) => {
                                if (part.match(urlRegex)) {
                                  const isSteadfast = part.includes('steadfast.com.bd');
                                  return (
                                    <a
                                      key={i}
                                      href={part}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`inline-flex items-center gap-1 font-bold underline break-all my-1 px-1.5 py-0.5 rounded transition ${
                                        isUser
                                          ? 'text-white underline hover:opacity-80'
                                          : isSteadfast
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 no-underline'
                                          : 'text-sky-600 hover:text-sky-800'
                                      }`}
                                    >
                                      <span>{isSteadfast ? '🚚 Steadfast লাইভ ট্র্যাকিং পেজ' : part}</span>
                                      <ExternalLink className="w-3 h-3 inline-block" />
                                    </a>
                                  );
                                }
                                return part;
                              });
                            })()}
                          </div>
                        </div>

                        {/* Digital Receipt Card for Confirmed Orders */}
                        {(() => {
                          const orderDataToRender: InvoiceOrderData | null = msg.receiptOrder || (
                            msg.orderData && msg.orderData.customerPhone && msg.orderData.customerAddress && (msg.orderData.orderStatus === 'confirmed' || msg.text?.includes('অর্ডার') || msg.text?.includes('কনফার্ম'))
                              ? {
                                  orderNumber: (msg.text.match(/#?(GG-\d+)/i)?.[1]) || 'GG-' + Math.floor(10000 + Math.random() * 90000),
                                  customerName: msg.orderData.customerName || 'সম্মানিত ক্রেতা',
                                  customerPhone: msg.orderData.customerPhone,
                                  customerAddress: msg.orderData.customerAddress,
                                  productName: msg.orderData.productDetails || 'Gift Ghor Item',
                                  productPrice: 790,
                                  quantity: 1,
                                  deliveryLocation: /dhaka|ঢাকা/i.test(msg.orderData.customerAddress) ? 'inside_dhaka' : 'outside_dhaka',
                                  deliveryCharge: /dhaka|ঢাকা/i.test(msg.orderData.customerAddress) ? 70 : 130,
                                  totalAmount: 790 + (/dhaka|ঢাকা/i.test(msg.orderData.customerAddress) ? 70 : 130),
                                  createdAt: msg.timestamp,
                                  status: 'confirmed',
                                  imageUrl: defaultCatalog[0]?.imageUrl,
                                }
                              : null
                          );

                          if (orderDataToRender) {
                            return (
                              <DigitalReceiptCard
                                order={orderDataToRender}
                                onOpenInvoiceModal={(ord) => {
                                  setInvoiceModalOrder(ord);
                                  setShowInvoiceModal(true);
                                }}
                                onTrackOrder={(q) => handleExecuteTracking(q)}
                              />
                            );
                          }
                          return null;
                        })()}

                        {/* Timestamp */}
                        <span className={`text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="flex items-center gap-2 pl-9"
                  >
                    <div className="bg-white border border-[#ECA548]/20 px-3.5 py-2 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[11px] font-medium text-[#ECA548] ml-1">
                        উত্তর প্রস্তুত হচ্ছে...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Menu Popup Drawer (triggered by ☰ button) */}
            <AnimatePresence>
              {showQuickMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-20 space-y-1.5"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
                    <span className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#ECA548]" />
                      দ্রুত সেবা ও অপশনসমূহ
                    </span>
                    <button
                      onClick={() => setShowQuickMenu(false)}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {[...mainActionOptions, ...extendedActionOptions].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={opt.action}
                        className="bg-gray-50 hover:bg-[#FDF7EE] hover:border-[#ECA548]/40 border border-gray-150 rounded-xl px-2.5 py-2 text-left flex items-center gap-2 transition-colors text-xs font-medium text-gray-700 hover:text-[#ECA548]"
                      >
                        <span>{opt.emoji}</span>
                        <span className="truncate">{opt.title}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Image Preview Banner */}
            {selectedImage && (
              <div className="px-4 py-2 bg-[#FDF7EE] border-t border-[#ECA548]/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img src={selectedImage} alt="Selected" className="w-8 h-8 object-cover rounded-lg border border-[#ECA548]/50" />
                  <span className="text-xs font-medium text-[#ECA548]">ছবি যুক্ত হয়েছে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-full text-[#ECA548] hover:bg-[#ECA548]/10 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4. Bottom Input Bar (Clean, original brand styling) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="px-3.5 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Action Menu (☰ Hamburger Icon in Gift Ghor Amber) */}
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                title="দ্রুত অপশন মেনু"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#ECA548] hover:bg-[#FDF7EE] active:scale-95 transition-all shrink-0"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Pill-shaped Input Container */}
              <div className="flex-1 bg-white border border-gray-200 focus-within:border-[#ECA548] focus-within:ring-1 focus-within:ring-[#ECA548]/20 rounded-2xl px-3.5 py-2 flex items-center gap-2 transition-all shadow-2xs">
                <input
                  ref={inputRef}
                  type="text"
                  id="giftghor-chat-input"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Write a reply..."
                  disabled={isTyping}
                  className="flex-1 text-xs sm:text-sm bg-transparent focus:outline-none text-[#262626] placeholder-gray-400"
                />

                {/* Camera / Image Attachment */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="ছবি পাঠান"
                  className="text-gray-400 hover:text-[#ECA548] transition-colors p-0.5 shrink-0"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button: Sleek paper plane with brand color */}
              <button
                type="submit"
                id="giftghor-chat-send-btn"
                disabled={(!inputVal.trim() && !selectedImage) || isTyping}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  inputVal.trim() || selectedImage
                    ? 'text-[#ECA548] bg-[#FDF7EE] hover:bg-[#ECA548] hover:text-white active:scale-95'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Order Modal Overlay */}
            {showOrderModal && (
              <div className="absolute inset-0 bg-black/45 backdrop-blur-2xs z-50 flex items-center justify-center p-3 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92%]">
                  {/* Modal Header */}
                  <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      {isSelectingProduct ? (
                        <button
                          type="button"
                          onClick={() => setIsSelectingProduct(false)}
                          className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition active:scale-95"
                          title="ফিরে যান"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-lg">🛍️</span>
                      )}
                      <div>
                        <span className="font-bold text-sm text-[#262626] block leading-tight">
                          {isSelectingProduct ? 'প্রোডাক্ট বেছে নিন' : '১-ক্লিক ইনস্ট্যান্ট অর্ডার'}
                        </span>
                        <span className="text-[10px] text-gray-400 block">
                          {isSelectingProduct
                            ? `${catalogProducts.filter((p) => !productSearch.trim() || p.title.toLowerCase().includes(productSearch.toLowerCase())).length}টি কালেকশন উপলব্ধ`
                            : 'ক্যাশ অন ডেলিভারি (কোনো অগ্রিম ছাড়া)'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOrderModal(false);
                        setIsSelectingProduct(false);
                      }}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isSelectingProduct ? (
                    /* PRODUCT SELECTION VIEW */
                    <div className="flex flex-col flex-1 overflow-hidden">
                      {/* Search box */}
                      <div className="p-3 border-b border-gray-100 bg-gray-50/70 shrink-0">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="ব্যাগ, ওয়ালেট বা প্রোডাক্টের নাম লিখে খুঁজুন..."
                            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#ECA548] text-[#262626]"
                          />
                        </div>
                      </div>

                      {/* Products Scrollable List */}
                      <div className="p-3 space-y-2 overflow-y-auto flex-1 max-h-[380px]">
                        {catalogProducts
                          .filter((p) => !productSearch.trim() || p.title.toLowerCase().includes(productSearch.toLowerCase()))
                          .map((prod) => {
                            const isSelected = orderProduct.title === prod.title || orderProduct.id === prod.id;
                            const prodVars = prod.variants || [];
                            return (
                              <div
                                key={prod.id || prod.title}
                                onClick={() => {
                                  const vars = prod.variants || [];
                                  const defaultVar = vars.length > 0 ? vars[0] : null;
                                  setOrderProduct({
                                    id: prod.id,
                                    title: prod.title,
                                    price: prod.price,
                                    imageUrl: defaultVar?.imageUrl || prod.imageUrl,
                                    variants: vars,
                                  });
                                  setSelectedVariant(defaultVar);
                                  setIsSelectingProduct(false);
                                }}
                                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 active:scale-[0.98] ${
                                  isSelected
                                    ? 'bg-[#FDF7EE] border-[#ECA548] ring-1 ring-[#ECA548]/30 shadow-xs'
                                    : 'bg-white hover:bg-gray-50 border-gray-150'
                                }`}
                              >
                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-150">
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = 'https://giftghor.world/assets/logo.png';
                                    }}
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-0 bg-[#ECA548]/25 flex items-center justify-center">
                                      <div className="w-5 h-5 rounded-full bg-[#ECA548] text-white flex items-center justify-center shadow-xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-xs text-[#262626] line-clamp-2 leading-tight">
                                    {prod.title}
                                  </h4>
                                  {prodVars.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <div className="flex items-center -space-x-1">
                                        {prodVars.slice(0, 4).map((vr: any, vIdx: number) => (
                                          <img
                                            key={vIdx}
                                            src={vr.imageUrl}
                                            alt={vr.name}
                                            className="w-3.5 h-3.5 rounded-full border border-white object-cover"
                                          />
                                        ))}
                                      </div>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        🎨 {prodVars.length}টি কালার ভ্যারিয়েন্ট
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between mt-1.5">
                                    <span className="font-extrabold text-xs text-[#ECA548]">
                                      ৳{prod.price} BDT
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition ${
                                        isSelected
                                          ? 'bg-[#ECA548] text-white'
                                          : 'bg-gray-100 text-gray-600 hover:bg-[#FDF7EE] hover:text-[#ECA548]'
                                      }`}
                                    >
                                      {isSelected ? 'সিলেক্টেড ✓' : 'বেছে নিন'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    /* ORDER FORM WITH VISUAL PRODUCT PREVIEW */
                    <form onSubmit={handleSubmitQuickOrder} className="p-4 space-y-3 overflow-y-auto">
                      {/* Selected Product Card with Image & Variant Picker */}
                      <div className="bg-[#FDF7EE] p-3 rounded-2xl border border-[#ECA548]/40 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3 text-[#ECA548]" />
                            নির্বাচিত প্রোডাক্ট:
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsSelectingProduct(true)}
                            className="text-[11px] font-bold text-[#ECA548] hover:text-[#c47f26] bg-white border border-[#ECA548]/40 px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1 shadow-2xs"
                          >
                            <span>প্রোডাক্ট পরিবর্তন করুন</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex gap-3 items-center">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-200/80 bg-white shrink-0 shadow-2xs">
                            <img
                              src={selectedVariant?.imageUrl || orderProduct.imageUrl || defaultCatalog[0]?.imageUrl}
                              alt={orderProduct.title}
                              className="w-full h-full object-cover transition-all duration-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = defaultCatalog[0]?.imageUrl || 'https://giftghor.world/assets/logo.png';
                              }}
                            />
                            {selectedVariant && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5 truncate px-1">
                                {selectedVariant.name}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-[#262626] line-clamp-2 leading-tight">
                              {orderProduct.title}
                            </h4>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="font-extrabold text-sm text-[#ECA548]">
                                ৳{orderProduct.price} BDT
                              </span>

                              {/* Quantity Selector */}
                              <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition text-xs font-bold"
                                >
                                  −
                                </button>
                                <span className="px-2 text-xs font-bold text-[#262626]">
                                  {orderQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition text-xs font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Color / Variant Picker with Real Pictures */}
                        {orderProduct.variants && orderProduct.variants.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#ECA548]/20">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#ECA548]" />
                                <span>কালার / ভ্যারিয়েন্ট:</span>
                                {selectedVariant && (
                                  <span className="text-[#ECA548] font-bold">
                                    {selectedVariant.label || selectedVariant.name}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {orderProduct.variants.length}টি কালার উপলব্ধ
                              </span>
                            </div>

                            {/* Variant cards grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5">
                              {orderProduct.variants.map((v) => {
                                const isVarSelected = selectedVariant?.name === v.name || selectedVariant?.imageUrl === v.imageUrl;
                                return (
                                  <button
                                    key={v.name}
                                    type="button"
                                    onClick={() => setSelectedVariant(v)}
                                    className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all active:scale-95 ${
                                      isVarSelected
                                        ? 'bg-white border-[#ECA548] ring-2 ring-[#ECA548]/30 shadow-xs'
                                        : 'bg-white/80 hover:bg-white border-gray-200/90 text-gray-700'
                                    }`}
                                  >
                                    {/* Variant Picture Thumbnail */}
                                    <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-150 bg-gray-50">
                                      <img
                                        src={v.imageUrl}
                                        alt={v.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLImageElement).src = orderProduct.imageUrl || 'https://giftghor.world/assets/logo.png';
                                        }}
                                      />
                                      {isVarSelected && (
                                        <div className="absolute inset-0 bg-[#ECA548]/30 flex items-center justify-center">
                                          <Check className="w-3 h-3 text-white stroke-[3]" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        {v.colorCode && (
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0 border border-black/10"
                                            style={{ backgroundColor: v.colorCode }}
                                          />
                                        )}
                                        <span className={`text-[10.5px] truncate block leading-tight ${
                                          isVarSelected ? 'font-bold text-[#ECA548]' : 'text-gray-700 font-medium'
                                        }`}>
                                          {v.label || v.name}
                                        </span>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          আপনার নাম (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          placeholder="e.g. সাদিয়া ইসলাম"
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          সচল মোবাইল নম্বর <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          placeholder="017xxxxxxxx"
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white transition font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                          সম্পূর্ণ ডেলিভারি ঠিকানা (জেলা ও থানা সহ) <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={custAddress}
                          onChange={(e) => handleAddressChange(e.target.value)}
                          placeholder="বাড়ি নং, রোড নং, এলাকা, থানা ও জেলা লিখুন..."
                          className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-gray-600">
                            ডেলিভারি এলাকা
                          </label>
                          {autoDetectedReason ? (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                              <Sparkles className="w-3 h-3 text-[#ECA548]" />
                              <span>{autoDetectedReason}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              (ঠিকানা লিখলে অটো-ডিটেক্ট হবে)
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustLocation('inside_dhaka');
                              setAutoDetectedReason('ম্যানুয়ালি নির্বাচিত: ঢাকার ভিতরে');
                            }}
                            className={`text-xs py-2 px-2.5 rounded-xl border font-medium text-center transition flex items-center justify-center gap-1.5 ${
                              custLocation === 'inside_dhaka'
                                ? 'border-[#ECA548] bg-[#FDF7EE] text-[#ECA548] font-bold ring-2 ring-[#ECA548]/30 shadow-2xs'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span>ঢাকার ভিতরে (৳৭০)</span>
                            {custLocation === 'inside_dhaka' && <Check className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustLocation('outside_dhaka');
                              setAutoDetectedReason('ম্যানুয়ালি নির্বাচিত: ঢাকার বাইরে');
                            }}
                            className={`text-xs py-2 px-2.5 rounded-xl border font-medium text-center transition flex items-center justify-center gap-1.5 ${
                              custLocation === 'outside_dhaka'
                                ? 'border-[#ECA548] bg-[#FDF7EE] text-[#ECA548] font-bold ring-2 ring-[#ECA548]/30 shadow-2xs'
                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span>ঢাকার বাইরে (৳১৩০)</span>
                            {custLocation === 'outside_dhaka' && <Check className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Bill Calculation Box */}
                      <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1 text-gray-600">
                        <div className="flex justify-between">
                          <span>প্রোডাক্ট মূল্য ({orderQuantity}টি):</span>
                          <span>৳{orderProduct.price * orderQuantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ডেলিভারি চার্জ:</span>
                          <span>৳{custLocation === 'inside_dhaka' ? 70 : 130}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#262626] border-t border-gray-200 pt-1 text-sm">
                          <span>সর্বমোট ক্যাশ অন ডেলিভারি (COD):</span>
                          <span className="text-[#ECA548]">
                            ৳{(orderProduct.price * orderQuantity) + (custLocation === 'inside_dhaka' ? 70 : 130)} BDT
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingOrder}
                        style={{ backgroundColor: '#ECA548' }}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isSubmittingOrder ? (
                          <span>কনফার্ম হচ্ছে...</span>
                        ) : (
                          <span>অর্ডার কনফার্ম করুন - ৳{(orderProduct.price * orderQuantity) + (custLocation === 'inside_dhaka' ? 70 : 130)}</span>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Order Tracking Modal Overlay */}
            {showTrackingModal && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90%]">
                  <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <span className="font-bold text-sm text-[#262626]">অর্ডার লাইভ ট্র্যাকিং</span>
                    </div>
                    <button
                      onClick={() => setShowTrackingModal(false)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3 overflow-y-auto">
                    <p className="text-xs text-gray-500">
                      আপনার অর্ডার নম্বর, মোবাইল নম্বর বা Steadfast ট্র্যাকিং কোড দিন:
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={trackQuery}
                        onChange={(e) => setTrackQuery(e.target.value)}
                        placeholder="e.g. 017xxxxxxxx বা GG-1001"
                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleExecuteTracking()}
                        disabled={isTrackingLoading || !trackQuery.trim()}
                        style={{ backgroundColor: '#ECA548' }}
                        className="px-4 py-2 text-white rounded-xl text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
                      >
                        {isTrackingLoading ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক'}
                      </button>
                    </div>

                    {trackResult && (
                      <div className="mt-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2.5">
                        {trackResult.success ? (
                          <>
                            {/* Header: Order Number + Bengali Status Badge */}
                            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                              <div>
                                <span className="text-[10px] text-gray-400 block font-medium">ইনভয়েস নং</span>
                                <span className="font-extrabold text-sm text-[#262626]">
                                  #{trackResult.order?.orderNumber}
                                </span>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-2xs ${
                                  trackResult.statusBadgeColor === 'green' || trackResult.order?.statusBadgeColor === 'green'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : trackResult.statusBadgeColor === 'blue' || trackResult.order?.statusBadgeColor === 'blue'
                                    ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                    : trackResult.statusBadgeColor === 'rose' || trackResult.order?.statusBadgeColor === 'rose'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {trackResult.statusTextBangla || trackResult.order?.deliveryStatusBangla || 'কুরিয়ার বুকিং সম্পন্ন'}
                              </span>
                            </div>

                            {/* Status Explanation Card */}
                            <div className="bg-white p-2.5 rounded-xl border border-gray-150 text-gray-700 leading-relaxed text-[11.5px]">
                              <div className="font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>Steadfast কুরিয়ার স্ট্যাটাস:</span>
                              </div>
                              <p className="text-gray-600">
                                {trackResult.statusExplanation ||
                                  trackResult.order?.statusExplanation ||
                                  'পার্সেলটি Steadfast কুরিয়ার সিস্টেমে বুকিং রয়েছে এবং ডেলিভারির জন্য প্রসেসিং করা হচ্ছে।'}
                              </p>
                            </div>

                            {/* Prominent COD Amount Box */}
                            <div className="bg-[#FDF7EE] p-2.5 rounded-xl border border-[#ECA548]/40 flex items-center justify-between">
                              <span className="font-bold text-gray-800 text-[11.5px]">💵 ক্যাশ অন ডেলিভারি (COD):</span>
                              <span className="font-black text-sm text-[#ECA548]">
                                {trackResult.formattedCod ||
                                  trackResult.order?.formattedCod ||
                                  `৳${trackResult.order?.codAmount || trackResult.order?.totalAmount || 0} BDT`}
                              </span>
                            </div>

                            {/* Consignment ID Row (if available) */}
                            {trackResult.order?.steadfastConsignmentId && (
                              <div className="bg-white p-2.5 rounded-xl border border-gray-150 flex justify-between items-center text-[11.5px]">
                                <span className="text-gray-500 font-medium">Steadfast CID:</span>
                                <span className="font-mono font-bold text-sky-700">{trackResult.order.steadfastConsignmentId}</span>
                              </div>
                            )}

                            {/* Direct Valid Steadfast Tracking Link Button */}
                            {(trackResult.trackingUrl || trackResult.order?.trackingUrl) && (
                              <a
                                href={trackResult.trackingUrl || trackResult.order?.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                              >
                                <span>
                                  {trackResult.order?.steadfastTrackingCode || trackResult.order?.steadfastConsignmentId
                                    ? '🚚 Steadfast লাইভ ট্র্যাকিং পেজ দেখুন'
                                    : '🚚 Steadfast কুরিয়ার পোর্টাল খুলুন'}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </>
                        ) : (
                          <div className="text-rose-600 font-medium text-center py-2 leading-relaxed">
                            {trackResult.message || 'কোনো অর্ডার খুঁজে পাওয়া যায়নি। নম্বরটি যাচাই করুন।'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branded Official Invoice & Cash Memo Modal */}
      {invoiceModalOrder && (
        <BrandedInvoiceModal
          order={invoiceModalOrder}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          brandName={branding.storeName || 'Gift Ghor'}
          brandLogo={branding.logoUrl || 'https://giftghor.world/assets/logo.png'}
        />
      )}
    </div>
  );
};
