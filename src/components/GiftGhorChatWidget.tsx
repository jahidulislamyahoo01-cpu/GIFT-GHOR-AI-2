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
  const [showTeaser, setShowTeaser] = useState(false);
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
      'অর্ডার করতে চাই 🎁',
      'ডেলিভারি চার্জ কত? 🚚',
      'প্রোডাক্ট ক্যাটালগ 🛍️',
      'কাস্টমাইজেশনের নিয়ম ✨',
    ],
    showOnlineStatus: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
          if (data.messages && data.messages.length > messages.length) {
            setMessages(data.messages);
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, sessionId, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputVal).trim();
    if (!messageText || isTyping) return;

    setInputVal('');
    setShowTeaser(false);

    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      sessionId,
      sender: 'user',
      text: messageText,
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
          sender: 'user',
          pageContext: {
            url: window.location.href,
            title: document.title,
            // Extract some text from the body to give context on what the user is looking at (limit to 1000 chars to avoid huge payloads)
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
                    <h3 className="font-bold text-sm tracking-tight" style={{ color: branding.headerTextColor }}>
                      {branding.widgetTitle}
                    </h3>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/20">
                      AI 2.5
                    </span>
                  </div>
                  {branding.showOnlineStatus && (
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

                        <div className="whitespace-pre-line text-[13.5px]">
                          {msg.text}
                        </div>

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

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 rounded-full bg-[#ECA548]/20 flex items-center justify-center shrink-0">
                    <Gift className="w-3 h-3 text-[#ECA548]" />
                  </div>
                  <div className="bg-white border border-[#ECECEC] px-3 py-2 rounded-2xl rounded-bl-xs flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-[#ECA548] rounded-full animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 bg-[#ECA548] rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-[#ECA548] rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              )}

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

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-[#ECECEC] flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                id="giftghor-chat-input"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="এখানে মেসেজ লিখুন (বাংলা / English)..."
                className="flex-1 text-sm bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626] transition-all"
              />
              <button
                type="submit"
                id="giftghor-chat-send-btn"
                disabled={!inputVal.trim() || isTyping}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{ backgroundColor: branding.primaryColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
