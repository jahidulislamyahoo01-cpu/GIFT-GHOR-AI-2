import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Gift,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  ChevronRight,
  Headset,
  Image as ImageIcon,
  RotateCcw,
  Menu,
  Sparkles,
  Truck,
  HelpCircle,
  PackageCheck,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../types';

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
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  // Quick Order Modal State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProduct, setOrderProduct] = useState<{ title: string; price: number; imageUrl?: string }>({
    title: 'Cute Daisy Flower 3D Patch Mini Folding Ladies Wallet',
    price: 350,
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
    primaryColor: '#E02424',
    welcomeMessage: 'আসসালামু আলাইকুম! আমি গিফট ঘর এর এআই বন্ধু। কীভাবে সাহায্য করতে পারি?',
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
          // Initialize clean welcome message
          const initialMsg: ChatMessage = {
            id: 'welcome-msg',
            sessionId,
            sender: 'bot',
            text: `হ্যালো! 👋\n\nআমি গিফট ঘর এর এআই বন্ধু! আপনার কেনাকাটার পার্সোনাল অ্যাসিস্ট্যান্ট!\n\nকীভাবে সাহায্য করতে পারি?\n\nআমার উত্তর AI দ্বারা প্রস্তুত হয়, তাই সরাসরি দেখতে বা অর্ডার করতে নিচের যেকোনো অপশনে ট্যাপ করতে পারেন:`,
            timestamp: new Date().toISOString(),
          };
          setMessages([initialMsg]);
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
          if (data.messages && Array.isArray(data.messages)) {
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

  // Dynamic typing timer
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
        text: 'সংযোগ জনিত সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন বা সরাসরি আমাদের নম্বরে কল করুন।',
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
        text: `হ্যালো! 👋\n\nআমি গিফট ঘর এর এআই বন্ধু! আপনার কেনাকাটার পার্সোনাল অ্যাসিস্ট্যান্ট!\n\nকীভাবে সাহায্য করতে পারি?\n\nযেকোনো প্রশ্ন সরাসরি লিখুন অথবা নিচের অপশনগুলোতে ট্যাপ করুন:`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowQuickMenu(false);
  };

  const handleOpenOrderModal = (productTitle = '', price = 0) => {
    const title = productTitle || branding.products?.[0]?.title || 'Cute Daisy Flower 3D Patch Mini Folding Ladies Wallet';
    const p = price || branding.products?.[0]?.price || 350;
    setOrderProduct({ title, price: p });
    setShowOrderModal(true);
    setShowQuickMenu(false);
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

        const confirmText = `✅ **অর্ডার সফলভাবে কনফার্ম হয়েছে!**\n\n` +
          `🆔 **অর্ডার আইডি:** #${orderNum}\n` +
          `🛍️ **প্রোডাক্ট:** ${orderProduct.title}\n` +
          `👤 **নাম:** ${custName || 'কাস্টমার'}\n` +
          `📞 **মোবাইল:** ${custPhone}\n` +
          `📍 **ঠিকানা:** ${custAddress}\n` +
          `💰 **মোট বিল:** ৳${data.order?.totalAmount || orderProduct.price + (custLocation === 'inside_dhaka' ? 70 : 130)} (ক্যাশ অন ডেলিভারি)\n\n` +
          `আমরা দ্রুত পার্সেলটি প্যাক করে আপনার দেওয়া ঠিকানায় পাঠিয়ে দিচ্ছি। ধন্যবাদ! ❤️`;

        const newMsg: ChatMessage = {
          id: 'ord-msg-' + Date.now(),
          sessionId,
          sender: 'bot',
          text: confirmText,
          timestamp: new Date().toISOString(),
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
    <div id="giftghor-support-root" className="relative z-50 font-sans text-gray-800">
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
                className="bg-white rounded-2xl p-3.5 shadow-xl border border-gray-100 max-w-[280px] relative cursor-pointer group hover:border-red-400 transition-all"
                onClick={() => {
                  setIsOpen(true);
                  setShowTeaser(false);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    🎁
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900">Gift Ghor AI</p>
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

          {/* Main Launcher Button */}
          <motion.button
            id="giftghor-chat-launcher-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(!isOpen);
              setShowTeaser(false);
            }}
            aria-label="Open Gift Ghor Chat"
            className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white bg-gradient-to-tr from-red-600 to-rose-500 hover:shadow-red-500/25 transition-shadow"
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
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-black text-sm shrink-0">
                  <Gift className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base tracking-tight text-red-600">
                      giftghor
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
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
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                const isFirstBotMessage = !isUser && index === 0;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-start gap-2.5 max-w-[88%]`}>
                      {/* Bot Avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5 text-red-600">
                          <Gift className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        {/* Message Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
                            isUser
                              ? 'bg-red-600 text-white rounded-br-xs font-medium shadow-xs'
                              : 'bg-white text-gray-800 border border-gray-150 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          {msg.image && (
                            <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-100 max-w-[220px]">
                              <img src={msg.image} alt="Uploaded" className="w-full h-auto max-h-48 object-cover rounded-xl" />
                            </div>
                          )}

                          <div className="whitespace-pre-line leading-relaxed">
                            {msg.text}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <span className={`text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* 3. Structured Option Cards (Reference style directly beneath first bot welcome message) */}
                    {isFirstBotMessage && (
                      <div className="w-full mt-3 pl-9 pr-1 space-y-2">
                        <div className="bg-white/90 border border-gray-200/70 rounded-2xl p-2 space-y-1.5 shadow-xs">
                          {mainActionOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={opt.action}
                              className="w-full bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-100/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all text-left group"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{opt.emoji}</span>
                                <span className="text-xs font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                                  {opt.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
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
                                    className="w-full bg-white hover:bg-gray-50 active:scale-[0.99] border border-gray-100/90 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-2xs transition-all text-left group"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-base">{opt.emoji}</span>
                                      <span className="text-xs font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                                        {opt.title}
                                      </span>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-red-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Toggle "+ আরো অপশন" Button */}
                          <button
                            type="button"
                            onClick={() => setShowMoreOptions(!showMoreOptions)}
                            className="w-full bg-gray-50/80 hover:bg-gray-100 border border-dashed border-gray-200 rounded-xl px-3.5 py-2 flex items-center justify-between transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 group-hover:text-red-600">
                              <span>{showMoreOptions ? '−' : '+'}</span>
                              <span>{showMoreOptions ? 'কম দেখান' : 'আরো দেখুন'}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                                showMoreOptions ? 'rotate-180 text-red-500' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    )}
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
                    <div className="bg-white border border-gray-200/80 px-3.5 py-2 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[11px] font-medium text-gray-500 ml-1">
                        লিখছে...
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
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" />
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
                        className="bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-gray-150 rounded-xl px-2.5 py-2 text-left flex items-center gap-2 transition-colors text-xs font-medium text-gray-700 hover:text-red-700"
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
              <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <img src={selectedImage} alt="Selected" className="w-8 h-8 object-cover rounded-lg border border-red-200" />
                  <span className="text-xs font-medium text-red-900">ছবি যুক্ত হয়েছে</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="p-1 rounded-full text-red-600 hover:bg-red-100 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4. Bottom Input Bar (Clean, rounded, matching reference) */}
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

              {/* Action Menu (☰ Hamburger Icon in bold red/accent) */}
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                title="দ্রুত অপশন মেনু"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-50 active:scale-95 transition-all shrink-0"
              >
                <Menu className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Pill-shaped Input Container */}
              <div className="flex-1 bg-white border border-gray-200 focus-within:border-gray-400 rounded-2xl px-3.5 py-2 flex items-center gap-2 transition-all shadow-2xs">
                <input
                  ref={inputRef}
                  type="text"
                  id="giftghor-chat-input"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Write a reply..."
                  disabled={isTyping}
                  className="flex-1 text-xs sm:text-sm bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                />

                {/* Camera / Image Attachment */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="ছবি পাঠান"
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5 shrink-0"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Send Button: Sleek paper plane */}
              <button
                type="submit"
                id="giftghor-chat-send-btn"
                disabled={(!inputVal.trim() && !selectedImage) || isTyping}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  inputVal.trim() || selectedImage
                    ? 'text-red-600 bg-red-50 hover:bg-red-100 active:scale-95'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Order Modal Overlay */}
            {showOrderModal && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90%]">
                  <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🛍️</span>
                      <span className="font-bold text-sm text-gray-900">১-ক্লিক ইনস্ট্যান্ট অর্ডার</span>
                    </div>
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitQuickOrder} className="p-4 space-y-3 overflow-y-auto">
                    <div className="bg-red-50/70 p-3 rounded-2xl border border-red-100 text-xs">
                      <span className="font-bold text-gray-900 block truncate">{orderProduct.title}</span>
                      <div className="flex items-center justify-between mt-1 text-gray-600">
                        <span>মূল্য:</span>
                        <span className="font-extrabold text-red-600 text-sm">৳{orderProduct.price} BDT</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        আপনার পূর্ণ নাম (ঐচ্ছিক)
                      </label>
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. সাদিয়া ইসলাম"
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-red-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        সচল মোবাইল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="017xxxxxxxx"
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-red-500 focus:bg-white transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        ডেলিভারি লোকেশন
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCustLocation('inside_dhaka')}
                          className={`text-xs py-2 px-2.5 rounded-xl border font-medium text-center transition ${
                            custLocation === 'inside_dhaka'
                              ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          ঢাকার ভিতরে (৳৭০)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustLocation('outside_dhaka')}
                          className={`text-xs py-2 px-2.5 rounded-xl border font-medium text-center transition ${
                            custLocation === 'outside_dhaka'
                              ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                              : 'border-gray-200 bg-gray-50 text-gray-600'
                          }`}
                        >
                          ঢাকার বাইরে (৳১৩০)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        সম্পূর্ণ ডেলিভারি ঠিকানা (জেলা ও থানা সহ) <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={custAddress}
                        onChange={(e) => setCustAddress(e.target.value)}
                        placeholder="বাড়ি নং, রোড নং, এলাকা, থানা ও জেলা..."
                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-red-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1 text-gray-600">
                      <div className="flex justify-between">
                        <span>প্রোডাক্ট মূল্য:</span>
                        <span>৳{orderProduct.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ডেলিভারি চার্জ:</span>
                        <span>৳{custLocation === 'inside_dhaka' ? 70 : 130}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1 text-sm">
                        <span>সর্বমোট (ক্যাশ অন ডেলিভারি):</span>
                        <span className="text-red-600">
                          ৳{orderProduct.price + (custLocation === 'inside_dhaka' ? 70 : 130)} BDT
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingOrder}
                      className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingOrder ? (
                        <span>কনফার্ম হচ্ছে...</span>
                      ) : (
                        <span>অর্ডার কনফার্ম করুন (ক্যাশ অন ডেলিভারি)</span>
                      )}
                    </button>
                  </form>
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
                      <span className="font-bold text-sm text-gray-900">অর্ডার লাইভ ট্র্যাকিং</span>
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
                        className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:border-red-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => handleExecuteTracking()}
                        disabled={isTrackingLoading || !trackQuery.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {isTrackingLoading ? 'খোঁজা হচ্ছে...' : 'ট্র্যাক'}
                      </button>
                    </div>

                    {trackResult && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-2">
                        {trackResult.success ? (
                          <>
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                              <span className="font-bold text-gray-900">অর্ডার #{trackResult.order?.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {trackResult.order?.status || 'Active'}
                              </span>
                            </div>
                            <div className="text-gray-600 space-y-1">
                              <div>গ্রাহক: {trackResult.order?.customerName}</div>
                              <div>বিল: ৳{trackResult.order?.totalAmount} (COD)</div>
                              {trackResult.order?.steadfastConsignmentId && (
                                <div className="text-sky-700 font-semibold">
                                  Steadfast Consignment ID: {trackResult.order.steadfastConsignmentId}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-rose-600 font-medium text-center py-2">
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
    </div>
  );
};
