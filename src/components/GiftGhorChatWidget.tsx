import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Gift,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  Sparkles,
  RotateCcw,
  ShoppingBag,
  Clock,
  ChevronRight,
  ShieldCheck,
  Headset,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, OrderDetails } from '../types';

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
  const [typingElapsed, setTypingElapsed] = useState(0);
  const [showTeaser, setShowTeaser] = useState(false);
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
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  // Quick Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProduct, setOrderProduct] = useState<{ title: string; price: number; imageUrl?: string }>({
    title: 'Gift Ghor Item',
    price: 550,
  });
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custLocation, setCustLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Order Tracking Modal State
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResult, setTrackResult] = useState<any>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const handleOpenOrderModal = (productTitle = 'Gift Ghor Special Item', price = 550, imageUrl = '') => {
    setOrderProduct({ title: productTitle, price, imageUrl });
    setShowOrderModal(true);
  };

  const handleSubmitQuickOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custPhone.trim() || !custAddress.trim() || isSubmittingOrder) return;
    setIsSubmittingOrder(true);

    try {
      const res = await fetch('/api/orders/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: custName.trim() || 'Valued Customer',
          customerPhone: custPhone.trim(),
          customerAddress: custAddress.trim(),
          productName: orderProduct.title,
          productPrice: orderProduct.price,
          deliveryLocation: custLocation,
          quantity: 1,
          sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowOrderModal(false);
        const orderNum = data.orderNumber;

        // Post a message in the chat
        const confirmText = `✅ **অর্ডার সফলভাবে জমা হয়েছে!**\n\n` +
          `🆔 **অর্ডার আইডি:** #${orderNum}\n` +
          `🛍️ **প্রোডাক্ট:** ${orderProduct.title}\n` +
          `👤 **নাম:** ${custName || 'কাস্টমার'}\n` +
          `📞 **মোবাইল:** ${custPhone}\n` +
          `📍 **ঠিকানা:** ${custAddress}\n` +
          `💰 **মোট মূল্য:** ৳${data.order.totalAmount} (COD)\n\n` +
          `আমাদের ডেলিভারি টিম দ্রুত আপনাকে ফোন করে পার্সেল রিলিজ কনফার্ম করবে। ধন্যবাদ! ❤️`;

        const newMsg: ChatMessage = {
          id: 'ord-msg-' + Date.now(),
          sessionId,
          sender: 'bot',
          text: confirmText,
          timestamp: new Date().toISOString(),
          orderData: {
            customerName: custName,
            customerPhone: custPhone,
            customerAddress: custAddress,
            productDetails: orderProduct.title,
            orderStatus: 'confirmed',
            collectedAt: new Date().toISOString(),
          },
        };

        setMessages((prev) => [...prev, newMsg]);
        setCustName('');
        setCustPhone('');
        setCustAddress('');
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

  // 1-minute countdown timer logic
  useEffect(() => {
    if (!sessionMeta.requestedHuman || sessionMeta.adminConnected || sessionMeta.mode === 'ai') {
      setTimerSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      if (!sessionMeta.humanRequestedAt) return 60;
      const elapsed = Math.floor((Date.now() - new Date(sessionMeta.humanRequestedAt).getTime()) / 1000);
      return Math.max(0, 60 - elapsed);
    };

    setTimerSeconds(calculateRemaining());

    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setTimerSeconds(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionMeta.requestedHuman, sessionMeta.humanRequestedAt, sessionMeta.adminConnected, sessionMeta.mode]);

  // Dynamic typing timer for realistic multi-stage indicator
  useEffect(() => {
    let timer: any;
    if (isTyping) {
      setTypingElapsed(0);
      timer = setInterval(() => {
        setTypingElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setTypingElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isTyping]);
  const [branding, setBranding] = useState({
    fontFamily: 'sans-serif',
    storeName: 'Gift Ghor',
    widgetTitle: 'Gift Ghor Assistant',
    widgetSubtitle: 'Online | Instant replies in বাংলা & English',
    logoUrl: '',
    primaryColor: '#ECA548',
    welcomeMessage:
      'আসসালামু আলাইকুম! Gift Ghor (giftghor.world)-এ আপনাকে স্বাগতম। কাস্টমাইজড গিফট ও অর্ডার সংক্রান্ত যে কোনো তথ্যের জন্য আমরা প্রস্তুত। কিভাবে সাহায্য করতে পারি?',
    quickReplies: [
      'লাইভ প্রতিনিধি (Admin Support) 👤',
      'অর্ডার করতে চাই 🎁',
      'ডেলিভারি চার্জ কত? 🚚',
      'প্রোডাক্ট ক্যাটালগ 🛍️',
      'কাস্টমাইজেশনের নিয়ম ✨',
    ],
    showOnlineStatus: true,
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

    // Fetch public branding (safe public endpoint only)
    fetch('/api/public/branding')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.widgetTitle) {
          setBranding((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.log('Using default branding', err));

    // Show floating teaser after 3 seconds if not open
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

  // Fetch session messages
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
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Initialize welcome message
          const initialMsg: ChatMessage = {
            id: 'welcome-msg',
            sessionId,
            sender: 'bot',
            text: branding.welcomeMessage,
            timestamp: new Date().toISOString(),
          };
          setMessages([initialMsg]);
        }
      })
      .catch((err) => console.log('Session fetch err', err));
  }, [sessionId, branding.welcomeMessage]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Periodic poll for admin replies if active
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
          if (data.messages && data.messages.length > messages.length) {
            setMessages(data.messages);
          }
        })
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if ((!messageText && !selectedImage) || isTyping) return;

    const imageToSend = selectedImage;
    setSelectedImage(null);
    setInputVal('');
    setShowTeaser(false);

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
          pageContext: {
            url: window.location.href,
            title: document.title,
            content: document.body.innerText.substring(0, 1000)
          }
        }),
      });

      const data = await response.json();
      if (data.session && data.session.messages) {
        setMessages(data.session.messages);
      } else if (data.reply) {
        const botMsg: ChatMessage = {
          id: 'bot-' + Date.now(),
          sessionId,
          sender: 'bot',
          text: data.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
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
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sessionId: newSessionId,
        sender: 'bot',
        text: branding.welcomeMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div id="giftghor-support-root" className="relative z-50 font-sans" style={{ fontFamily: branding.fontFamily }}>
      {/* Floating launcher trigger button */}
      {!standalone && (
        <div className={`fixed flex flex-col items-end gap-3 z-50 ${isIframeEmbed ? 'bottom-0 right-0' : 'bottom-6 right-6'}`}>
          {/* Teaser notification bubble */}
          <AnimatePresence>
            {!isOpen && showTeaser && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="bg-white rounded-2xl p-3.5 shadow-xl border border-[#ECECEC] max-w-[290px] relative cursor-pointer group hover:border-[#ECA548] transition-all"
                onClick={() => {
                  setIsOpen(true);
                  setShowTeaser(false);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FDF7EE] border border-[#ECA548]/30 flex items-center justify-center shrink-0 text-[#ECA548]">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#262626]">Gift Ghor Assistant</p>
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
                      আসসালামু আলাইকুম! কাস্টমাইজড গিফট ও অর্ডার সংক্রান্ত তথ্যের জন্য চ্যাট শুরু করুন।
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-2 right-6 w-3.5 h-3.5 bg-white border-b border-r border-[#ECECEC] transform rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Launcher Button */}
          <motion.button
            id="giftghor-chat-launcher-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTeaser(false);
            }}
            aria-label="Open Gift Ghor Customer Support Chat"
            className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-shadow hover:shadow-[#ECA548]/30"
            style={{ backgroundColor: branding.primaryColor }}
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
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}

      {/* Main Chat Window */}
      <AnimatePresence>
        {(isOpen || standalone) && (
          <motion.div
            id="giftghor-chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col bg-white overflow-hidden shadow-2xl border border-[#ECECEC] ${
              standalone
                ? 'w-full h-full max-w-lg mx-auto rounded-2xl'
                : isIframeEmbed
                ? 'fixed top-0 left-0 w-full h-[calc(100%-80px)] rounded-2xl z-50'
                : 'fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl z-50'
            }`}
          >
            {/* Header */}
            <div
              className="px-4 py-3.5 flex items-center justify-between border-b border-[#ECECEC] bg-white"
              style={{ borderTop: `4px solid ${branding.primaryColor}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF7EE] border border-[#ECA548]/30 flex items-center justify-center shrink-0">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Gift Ghor"
                      className="w-7 h-7 object-contain rounded"
                    />
                  ) : (
                    <Gift className="w-5 h-5 text-[#ECA548]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-tight" style={{ color: (branding as any).headerTextColor || '#ffffff' }}>
                      {branding.widgetTitle}
                    </h3>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/20">
                      AI 2.5
                    </span>
                  </div>
                  {isTyping ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#ECA548]">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ECA548] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ECA548]" />
                      </span>
                      <span className="text-[11px] font-medium text-[#ECA548]">
                        AI উত্তর প্রস্তুত করছে...
                      </span>
                    </div>
                  ) : branding.showOnlineStatus && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-medium text-gray-500">
                        সক্রিয় প্রতিনিধি | তাৎক্ষণিক উত্তর
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action icons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowTrackingModal(true);
                    setTrackResult(null);
                  }}
                  title="অর্ডার ট্র্যাকিং (Live Order Tracking)"
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">ট্র্যাকিং</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenOrderModal('Gift Ghor Special Item', 550)}
                  title="১-ক্লিক অর্ডার (Instant Order)"
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">অর্ডার</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage('লাইভ প্রতিনিধির সাথে কথা বলতে চাই')}
                  title="লাইভ প্রতিনিধির সাহায্য চান (Request Live Agent)"
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/60 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <Headset className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">সাপোর্ট</span>
                </button>
                <button
                  onClick={handleResetChat}
                  title="নতুন কথোপকথন শুরু করুন"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {!standalone && (
                  <button
                    onClick={() => setIsOpen(false)}
                    aria-label="Close Chat"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Live Agent / Timer Status Banner */}
            {sessionMeta.adminConnected || sessionMeta.mode === 'admin_takeover' ? (
              <div className="bg-emerald-600 text-white px-3.5 py-2 flex items-center justify-between text-xs shadow-inner shrink-0">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                  <span className="font-bold tracking-wide">🟢 Admin Connected (এডমিন যুক্ত আছেন)</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-emerald-800 px-2 py-0.5 rounded-full shadow-xs">
                  Live Replying
                </span>
              </div>
            ) : sessionMeta.requestedHuman ? (
              <div className="bg-amber-500 text-white px-3.5 py-2 flex items-center justify-between text-xs shadow-inner shrink-0 animate-pulse">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white shrink-0" />
                  <span className="font-semibold tracking-wide">
                    {timerSeconds !== null && timerSeconds > 0
                      ? `লাইভ প্রতিনিধি যুক্ত হচ্ছেন... (${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')})`
                      : 'আমাদের প্রতিনিধি লাইনে আসছেন, একটু অপেক্ষা করুন...'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-amber-800 shadow-xs">
                  {timerSeconds !== null && timerSeconds > 0 ? `${timerSeconds}s` : 'Waiting'}
                </span>
              </div>
            ) : null}

            {/* Chat message feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-[#FAFAFA] to-white">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const isAdmin = msg.sender === 'admin';

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {!isUser && (
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] text-white ${
                            isAdmin ? 'bg-indigo-600' : 'bg-[#ECA548]'
                          }`}
                        >
                          {isAdmin ? 'Admin' : <Gift className="w-3 h-3" />}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#ECA548] text-white rounded-br-xs font-normal shadow-sm'
                            : isAdmin
                            ? 'bg-indigo-50 text-indigo-950 border border-indigo-200 rounded-bl-xs'
                            : 'bg-white text-[#262626] border border-[#ECECEC] rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {isAdmin && (
                          <div className="text-[10px] font-bold text-indigo-600 mb-1 uppercase tracking-wider flex items-center gap-1">
                            <span>Admin Specialist</span>
                          </div>
                        )}

                        {msg.image && (
                          <div className="mb-2 overflow-hidden rounded-xl border border-white/20 shadow-sm max-w-[220px]">
                            <img src={msg.image} alt="Uploaded" className="w-full h-auto max-h-48 object-cover rounded-xl" />
                          </div>
                        )}

                        <div className="whitespace-pre-line text-[13.5px]">
                          {msg.text}
                        </div>

                        {/* Interactive Product Card in Bot Messages if product mentioned */}
                        {!isUser && (msg.text.includes('৳') || msg.text.includes('অর্ডার') || msg.text.includes('প্রোডাক্ট')) && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-amber-200/60 flex items-center justify-center shrink-0 text-[#ECA548]">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-gray-900 truncate">
                                  Gift Ghor Special Collection
                                </h4>
                                <p className="text-[11px] text-amber-900 font-semibold">
                                  ক্যাশ অন ডেলিভারিতে অর্ডার করুন
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenOrderModal('Gift Ghor Special Item', 550)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ECA548] text-white hover:bg-amber-600 transition-colors shadow-xs shrink-0 flex items-center gap-1"
                            >
                              <span>অর্ডার করুন</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* If this message contains extracted order lead */}
                        {msg.orderData && msg.orderData.customerPhone && (
                          <div className="mt-2.5 pt-2 border-t border-emerald-100 bg-emerald-50/70 p-2 rounded-xl text-emerald-900 text-xs">
                            <div className="flex items-center gap-1 font-semibold text-emerald-700 mb-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>অর্ডার রিকুয়েস্ট নথিভুক্ত হয়েছে</span>
                            </div>
                            <p className="text-[11px] text-emerald-800">
                              📞 {msg.orderData.customerPhone} | 📍 {msg.orderData.customerAddress || 'ঢাকা'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}

              {/* Realistic Multi-stage Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2 max-w-[85%]"
                  >
                    <div className="relative w-6 h-6 rounded-full bg-[#FDF7EE] border border-[#ECA548]/50 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Gift className="w-3 h-3 text-[#ECA548]" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white rounded-full animate-pulse" />
                    </div>

                    <div className="bg-white border border-[#EBEBEB] px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-xs flex flex-col gap-1.5 min-w-[150px]">
                      {/* Wave bouncing dots with status */}
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-typing-wave-1" />
                        <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-typing-wave-2" />
                        <span className="w-2 h-2 rounded-full bg-[#ECA548] animate-typing-wave-3" />
                        <span className="text-[11.5px] font-semibold text-[#ECA548] ml-1 tracking-wide">
                          {typingElapsed < 3
                            ? 'Gift Ghor AI লিখছে...'
                            : typingElapsed < 6
                            ? 'তথ্য সাজানো হচ্ছে...'
                            : 'কিছুক্ষণের মধ্যে উত্তর আসছে...'}
                        </span>
                      </div>

                      {/* Smooth animated progress shimmer */}
                      <div className="relative overflow-hidden h-1 w-full bg-amber-50/70 rounded-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ECA548] to-transparent animate-typing-shimmer" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-3 pt-2 pb-1 border-t border-[#ECECEC] bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
              {branding.quickReplies.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(reply)}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-[#FDF7EE] text-[#262626] hover:bg-[#ECA548] hover:text-white border border-[#ECA548]/30 transition-all font-medium active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Image Preview Banner if Image Selected */}
            {selectedImage && (
              <div className="px-3 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={selectedImage} alt="Selected" className="w-10 h-10 object-cover rounded-lg border border-amber-300 shadow-xs" />
                  <span className="text-xs font-semibold text-amber-900">ছবি যুক্ত করা হয়েছে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-full text-amber-700 hover:text-rose-600 hover:bg-amber-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-[#ECECEC] flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="ছবি পাঠান (Attach Image)"
                className="p-2 rounded-xl text-gray-500 hover:text-[#ECA548] hover:bg-amber-50 border border-gray-200 transition-colors shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                id="giftghor-chat-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={isTyping ? "AI উত্তর তৈরি করছে..." : "মেসেজ বা ছবি পাঠান (বাংলা / English)..."}
                disabled={isTyping}
                className="flex-1 text-sm bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626] transition-all disabled:opacity-70 disabled:cursor-wait"
              />
              <button
                type="submit"
                id="giftghor-chat-send-btn"
                disabled={(!inputVal.trim() && !selectedImage) || isTyping}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 relative overflow-hidden"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {isTyping ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>

            {/* Quick Order Modal Overlay */}
            {showOrderModal && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90%]">
                  <div className="bg-[#262626] text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#ECA548]" />
                      <span className="font-bold text-sm">ইনস্ট্যান্ট ১-ক্লিক অর্ডার</span>
                    </div>
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitQuickOrder} className="p-4 space-y-3 overflow-y-auto">
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 text-xs">
                      <p className="font-bold text-amber-900 truncate">{orderProduct.title}</p>
                      <p className="text-amber-700 font-semibold mt-0.5">মূল্য: ৳{orderProduct.price} (ক্যাশ অন ডেলিভারি)</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">আপনার নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="আপনার পূর্ণ নাম"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ECA548]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">মোবাইল নম্বর (১১ ডিজিট) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ECA548]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">ডেলিভারি এরিয়া *</label>
                      <select
                        value={custLocation}
                        onChange={(e: any) => setCustLocation(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ECA548]"
                      >
                        <option value="inside_dhaka">ঢাকার ভেতরে (ডেলিভারি চার্জ ৳৬০)</option>
                        <option value="outside_dhaka">ঢাকার বাইরে (ডেলিভারি চার্জ ৳১২০)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">পূর্ণ ঠিকানা (বাসা/রোড/থানা) *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="জেলা, থানা, এলাকা ও বাসা নম্বর"
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#ECA548]"
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isSubmittingOrder || !custPhone.trim() || !custAddress.trim()}
                        className="w-full py-2.5 bg-[#ECA548] text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmittingOrder ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>অর্ডার কনফার্ম করুন (৳{orderProduct.price + (custLocation === 'inside_dhaka' ? 60 : 120)})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Order Tracking Modal Overlay */}
            {showTrackingModal && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90%]">
                  <div className="bg-[#262626] text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-sm">লাইভ পার্সেল/অর্ডার ট্র্যাকিং</span>
                    </div>
                    <button
                      onClick={() => setShowTrackingModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3.5 overflow-y-auto">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        অর্ডার নম্বর / ইনভয়েস ID / মোবাইল নম্বর:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="যেমন: GG-12345 বা 017XXXXXXXX"
                          value={trackQuery}
                          onChange={(e) => setTrackQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleExecuteTracking()}
                          className="flex-1 text-xs p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleExecuteTracking()}
                          disabled={isTrackingLoading || !trackQuery.trim()}
                          className="px-3.5 py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition-colors shrink-0 disabled:opacity-50"
                        >
                          {isTrackingLoading ? 'খোঁজা হচ্ছে...' : 'সার্চ'}
                        </button>
                      </div>
                    </div>

                    {/* Track Result Display */}
                    {trackResult && (
                      <div className="mt-2 text-xs">
                        {trackResult.found ? (
                          <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl space-y-2 text-sky-950">
                            <div className="whitespace-pre-line text-xs">
                              {trackResult.reply}
                            </div>
                            {trackResult.trackingUrl && (
                              <a
                                href={trackResult.trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                              >
                                🌐 Steadfast লাইভ ট্র্যাকিং খুলুন ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800 text-xs">
                            {trackResult.message || 'কোনো অর্ডার তথ্য পাওয়া যায়নি।'}
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
    </div>
  );
};
