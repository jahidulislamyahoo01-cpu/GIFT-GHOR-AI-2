import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  MessageSquare,
  BookOpen,
  Palette,
  Code2,
  Package,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  User,
  Phone,
  MapPin,
  Globe,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  LogOut,
  Key,
  Database,
  Sparkles,
  ShoppingBag,
  Sliders,
  Copy,
  Check,
} from 'lucide-react';
import {
  AdminOverviewStats,
  BrandingSettings,
  DeliveryPolicy,
  ProductItem,
  CrawledPage,
  UploadedFile,
  KnowledgeFAQ,
  ChatSession,
} from '../types';

interface AdminDashboardProps {
  onGoToStorefront: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoToStorefront }) => {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('giftghor_admin_token') || null;
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'inbox' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'security'
  >('inbox');

  // Dashboard Data State
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [deliveryPolicy, setDeliveryPolicy] = useState<DeliveryPolicy | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [crawledPages, setCrawledPages] = useState<CrawledPage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [faqs, setFaqs] = useState<KnowledgeFAQ[]>([]);
  const [sessions, setSessions] = useState<Record<string, ChatSession>>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [codAmount, setCodAmount] = useState<string>('');
  const [isSendingSteadfast, setIsSendingSteadfast] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Crawler form state
  const [crawlUrl, setCrawlUrl] = useState('https://giftghor.world/sitemap.xml');
  const [isCrawling, setIsCrawling] = useState(false);

  // File upload state
  const [uploadFileType, setUploadFileType] = useState<'xml' | 'csv' | 'txt' | 'pdf'>('xml');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadRawText, setUploadRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Sync & retrain state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passFeedback, setPassFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch full admin state
  const loadAdminState = async (token = authToken, isInitial = false, isPolling = false) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setAuthToken(null);
        localStorage.removeItem('giftghor_admin_token');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setSessions(data.sessions || {});
      
      // Do not overwrite user input fields during background polling
      if (!isPolling) {
        setBranding(data.branding);
        setDeliveryPolicy(data.deliveryPolicy);
        setProducts(data.products || []);
        setCrawledPages(data.crawledPages || []);
        setUploadedFiles(data.uploadedFiles || []);
        setFaqs(data.faqs || []);
      }

      // Auto-select first session on initial load
      if (isInitial) {
        const sessionKeys = Object.keys(data.sessions || {});
        if (sessionKeys.length > 0) {
          setSelectedSessionId(sessionKeys[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load admin state', err);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadAdminState(authToken, true);
      // Poll chat sessions every 5s for live incoming messages
      const interval = setInterval(() => {
        loadAdminState(authToken, false, true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [authToken]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAuthToken(data.token);
        localStorage.setItem('giftghor_admin_token', data.token);
        showToast('Welcome back, Admin!');
        loadAdminState(data.token);
      } else {
        setLoginError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setLoginError('Server connection failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('giftghor_admin_token');
    setSelectedSessionId(null);
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassFeedback(null);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassFeedback({ success: 'Admin password changed successfully!' });
        setCurrentPass('');
        setNewPass('');
      } else {
        setPassFeedback({ error: data.error || 'Password update failed' });
      }
    } catch (err) {
      setPassFeedback({ error: 'Connection error' });
    }
  };

  // Admin Reply to Customer in Real-time
  const handleSendAdminReply = async () => {
    if (!selectedSessionId || !adminReplyText.trim() || isSendingReply) return;
    setIsSendingReply(true);

    try {
      const res = await fetch(`/api/admin/chats/${selectedSessionId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ text: adminReplyText }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminReplyText('');
        loadAdminState();
        showToast('Admin reply sent directly to customer widget!');
      }
    } catch (err) {
      showToast('Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Toggle AI vs Admin Takeover
  const handleToggleTakeover = async (sessionId: string, newMode: 'ai' | 'admin_takeover') => {
    try {
      const res = await fetch(`/api/admin/chats/${sessionId}/mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) {
        loadAdminState();
        showToast(newMode === 'admin_takeover' ? 'Admin took over chat' : 'Returned chat to AI mode');
      }
    } catch (err) {
      showToast('Failed to change chat mode');
    }
  };

  // Trigger Crawler
  const handleStartCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl.trim() || isCrawling) return;
    setIsCrawling(true);

    try {
      const res = await fetch('/api/admin/crawler/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url: crawlUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrawledPages(data.crawledPages);
        showToast(`Indexed ${data.crawledItem.itemsFound} items from ${crawlUrl}`);
        loadAdminState();
      }
    } catch (err) {
      showToast('Crawling failed');
    } finally {
      setIsCrawling(false);
    }
  };

  // Trigger File Upload Knowledge
  const handleUploadKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    setIsUploading(true);

    const name = uploadFileName || `giftghor_feed_${Date.now()}.${uploadFileType}`;
    try {
      const res = await fetch('/api/admin/upload-knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fileName: name,
          fileType: uploadFileType,
          rawContent: uploadRawText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedFiles(data.uploadedFiles);
        setUploadFileName('');
        setUploadRawText('');
        showToast(`Knowledge source added: ${name}`);
        loadAdminState();
      }
    } catch (err) {
      showToast('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Sync & Re-train Context for Gemini
  const handleSyncAndRetrain = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch('/api/admin/sync-and-train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncFeedback(
          `Successfully compiled ${data.sourcesCount} knowledge sources into Gemini System Context (v${data.trainingVersion})`
        );
        showToast('Gemini Knowledge Synced & Re-trained!');
        loadAdminState();
      }
    } catch (err) {
      setSyncFeedback('Sync failed. Please check network connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Delivery Policy
  const handleSaveDeliveryPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryPolicy) return;
    try {
      const res = await fetch('/api/admin/delivery-policy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(deliveryPolicy),
      });
      if (res.ok) {
        showToast('Delivery rules & notices updated!');
        loadAdminState();
      }
    } catch (err) {
      showToast('Failed to update delivery policy');
    }
  };

  // Save Branding
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branding) return;
    try {
      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(branding),
      });
      if (res.ok) {
        showToast('Branding settings saved!');
        loadAdminState();
      }
    } catch (err) {
      showToast('Failed to save branding');
    }
  };

  // Generate clean embed code for Google Tag Manager or direct HTML injection
  const currentAppOrigin = window.location.origin;
  const embedScriptCode = `<!-- Gift Ghor AI Customer Support Widget Embed (Inject in GTM or <body>) -->
<script>
  (function() {
    var d = document, s = d.createElement('script');
    s.src = '${currentAppOrigin}/widget.js';
    s.async = true;
    s.onload = function() {
      if (window.GiftGhorAI) {
        window.GiftGhorAI.init({
          brandColor: '#ECA548',
          store: 'Gift Ghor',
          endpoint: '${currentAppOrigin}'
        });
      }
    };
    d.head.appendChild(s);
  })();
</script>
<!-- Or direct isolated iFrame snippet (Zero conflict with store scripts) -->
<iframe
  src="${currentAppOrigin}/?mode=widget"
  style="position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:999999;pointer-events:all;"
  allow="microphone"
  title="Gift Ghor Customer Support"
></iframe>`;

  // -------------------------------------------------------------
  // VIEW: Protected Login Screen
  // -------------------------------------------------------------
  if (!authToken) {
    return (
      <div className="min-h-screen bg-[#FDF7EE] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#ECECEC] p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#FDF7EE] border-2 border-[#ECA548] flex items-center justify-center mb-4 text-[#ECA548] shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#262626] tracking-tight">Gift Ghor Admin</h1>
            <p className="text-xs text-gray-500 mt-1">
              Protected Management & Real-Time Customer Support Console
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#262626] mb-1">
                Admin Username
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                required
                className="w-full text-sm bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#262626] mb-1">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full text-sm bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                placeholder="••••••••••••"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Default credentials: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">admin</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">giftghor2026</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: '#ECA548' }}
            >
              {isLoggingIn ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>Unlock Admin Console</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#ECECEC] flex items-center justify-between text-xs text-gray-500">
            <span>Store: giftghor.world</span>
            <button
              onClick={onGoToStorefront}
              className="text-[#ECA548] hover:underline font-semibold flex items-center gap-1"
            >
              Back to Storefront <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: Authenticated Admin Dashboard
  // -------------------------------------------------------------
  const sessionList = (Object.values(sessions) as ChatSession[]).sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
  const currentSession = selectedSessionId ? sessions[selectedSessionId] : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#262626]">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-[#ECECEC] sticky top-0 z-30 px-4 md:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FDF7EE] border border-[#ECA548]/40 flex items-center justify-center text-[#ECA548] font-bold shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-[#262626] line-clamp-1">Gift Ghor Control Center</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30 shrink-0">
                  PROD-SECURE
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block line-clamp-1">
                Isolated Backend • gemini-2.5-flash AI Engine • giftghor.world
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          {/* Quick sync button */}
          <button
            onClick={handleSyncAndRetrain}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#ECA548] text-[#ECA548] hover:bg-[#FDF7EE] transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Syncing...' : 'Sync & Re-train AI'}</span>
          </button>

          {/* Switch to Storefront Preview */}
          <button
            onClick={onGoToStorefront}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex items-center gap-1.5"
          >
            <span>Live Store Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#ECECEC] p-3 md:p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 justify-start md:justify-between gap-2 md:gap-0 scrollbar-hide">
          <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 w-full shrink-0">
            <div className="hidden md:block text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              Management
            </div>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'inbox'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Live Chat Inbox</span>
              </div>
              {stats && stats.unreadSessions > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECA548] text-white">
                  {stats.unreadSessions}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('knowledge')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'knowledge'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Knowledge & Training</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Product Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'delivery'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Delivery & Policies</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'branding'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Widget Branding</span>
            </button>

            <button
              onClick={() => setActiveTab('embed')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'embed'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>GTM / Embed Code</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
          </div>

          {/* Bottom stats snapshot */}
          {stats && (
            
            <div className="hidden md:block bg-[#F8F9FA] rounded-2xl p-3 border border-[#ECECEC] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Total Conversations:</span>
                <span className="font-bold text-[#262626]">{stats.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Orders Captured:</span>
                <span className="font-bold text-emerald-600">{stats.ordersCaptured}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>AI Version:</span>
                <span className="font-mono text-gray-700">v{stats.trainingVersion || 1}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Tab Body */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {/* Toast feedback */}
          {toastMessage && (
            <div className="fixed top-18 right-8 z-50 bg-[#262626] text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fadeIn border border-white/20">
              <CheckCircle2 className="w-4 h-4 text-[#ECA548]" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* ----------------- TAB 1: LIVE CHAT INBOX ----------------- */}
          {activeTab === 'inbox' && (
            <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-3 md:gap-5">
              {/* Session list */}
              <div className={`w-full md:w-80 md:h-full bg-white rounded-2xl border border-[#ECECEC] flex-col overflow-hidden shrink-0 shadow-xs md:max-h-full ${selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-3.5 border-b border-[#ECECEC] bg-[#FDF7EE]/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#262626]">
                    Customer Sessions ({sessionList.length})
                  </span>
                  <button
                    onClick={() => loadAdminState()}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    title="Refresh chats"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {sessionList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      No customer chat sessions yet.
                    </div>
                  ) : (
                    sessionList.map((sess) => {
                      const isSelected = sess.id === selectedSessionId;
                      const hasOrder = sess.orderExtracted && sess.orderExtracted.customerPhone;
                      const lastMsg = sess.messages[sess.messages.length - 1];

                      return (
                        <div
                          key={sess.id}
                          onClick={() => {
                            setSelectedSessionId(sess.id);
                            // Mark read
                            fetch(`/api/admin/chats/${sess.id}/read`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${authToken}` },
                            });
                          }}
                          className={`p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#FDF7EE] border-l-4 border-[#ECA548]'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#262626] truncate max-w-[140px]">
                                {sess.customerName || 'Anonymous Visitor'}
                              </span>
                              {sess.mode === 'admin_takeover' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700">
                                  MANUAL
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {new Date(sess.lastActivity).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <p className="text-[11px] text-gray-500 line-clamp-1">
                            {lastMsg ? lastMsg.text : 'No messages'}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px]">
                            <span className="font-mono text-gray-400">
                              #{sess.id.substring(0, 8)}
                            </span>
                            {hasOrder && (
                              <span className="px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Order Lead
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat View & Takeover Area */}
              {currentSession ? (
                <div className={`flex-1 bg-white rounded-2xl border border-[#ECECEC] flex-col overflow-hidden shadow-xs ${!selectedSessionId ? 'hidden md:flex' : 'flex'}`}>
                  {/* Top Bar of active chat */}
                  <div className="px-5 py-3 border-b border-[#ECECEC] flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2 md:gap-3">
                      <button onClick={() => setSelectedSessionId(null)} className="md:hidden p-1.5 mr-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#262626]">
                            {currentSession.customerName || 'Store Visitor'}
                          </h3>
                          <span className="text-xs text-gray-400 font-mono">
                            ({currentSession.id})
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {currentSession.customerPhone ? (
                            <span className="font-semibold text-emerald-600">
                              📞 {currentSession.customerPhone}
                            </span>
                          ) : (
                            'Browsing Gift Ghor catalog'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Mode Toggle: AI vs Manual Takeover */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 hidden sm:inline">Response Mode:</span>
                      {currentSession.mode === 'admin_takeover' ? (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'ai')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hand Over to AI</span><span className="sm:hidden">Hand Over</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'admin_takeover')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Take Over Chat</span><span className="sm:hidden">Take Over</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Lead Summary if detected */}
                  {currentSession.orderExtracted && currentSession.orderExtracted.customerPhone && (
                    <>
                    <div className="bg-emerald-50/60 px-4 md:px-5 py-2.5 md:py-2.5 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between text-xs text-emerald-950 gap-2 md:gap-0">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4">
                        <span className="font-bold flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Captured Order Lead:
                        </span>
                        <span>
                          <strong>Name:</strong> {currentSession.orderExtracted.customerName || 'N/A'}
                        </span>
                        <span>
                          <strong>Phone:</strong> {currentSession.orderExtracted.customerPhone}
                        </span>
                        <span>
                          <strong>Address:</strong> {currentSession.orderExtracted.customerAddress || 'N/A'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase">
                        {currentSession.orderExtracted.orderStatus}
                      </span>
                    </div>

                    {/* Steadfast Integration */}
                    <div className="bg-white/50 px-4 md:px-5 py-3 border-b border-emerald-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img src="https://steadfast.com.bd/favicon.ico" alt="Steadfast" className="w-4 h-4 object-contain" />
                        <span className="text-xs font-semibold text-gray-700">Steadfast Courier</span>
                      </div>
                      
                      {currentSession.orderExtracted.steadfastStatus === 'Sent' ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded">
                            ✅ Order Created successfully!
                          </span>
                          {currentSession.orderExtracted.trackingCode && (
                            <span className="text-gray-500 font-mono">
                              Tracking ID: {currentSession.orderExtracted.trackingCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <input 
                            type="number" 
                            placeholder="COD Amount (৳)" 
                            value={codAmount}
                            onChange={(e) => setCodAmount(e.target.value)}
                            className="w-full md:w-32 text-xs bg-white border border-[#ECECEC] rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400 text-gray-800"
                          />
                          <button
                            onClick={async () => {
                              if (!codAmount) {
                                showToast('Please enter COD amount first');
                                return;
                              }
                              setIsSendingSteadfast(true);
                              try {
                                const res = await fetch('/api/admin/steadfast/send-order', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                                  body: JSON.stringify({ sessionId: currentSession.id, codAmount })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  showToast('Order sent to Steadfast Courier!');
                                  loadAdminState(authToken, false, true);
                                } else {
                                  showToast(data.error || 'Failed to send to Steadfast');
                                }
                              } catch (err) {
                                showToast('Network Error sending to Steadfast');
                              } finally {
                                setIsSendingSteadfast(false);
                              }
                            }}
                            disabled={isSendingSteadfast}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
                          >
                            {isSendingSteadfast ? 'Sending...' : '1-Click Send'}
                          </button>
                        </div>
                      )}
                    </div>
                    </>
                  )}

                  {/* Message stream */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-gray-50/50">
                    {currentSession.messages.map((m) => {
                      const isUser = m.sender === 'user';
                      const isAdmin = m.sender === 'admin';

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-end gap-2 max-w-[80%]">
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                isUser
                                  ? 'bg-white text-[#262626] border border-[#ECECEC] shadow-xs'
                                  : isAdmin
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-[#ECA548] text-white shadow-xs'
                              }`}
                            >
                              <div className="font-bold text-[10px] opacity-75 mb-1">
                                {isUser
                                  ? 'Customer'
                                  : isAdmin
                                  ? 'You (Admin)'
                                  : 'Gift Ghor AI (Gemini)'}
                              </div>
                              <div className="whitespace-pre-line text-[13px]">{m.text}</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1">
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Bar for Admin */}
                  <div className="p-3 bg-white border-t border-[#ECECEC] flex items-center gap-2">
                    <input
                      type="text"
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendAdminReply();
                      }}
                      placeholder={
                        currentSession.mode === 'admin_takeover'
                          ? 'Type your live admin response to customer...'
                          : 'Type admin message (will automatically switch to live takeover)...'
                      }
                      className="flex-1 text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                    />
                    <button
                      onClick={handleSendAdminReply}
                      disabled={!adminReplyText.trim() || isSendingReply}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                      style={{ backgroundColor: '#ECA548' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Send Reply</span><span className="md:hidden">Send</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-2xl border border-[#ECECEC] flex items-center justify-center text-gray-400 text-sm">
                  Select a customer chat session from the left to monitor or take over.
                </div>
              )}
            </div>
          )}

          {/* ----------------- TAB 2: KNOWLEDGE BASE & TRAINING ----------------- */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 max-w-5xl">
              {/* Top Banner with Re-train button */}
              <div className="bg-[#FDF7EE] rounded-2xl border border-[#ECA548]/30 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                <div>
                  <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#ECA548]" />
                    Multi-Source Knowledge Base & Training Manager
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Crawl URLs, upload XML/CSV catalog feeds, and synchronize delivery rules into the unified Gemini 2.5 Flash context.
                  </p>
                </div>
                <button
                  onClick={handleSyncAndRetrain}
                  disabled={isSyncing}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Re-indexing Model...' : 'Sync & Re-train AI'}</span>
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              {/* Sub-section 1: Website Crawler */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-[#ECA548]" />
                  <h3 className="font-bold text-sm text-[#262626]">
                    Website URL & Sitemap Crawler
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Crawls product URLs, sitemaps, and landing pages on <code className="font-mono text-gray-700">giftghor.world</code>, indexing titles, BDT prices, descriptions, and stock status.
                </p>

                <form onSubmit={handleStartCrawl} className="flex flex-col md:flex-row gap-2 mb-4">
                  <input
                    type="url"
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    required
                    placeholder="https://giftghor.world/sitemap.xml"
                    className="flex-1 text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                  />
                  <button
                    type="submit"
                    disabled={isCrawling}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: '#262626' }}
                  >
                    {isCrawling ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>{isCrawling ? 'Crawling Pages...' : 'Start Crawl'}</span>
                  </button>
                </form>

                {/* Crawled records table */}
                <div className="border border-[#ECECEC] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] text-gray-500 font-semibold border-b border-[#ECECEC]">
                      <tr>
                        <th className="px-4 py-2.5">Source URL</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Items Found</th>
                        <th className="px-4 py-2.5">Summary</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {crawledPages.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-gray-700 truncate max-w-[200px]">
                            {c.url}
                          </td>
                          <td className="px-4 py-2.5 uppercase text-[10px] font-bold text-gray-500">
                            {c.pageType}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-[#262626]">
                            {c.itemsFound} items
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 max-w-xs truncate">
                            {c.contentSummary}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-section 2: File & XML Feed Upload */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud className="w-4 h-4 text-[#ECA548]" />
                  <h3 className="font-bold text-sm text-[#262626]">
                    File & XML Product Feed Upload
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Upload XML Google Shopping product feeds, catalog CSVs, or text policy documents to enrich the model's responses.
                </p>

                <form onSubmit={handleUploadKnowledge} className="space-y-3 mb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Feed Type
                      </label>
                      <select
                        value={uploadFileType}
                        onChange={(e) => setUploadFileType(e.target.value as any)}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      >
                        <option value="xml">XML Product Catalog Feed</option>
                        <option value="csv">CSV (Price, Title, Stock)</option>
                        <option value="txt">Text Knowledge File</option>
                        <option value="pdf">PDF Document / Brochure</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        File Name / Description
                      </label>
                      <input
                        type="text"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        placeholder="e.g. giftghor_google_merchant_feed.xml"
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Raw Content / Snippet (Optional - XML/CSV structure)
                    </label>
                    <textarea
                      rows={3}
                      value={uploadRawText}
                      onChange={(e) => setUploadRawText(e.target.value)}
                      placeholder="<item><g:title>Custom Magic Mirror</g:title><g:price>690 BDT</g:price><g:availability>in stock</g:availability></item>"
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl p-3 font-mono text-[#262626]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
                    style={{ backgroundColor: '#ECA548' }}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload & Parse Source</span>
                  </button>
                </form>

                {/* Uploaded records */}
                <div className="space-y-2">
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-[#ECECEC] bg-[#FDF7EE]/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                      <button onClick={() => setSelectedSessionId(null)} className="md:hidden p-1.5 mr-1 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shrink-0 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                        <FileText className="w-5 h-5 text-[#ECA548]" />
                        <div>
                          <p className="font-bold text-xs text-[#262626]">{f.fileName}</p>
                          <p className="text-[11px] text-gray-500">{f.summary}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-[#ECECEC] text-gray-600">
                        {f.fileType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-section 3: FAQs & Quick Q&A Knowledge */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#ECA548]" />
                    <h3 className="font-bold text-sm text-[#262626]">
                      Frequently Asked Questions (Bangla & English)
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 rounded-xl border border-[#ECECEC] bg-white hover:border-[#ECA548]/40 transition-all"
                    >
                      <p className="font-bold text-xs text-[#262626] mb-1">Q: {faq.question}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">A: {faq.answer}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="uppercase font-semibold text-[#ECA548]">
                          Category: {faq.category}
                        </span>
                        <span>Updated: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ----------------- TAB 3: PRODUCT CATALOG ----------------- */}
          {activeTab === 'products' && (
            <div className="space-y-5 max-w-5xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base text-[#262626]">Product Catalog & Inventory</h2>
                  <p className="text-xs text-gray-500">
                    Products automatically ingested into Gemini's sales context with real-time BDT pricing.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-[#ECECEC] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-gray-100 relative overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-emerald-700 shadow-xs">
                        {p.stockStatus === 'in_stock' ? 'In Stock' : 'Low Stock'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-[#ECA548] uppercase">
                          {p.category}
                        </span>
                        <h4 className="font-bold text-xs text-[#262626] mt-0.5 line-clamp-2">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-sm text-[#262626]">
                            ৳{p.price} BDT
                          </span>
                          {p.originalPrice && (
                            <span className="text-xs text-gray-400 line-through ml-1.5">
                              ৳{p.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400">
                          {p.customizable ? 'Customizable ✨' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ----------------- TAB 4: DELIVERY & POLICIES ----------------- */}
          {activeTab === 'delivery' && deliveryPolicy && (
            <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 max-w-3xl shadow-xs">
              <h2 className="font-bold text-base text-[#262626] mb-1">
                Delivery Charges & Return Policies
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Directly controls the rules cited by the AI when customer asks about delivery costs, timeframe, or COD.
              </p>

              <form onSubmit={handleSaveDeliveryPolicy} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Inside Dhaka Delivery Cost (BDT)
                    </label>
                    <input
                      type="number"
                      value={deliveryPolicy.insideDhakaCost}
                      onChange={(e) =>
                        setDeliveryPolicy({
                          ...deliveryPolicy,
                          insideDhakaCost: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 font-bold text-[#262626]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Outside Dhaka Delivery Cost (BDT)
                    </label>
                    <input
                      type="number"
                      value={deliveryPolicy.outsideDhakaCost}
                      onChange={(e) =>
                        setDeliveryPolicy({
                          ...deliveryPolicy,
                          outsideDhakaCost: Number(e.target.value),
                        })
                      }
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 font-bold text-[#262626]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Dhaka Delivery Timeframe
                    </label>
                    <input
                      type="text"
                      value={deliveryPolicy.deliveryTimeDhaka}
                      onChange={(e) =>
                        setDeliveryPolicy({
                          ...deliveryPolicy,
                          deliveryTimeDhaka: e.target.value,
                        })
                      }
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Outside Dhaka Timeframe
                    </label>
                    <input
                      type="text"
                      value={deliveryPolicy.deliveryTimeOutside}
                      onChange={(e) =>
                        setDeliveryPolicy({
                          ...deliveryPolicy,
                          deliveryTimeOutside: e.target.value,
                        })
                      }
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cash on Delivery & Advance Payment Rule
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryPolicy.advancePaymentNote}
                    onChange={(e) =>
                      setDeliveryPolicy({
                        ...deliveryPolicy,
                        advancePaymentNote: e.target.value,
                      })
                    }
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl p-3 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Return & Replacement Policy
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryPolicy.returnPolicyText}
                    onChange={(e) =>
                      setDeliveryPolicy({
                        ...deliveryPolicy,
                        returnPolicyText: e.target.value,
                      })
                    }
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl p-3 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Active Promotional Notice (Free Gift Card / Packaging)
                  </label>
                  <input
                    type="text"
                    value={deliveryPolicy.specialNotice}
                    onChange={(e) =>
                      setDeliveryPolicy({
                        ...deliveryPolicy,
                        specialNotice: e.target.value,
                      })
                    }
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Delivery Policy</span>
                </button>
              </form>
            </div>
          )}

          {/* ----------------- TAB 5: BRANDING CUSTOMIZER ----------------- */}
          {activeTab === 'branding' && branding && (
            <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 max-w-3xl shadow-xs">
              <h2 className="font-bold text-base text-[#262626] mb-1">Branding Customizer</h2>
              <p className="text-xs text-gray-500 mb-6">
                Customize colors (#ECA548), widget logo, welcome messages, and quick-reply pills.
              </p>

              <form onSubmit={handleSaveBranding} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Store Brand Name
                    </label>
                    <input
                      type="text"
                      value={branding.storeName}
                      onChange={(e) => setBranding({ ...branding, storeName: e.target.value })}
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Widget Header Title
                    </label>
                    <input
                      type="text"
                      value={branding.widgetTitle}
                      onChange={(e) =>
                        setBranding({ ...branding, widgetTitle: e.target.value })
                      }
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Store Logo (Upload Image)
                  </label>
                  <div className="flex items-center gap-4">
                    {branding.logoUrl ? (
                      <div className="w-12 h-12 rounded-xl border border-[#ECECEC] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={branding.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-[#ECECEC] bg-gray-50 shrink-0 flex items-center justify-center text-gray-400">
                        <span className="text-[10px]">No logo</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert("File is too large. Please upload an image under 2MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBranding({ ...branding, logoUrl: reader.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626] file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#FDF7EE] file:text-[#ECA548] hover:file:bg-[#faeedd] cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Upload a PNG or JPG. Leave blank for default icon. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Primary Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.primaryColor || '#ECA548'}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={branding.primaryColor || '#ECA548'}
                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Header Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.headerTextColor || '#262626'}
                        onChange={(e) => setBranding({ ...branding, headerTextColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={branding.headerTextColor || '#262626'}
                        onChange={(e) => setBranding({ ...branding, headerTextColor: e.target.value })}
                        className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Widget Font Family
                  </label>
                  <select
                    value={branding.fontFamily || 'sans-serif'}
                    onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  >
                    <option value="sans-serif">System Default (Sans-serif)</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Noto Sans Bengali', sans-serif">Noto Sans Bengali</option>
                    <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
                    <option value="monospace">Monospace</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Welcome Greeting (Bengali / English)
                  </label>
                  <textarea
                    rows={3}
                    value={branding.welcomeMessage}
                    onChange={(e) =>
                      setBranding({ ...branding, welcomeMessage: e.target.value })
                    }
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl p-3 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quick-Reply Buttons (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={branding.quickReplies.join(', ')}
                    onChange={(e) =>
                      setBranding({
                        ...branding,
                        quickReplies: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-1.5"
                    style={{ backgroundColor: '#ECA548' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Branding Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ----------------- TAB 6: GTM & EMBED CODE ----------------- */}
          {activeTab === 'embed' && (
            <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 max-w-4xl shadow-xs space-y-6">
              <div>
                <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#ECA548]" />
                  Google Tag Manager (GTM) & Embed Deliverable
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Inject the lightweight client widget into giftghor.world without exposing admin endpoints or sensitive sync keys.
                </p>
              </div>

              {/* Isolation guarantee badge */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-800">Strict Module Isolation Guarantee</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                    The client widget only queries public read-only branding and session chat endpoints. Admin endpoints (<code className="font-mono">/api/admin/*</code>) require bearer token authentication and are never transmitted to store visitors.
                  </p>
                </div>
              </div>

              {/* Code snippet block */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    Single-Line Embed Script / Custom HTML Tag
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedScriptCode);
                      setCopiedScript(true);
                      setTimeout(() => setCopiedScript(false), 2000);
                      showToast('Embed snippet copied to clipboard!');
                    }}
                    className="text-xs font-bold text-[#ECA548] hover:underline flex items-center gap-1"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Snippet'}</span>
                  </button>
                </div>

                <div className="bg-gray-950 rounded-2xl p-4 font-mono text-[11px] text-gray-200 overflow-x-auto border border-gray-800">
                  <pre>{embedScriptCode}</pre>
                </div>
              </div>

              {/* Steps for GTM injection */}
              <div className="border-t border-[#ECECEC] pt-4">
                <h3 className="font-bold text-xs text-[#262626] mb-2">
                  3-Step Google Tag Manager (GTM) Setup:
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-600">
                  <li>Open your Google Tag Manager container for <strong>giftghor.world</strong>.</li>
                  <li>Click <strong>Tags → New</strong>, select <strong>Custom HTML Tag</strong>, and paste the snippet above.</li>
                  <li>Set the trigger to <strong>All Pages (Page View)</strong> and click <strong>Submit / Publish</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ----------------- TAB 7: SECURITY & PASSWORD ----------------- */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 max-w-md shadow-xs">
              <h2 className="font-bold text-base text-[#262626] mb-1 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#ECA548]" />
                Admin Authentication & Password
              </h2>
              <p className="text-xs text-gray-500 mb-6">
                Update the master administrator password for dashboard access.
              </p>

              {passFeedback?.success && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{passFeedback.success}</span>
                </div>
              )}

              {passFeedback?.error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{passFeedback.error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                    placeholder="giftghor2026"
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#262626' }}
                >
                  <Key className="w-3.5 h-3.5 text-[#ECA548]" />
                  <span>Update Password</span>
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
