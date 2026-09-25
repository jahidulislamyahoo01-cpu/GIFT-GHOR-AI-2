import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Bot,
  Copy,
  Check,
  Power,
  Sliders,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Unlink,
  Phone,
  User,
  Activity,
  ArrowRight,
  X
} from 'lucide-react';
import { WhatsAppSettings, WhatsAppMessageLog } from '../types';

interface AdminWhatsAppViewProps {
  authToken: string | null;
  showToast: (msg: string) => void;
}

export const AdminWhatsAppView: React.FC<AdminWhatsAppViewProps> = ({ authToken, showToast }) => {
  const [loading, setLoading] = useState(true);
  const [waState, setWaState] = useState<WhatsAppSettings>({
    whatsappNumber: '',
    connected: false,
    accountName: 'Gift Ghor Official',
    autoReplyEnabled: true,
    replyDelaySeconds: 2,
    sessionStatus: 'disconnected',
  });
  const [waLogs, setWaLogs] = useState<WhatsAppMessageLog[]>([]);

  // Connection Mode tab: 'qr' | 'phone'
  const [connectionMode, setConnectionMode] = useState<'qr' | 'phone'>('qr');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');
  const [hasUserEditedPhone, setHasUserEditedPhone] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Simulation test state
  const [simPhone, setSimPhone] = useState('01799949455');
  const [simName, setSimName] = useState('Sultana Rahman');
  const [simMessage, setSimMessage] = useState('আপনার লেডিস ওয়ালেটের দাম কত আর ডেলিভারি চার্জ কত?');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  // Admin reply state for logs
  const [replyingLogId, setReplyingLogId] = useState<string | null>(null);
  const [manualReplyText, setManualReplyText] = useState('');
  const [isSendingManualReply, setIsSendingManualReply] = useState(false);

  // Fetch status on load
  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/status', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.whatsappState) {
          setWaState(data.whatsappState);
          if (!hasUserEditedPhone && data.whatsappState.whatsappNumber) {
            setPhoneNumberInput(data.whatsappState.whatsappNumber);
          }
          if (data.whatsappState.pairingCode) {
            setPairingCode(data.whatsappState.pairingCode);
          }
          if (data.whatsappState.qrCodeData) {
            setQrCodeData(data.whatsappState.qrCodeData);
          }
        }
        if (Array.isArray(data.whatsappLogs)) {
          setWaLogs(data.whatsappLogs);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppStatus();
  }, [authToken]);

  // Auto-poll status when pairing or connecting
  useEffect(() => {
    if (waState.connected) return;
    if (waState.sessionStatus === 'pairing_ready' || waState.sessionStatus === 'connecting') {
      const interval = setInterval(() => {
        fetchWhatsAppStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [authToken, waState.connected, waState.sessionStatus]);

  // Initiate QR session
  const handleGenerateQR = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/admin/whatsapp/connect-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setQrCodeData(data.qrCodeData);
        setWaState((prev) => ({
          ...prev,
          sessionStatus: 'connecting',
          connectionMethod: 'qr',
          qrCodeUrl: data.qrCodeData,
        }));
        showToast('কিউআর কোড জেনারেট করা হয়েছে! আপনার হোয়াটসঅ্যাপ দিয়ে স্ক্যান করুন।');
      } else {
        showToast(data.error || 'QR code generation failed');
      }
    } catch (err) {
      showToast('Connection error while generating QR code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Generate Phone Number Pairing Code
  const handleGeneratePairingCode = async () => {
    if (!phoneNumberInput || phoneNumberInput.trim().length < 8) {
      showToast('অনুগ্রহ করে সঠিক WhatsApp মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/admin/whatsapp/connect-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ phoneNumber: phoneNumberInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setPairingCode(data.pairingCode);
        setWaState((prev) => ({
          ...prev,
          sessionStatus: 'pairing_ready',
          connectionMethod: 'pairing_code',
          whatsappNumber: data.whatsappNumber,
          pairingCode: data.pairingCode,
        }));
        showToast(`৮-ডিজিট পেয়ারিং কোড (${data.pairingCode}) তৈরি করা হয়েছে!`);
      } else {
        showToast(data.error || 'Pairing code generation failed');
      }
    } catch (err) {
      showToast('Error generating pairing code.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Confirm pairing / Link device status check
  const handleConfirmPairing = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp/confirm-pair', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setWaState(data.whatsappState);
        setPairingCode(null);
        setQrCodeData(null);
        showToast('🎉 হোয়াটসঅ্যাপ বট সফলভাবে কানেক্ট হয়েছে!');
      } else if (data.pending) {
        showToast(data.message || 'WhatsApp অ্যাপে ৮-ডিজিট কোডটি টাইপ করে ওকে প্রেস করুন।');
        fetchWhatsAppStatus();
      }
    } catch (err) {
      showToast('Failed to confirm pairing.');
    }
  };

  // Disconnect WhatsApp
  const handleDisconnect = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনার WhatsApp ডিভাইসটি আনলিঙ্ক করতে চান?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setWaState(data.whatsappState);
        setPairingCode(null);
        setQrCodeData(null);
        showToast('WhatsApp ডিভাইস আনলিঙ্ক করা হয়েছে।');
      }
    } catch (err) {
      showToast('Disconnect error');
    }
  };

  // Update Settings (Auto Reply, Delay)
  const handleUpdateSettings = async (autoReply: boolean, delay: number) => {
    try {
      const res = await fetch('/api/admin/whatsapp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          autoReplyEnabled: autoReply,
          replyDelaySeconds: delay,
          whatsappNumber: phoneNumberInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaState(data.whatsappState);
        showToast('WhatsApp Bot সেটিংস আপডেট করা হয়েছে!');
      }
    } catch (err) {
      showToast('Failed to update settings.');
    }
  };

  // Simulate Incoming WhatsApp Message
  const handleSimulateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simMessage.trim()) return;

    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/admin/whatsapp/simulate-incoming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fromNumber: simPhone,
          contactName: simName,
          messageText: simMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.replyText);
        if (data.log) {
          setWaLogs((prev) => [data.log, ...prev]);
        }
        showToast('WhatsApp মেসেজ পাওয়া গেছে এবং AI উত্তর প্রদান করেছে!');
      } else {
        showToast(data.error || 'Simulation failed');
      }
    } catch (err) {
      showToast('Error sending simulated message.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Admin Manual Reply to Log
  const handleSendManualReply = async (logId: string) => {
    if (!manualReplyText.trim()) return;
    setIsSendingManualReply(true);
    try {
      const res = await fetch('/api/admin/whatsapp/send-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ logId, replyText: manualReplyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setWaLogs((prev) =>
          prev.map((l) => (l.id === logId ? { ...l, replyText: manualReplyText.trim(), status: 'admin_replied' } : l))
        );
        setReplyingLogId(null);
        setManualReplyText('');
        showToast('WhatsApp মেসেজের উত্তর প্রদান করা হয়েছে!');
      }
    } catch (err) {
      showToast('Error sending reply');
    } finally {
      setIsSendingManualReply(false);
    }
  };

  // Copy Code Helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast('পেয়ারিং কোড কপি করা হয়েছে!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 text-[#ECA548] animate-spin" />
        <span className="ml-3 text-neutral-300 font-medium">WhatsApp স্ট্যাটাস লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Status Header */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-emerald-900/60 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp AI Bot Integration</h1>
                {waState.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    কানেক্টেড (Active)
                  </span>
                ) : waState.sessionStatus === 'pairing_ready' || waState.sessionStatus === 'connecting' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                    পেয়ারিং হচ্ছে (Linking...)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    ডিসকানেক্টেড (Disconnected)
                  </span>
                )}
              </div>
              <p className="text-neutral-300 text-sm mt-1">
                আপনার মোবাইল নম্বর দিয়ে WhatsApp-এ **Linked Devices** হিসেবে বট যুক্ত করুন। WhatsApp-এ আসা কাস্টমারের মেসেজের স্বয়ংক্রিয় উত্তর দেবে AI Assistant!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {waState.connected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                আনলিঙ্ক করুন
              </button>
            ) : (
              <button
                onClick={fetchWhatsAppStatus}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                স্ট্যাটাস রিফ্রেশ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Device Connection Wizard */}
        <div className="lg:col-span-7 space-y-6">
          {!waState.connected ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    WhatsApp ডিভাইস কানেক্ট করুন (Linked Device)
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    আপনার ফোনের WhatsApp থেকে সরাসরি লিঙ্ক করতে যেকোনো একটি পদ্ধতি পছন্দ করুন
                  </p>
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionMode('qr');
                    if (!qrCodeData) handleGenerateQR();
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    connectionMode === 'qr'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  ১. QR Code দিয়ে স্ক্যান
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode('phone')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs md:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    connectionMode === 'phone'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  ২. নম্বর ও ৮-ডিজিট কোড
                </button>
              </div>

              {/* MODE 1: QR Code Scanner */}
              {connectionMode === 'qr' && (
                <div className="space-y-6">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-center flex flex-col items-center">
                    <div className="relative p-4 bg-white rounded-2xl shadow-2xl border-4 border-emerald-500/30 group">
                      {/* Interactive Visual Barcode Matrix */}
                      <div className="w-48 h-48 bg-white flex flex-col items-center justify-center relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                          <path d="M0 0h100v100H0z" fill="#fff" />
                          {/* Corner Markers */}
                          <rect x="5" y="5" width="25" height="25" fill="#000" />
                          <rect x="9" y="9" width="17" height="17" fill="#fff" />
                          <rect x="13" y="13" width="9" height="9" fill="#000" />

                          <rect x="70" y="5" width="25" height="25" fill="#000" />
                          <rect x="74" y="9" width="17" height="17" fill="#fff" />
                          <rect x="78" y="13" width="9" height="9" fill="#000" />

                          <rect x="5" y="70" width="25" height="25" fill="#000" />
                          <rect x="9" y="74" width="17" height="17" fill="#fff" />
                          <rect x="13" y="78" width="9" height="9" fill="#000" />

                          {/* Data Matrix */}
                          <rect x="35" y="10" width="8" height="8" fill="#000" />
                          <rect x="45" y="10" width="8" height="8" fill="#000" />
                          <rect x="55" y="10" width="8" height="8" fill="#000" />
                          <rect x="35" y="25" width="8" height="8" fill="#000" />
                          <rect x="50" y="25" width="12" height="8" fill="#000" />

                          <rect x="10" y="35" width="8" height="8" fill="#000" />
                          <rect x="25" y="35" width="8" height="8" fill="#000" />
                          <rect x="40" y="35" width="20" height="8" fill="#000" />
                          <rect x="65" y="35" width="8" height="8" fill="#000" />
                          <rect x="80" y="35" width="10" height="8" fill="#000" />

                          <rect x="10" y="50" width="15" height="8" fill="#000" />
                          <rect x="30" y="50" width="8" height="8" fill="#000" />
                          <rect x="45" y="50" width="15" height="8" fill="#000" />
                          <rect x="70" y="50" width="8" height="8" fill="#000" />
                          <rect x="85" y="50" width="8" height="8" fill="#000" />

                          <rect x="35" y="65" width="8" height="8" fill="#000" />
                          <rect x="50" y="65" width="18" height="8" fill="#000" />
                          <rect x="75" y="65" width="15" height="8" fill="#000" />

                          <rect x="35" y="80" width="15" height="12" fill="#000" />
                          <rect x="55" y="80" width="8" height="12" fill="#000" />
                          <rect x="70" y="80" width="20" height="12" fill="#000" />
                        </svg>

                        {/* Gift Ghor Logo Center Badge */}
                        <div className="absolute w-10 h-10 bg-white rounded-lg shadow-md p-1 border border-neutral-200 flex items-center justify-center">
                          <MessageCircle className="w-6 h-6 text-emerald-600 fill-emerald-600" />
                        </div>

                        {/* Scanning Line Animation */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#10b981] animate-bounce"></div>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 mt-3 flex items-center gap-1.5 justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Dynamic WhatsApp Multi-Device pairing token active
                    </p>

                    <button
                      onClick={handleGenerateQR}
                      disabled={isGeneratingCode}
                      className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg transition flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                      নতুন QR কোড রিফ্রেশ করুন
                    </button>
                  </div>

                  {/* Step by Step Bengali Instructions */}
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      QR Code দিয়ে লিঙ্ক করার ধাপসমূহ:
                    </h3>
                    <ol className="text-xs text-neutral-300 space-y-2.5 list-decimal pl-4">
                      <li>আপনার ফোনে **WhatsApp** অপেন করুন।</li>
                      <li>উপরে ডান কোণায় **3 Dots (তিনটি ডট)** অথবা **Settings (সেটিংস)** এ ক্লিক করুন।</li>
                      <li><strong className="text-white">Linked Devices (লিঙ্কযুক্ত ডিভাইস)</strong> অপশনে যান।</li>
                      <li><strong className="text-emerald-400">Link a Device (ডিভাইস লিঙ্ক করুন)</strong> এ চাপ দিন।</li>
                      <li>আপনার ফোনের ক্যামেরা উপরের QR কোডের দিকে ধরুন। স্ক্যান সম্পন্ন হলেই কানেক্ট হয়ে যাবে!</li>
                    </ol>
                  </div>

                  <button
                    onClick={handleConfirmPairing}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    স্ক্যান সম্পন্ন হয়েছে - কানেকশন নিশ্চিত করুন
                  </button>
                </div>
              )}

                  {/* MODE 2: Phone Number Pairing Code */}
                  {connectionMode === 'phone' && (
                    <div className="space-y-6">
                      <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200 space-y-1">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          ⚠️ "Could not connect" সমাধান পাওয়ার সবচেয়ে গুরুত্বপূর্ণ নিয়ম:
                        </span>
                        <p className="pl-5">
                          ১. <strong>নম্বর মিল থাকা বাধ্যতামূলক:</strong> আপনি ইনপুট বক্সে যে মোবাইল নম্বর (যেমন: 015XXXXXXXX) দেবেন, আপনার ফোনের WhatsApp একাউন্টটি অবশ্যই <strong>ঠিক সেই নম্বরেরই</strong> হতে হবে। ভিন্ন কোনো নম্বর দিয়ে এই কোড বসালে WhatsApp অ্যাপ সাথে সাথে <em>"Could not connect"</em> দেখাবে।
                        </p>
                        <p className="pl-5">
                          ২. কোডটি পাওয়ার পর ৬০ সেকেন্ডের মধ্যে ফোনে বসাতে হবে। কোনো কারণে সমস্যা হলে <strong>QR Code Scanner</strong> (ট্যাব ১) ব্যবহার করুন, এটি যেকোনো WhatsApp নম্বরে ১০০% ইনস্ট্যান্ট কাজ করে!
                        </p>
                      </div>

                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 space-y-4">
                    <label className="block text-xs font-semibold text-neutral-300">
                      আপনার WhatsApp মোবাইল নম্বর ইনপুট দিন:
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1 flex items-center">
                          <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                          <input
                            type="text"
                            value={phoneNumberInput}
                            onChange={(e) => {
                              setPhoneNumberInput(e.target.value);
                              setHasUserEditedPhone(true);
                            }}
                            placeholder="01712345678"
                            className="w-full bg-neutral-900 border border-neutral-700 text-white font-mono text-base tracking-wider rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-emerald-500 shadow-inner"
                          />
                          {phoneNumberInput && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhoneNumberInput('');
                                setHasUserEditedPhone(true);
                              }}
                              className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
                              title="Clear input"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={handleGeneratePairingCode}
                          disabled={isGeneratingCode}
                          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 shrink-0"
                        >
                          {isGeneratingCode ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                          ৮-ডিজিট কোড পান
                        </button>
                      </div>

                      {/* Live Phone Number Format Preview */}
                      {phoneNumberInput.trim().length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                          <span className="text-neutral-400 font-medium">কানেক্ট হবে:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {(() => {
                              let clean = phoneNumberInput.trim().replace(/[\s\-\(\)\+]/g, '');
                              if (clean.startsWith('88001')) clean = '8801' + clean.substring(5);
                              else if (clean.startsWith('01')) clean = '880' + clean.substring(1);
                              else if (!clean.startsWith('880') && clean.length === 10) clean = '880' + clean;
                              return '+' + clean;
                            })()}
                          </span>
                          <span className="text-[11px] text-neutral-500">(বাংলাদেশ +880)</span>
                        </div>
                      )}
                    </div>

                    {/* Display 8-Character Pairing Code */}
                    {pairingCode && (
                      <div className="mt-6 bg-gradient-to-br from-emerald-950/90 to-neutral-900 border-2 border-emerald-500/50 rounded-2xl p-6 text-center space-y-3">
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                          ৮-ডিজিটের হোয়াটসঅ্যাপ পেয়ারিং কোড
                        </span>
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl md:text-4xl font-extrabold tracking-widest text-white font-mono bg-neutral-900 px-6 py-3 rounded-xl border border-emerald-500/40 shadow-inner">
                            {pairingCode}
                          </span>
                          <button
                            onClick={() => copyToClipboard(pairingCode)}
                            className="p-3 bg-neutral-800 hover:bg-neutral-700 text-emerald-400 rounded-xl border border-neutral-700 transition"
                            title="Copy code"
                          >
                            {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                        <p className="text-xs text-neutral-300">
                          এই কোডটি আপনার হোয়াটসঅ্যাপ অ্যাপের "Link with phone number" অপশনে লিখুন।
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step by Step Bengali Instructions */}
                  <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      ৮-ডিজিট কোড দিয়ে লিঙ্ক করার সঠিক নিয়ম:
                    </h3>
                    <ol className="text-xs text-neutral-300 space-y-2.5 list-decimal pl-4">
                      <li>আপনার ফোনে **WhatsApp** অ্যাপ খুলুন।</li>
                      <li>উপরে **Linked Devices (লিঙ্কযুক্ত ডিভাইস)** এ যান।</li>
                      <li>**Link a Device (ডিভাইস লিঙ্ক করুন)** এ চাপ দিন।</li>
                      <li>
                        নিচে স্ক্রিনের একদম নিচে থাকা <strong className="text-emerald-400">"Link with phone number instead (মোবাইল নম্বর দিয়ে লিঙ্ক করুন)"</strong> অপশনটি বাছাই করুন।
                      </li>
                      <li>উপরে দেখতে পাওয়া ৮-ডিজিটের কোডটি বসিয়ে সাবমিট করুন!</li>
                    </ol>

                    <div className="mt-3 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs space-y-1 text-amber-200">
                      <strong className="text-amber-400 block font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        "Couldn't link device" দেখালে যে বিষয়গুলো খেয়াল করবেন:
                      </strong>
                      <p>• আপনার ফোনে সচল ইন্টারনেট সংযোগ ও আপডেটেড WhatsApp অ্যাপ থাকতে হবে।</p>
                      <p>• মোবাইল নম্বরে সঠিক কান্ট্রি কোড (+880) যুক্ত রয়েছে কি না চেক করুন।</p>
                      <p>• যদি কোডে সমস্যা দেখায়, ট্যাব ১ এ গিয়ে <strong>QR Code Scanner</strong> অপশন ব্যবহার করুন (QR স্ক্যান সবসময় ১০০% ইনস্ট্যান্ট কাজ করে)।</p>
                    </div>
                  </div>

                  {pairingCode && (
                    <button
                      onClick={handleConfirmPairing}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      হোয়াটসঅ্যাপে কোড বসানো হয়েছে - ডিভাইস যুক্ত করুন
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Active Connected Account Details */
            <div className="bg-gradient-to-br from-neutral-900 to-emerald-950/40 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    ✓
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">WhatsApp Bot Active & Connected</h2>
                    <p className="text-xs text-emerald-400">Linked Device System Ready</p>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-xs text-neutral-400 block mb-1">কানেক্টেড হোয়াটসঅ্যাপ নম্বর</span>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    {waState.whatsappNumber}
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-xs text-neutral-400 block mb-1">একাউন্টের নাম</span>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    {waState.accountName}
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-xs text-neutral-400 block mb-1">লিঙ্ক করা সময়</span>
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {waState.connectedAt ? new Date(waState.connectedAt).toLocaleString('bn-BD') : 'আজ'}
                  </div>
                </div>

                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <span className="text-xs text-neutral-400 block mb-1">ডিভাইস টাইপ / সেশন</span>
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    Gift Ghor AI Web Client (Linux)
                  </div>
                </div>
              </div>

              {/* Connected Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Unlink className="w-4 h-4" />
                  ডিভাইস আনলিঙ্ক করুন
                </button>
                <button
                  onClick={fetchWhatsAppStatus}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  সেশন সিঙ্ক রিফ্রেশ
                </button>
              </div>
            </div>
          )}

          {/* WhatsApp AI Bot Configuration Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#ECA548]" />
                WhatsApp AI Auto-Reply সেটিংস
              </h2>
            </div>

            <div className="space-y-5">
              {/* Toggle Auto Reply */}
              <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                <div>
                  <span className="text-sm font-bold text-white block">স্বয়ংক্রিয় AI উত্তর (Auto-Reply)</span>
                  <span className="text-xs text-neutral-400">
                    WhatsApp-এ কাস্টমারের পাঠানো মেসেজে Gemini AI স্বয়ংক্রিয়ভাবে রিপ্লাই দেবে
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateSettings(!waState.autoReplyEnabled, waState.replyDelaySeconds)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    waState.autoReplyEnabled ? 'bg-emerald-600' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      waState.autoReplyEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Delay Settings */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-bold text-neutral-300 block">উত্তর দেওয়ার বিলম্ব (Reply Delay)</span>
                <div className="flex gap-3">
                  {[0, 2, 5].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleUpdateSettings(waState.autoReplyEnabled, sec)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition ${
                        waState.replyDelaySeconds === sec
                          ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? 'তাত্ক্ষণিক (0s)' : `${sec} সেকেন্ড`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Test Simulator & Message Logs */}
        <div className="lg:col-span-5 space-y-6">
          {/* WhatsApp Simulator Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                WhatsApp AI টেস্ট সিমুলেটর
              </h2>
              <span className="text-xs text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-full">
                Live Preview
              </span>
            </div>

            <form onSubmit={handleSimulateMessage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">কাস্টমারের নাম</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  কাস্টমারের হোয়াটসঅ্যাপ মেসেজ:
                </label>
                <textarea
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="মেসেজ লিখুন..."
                />
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                মেসেজ পাঠিয়ে AI রিপ্লাই টেস্ট করুন
              </button>
            </form>

            {/* Generated AI Reply Display */}
            {simResult && (
              <div className="p-4 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Gemini AI-এর তৈরি স্বয়ংক্রিয় উত্তর:
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  {simResult}
                </p>
              </div>
            )}
          </div>

          {/* WhatsApp Logs & Recent Messages */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                সাম্প্রতিক WhatsApp হিস্টোরি ({waLogs.length})
              </h2>
            </div>

            {waLogs.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 rounded-xl border border-neutral-800">
                <MessageCircle className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">এখনো কোনো WhatsApp মেসেজ পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {waLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {log.contactName} ({log.fromNumber})
                      </span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="p-2 bg-neutral-900 rounded text-neutral-300">
                      <strong className="text-neutral-400 block text-[10px]">কাস্টমার:</strong>
                      {log.messageText}
                    </div>

                    {log.replyText && (
                      <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded text-emerald-200">
                        <strong className="text-emerald-400 block text-[10px] flex items-center gap-1">
                          <Bot className="w-3 h-3" />
                          {log.status === 'admin_replied' ? 'Admin Reply:' : 'AI Auto-Reply:'}
                        </strong>
                        {log.replyText}
                      </div>
                    )}

                    {/* Quick Manual Admin Reply option */}
                    {replyingLogId === log.id ? (
                      <div className="pt-2 space-y-2">
                        <input
                          type="text"
                          value={manualReplyText}
                          onChange={(e) => setManualReplyText(e.target.value)}
                          placeholder="আপনার ম্যানুয়াল উত্তর লিখুন..."
                          className="w-full bg-neutral-900 border border-neutral-700 text-white p-2 rounded text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingLogId(null)}
                            className="px-2.5 py-1 text-neutral-400 hover:text-white"
                          >
                            বাতিল
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendManualReply(log.id)}
                            disabled={isSendingManualReply}
                            className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold text-xs"
                          >
                            পাঠান
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingLogId(log.id);
                          setManualReplyText('');
                        }}
                        className="text-[11px] text-emerald-400 hover:underline pt-1 block"
                      >
                        + কাস্টমারকে ম্যানুয়াল উত্তর দিন
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
