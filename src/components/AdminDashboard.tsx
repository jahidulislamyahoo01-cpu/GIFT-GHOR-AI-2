import { AdminInsightsView } from "./AdminInsightsView";
import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  MessageSquare,
  MessageCircle,
  BookOpen,
  Palette,
  Code2, TrendingUp,
  Package,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  User,
  Users,
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
  Sliders, Settings, CreditCard, Mail,
  Copy,
  Check,
  Download,
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
  TeamMember,
} from '../types';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminAIAssistant } from './AdminAIAssistant';
import { AdminTeamView } from './AdminTeamView';
import { AdminWhatsAppView } from './AdminWhatsAppView';

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

  // 2-Step OTP Verification State
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // 2FA Admin Settings state for Security tab
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('giftghor6525@gmail.com');
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);


  // Integrations state
  const [hasGmailAppPassword, setHasGmailAppPassword] = useState(false);
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPasswordInput, setGmailAppPasswordInput] = useState('');
  const [hasSteadfastSecretKey, setHasSteadfastSecretKey] = useState(false);
  const [steadfastApiKey, setSteadfastApiKey] = useState('');
  const [steadfastSecretKeyInput, setSteadfastSecretKeyInput] = useState('');
  const [paystationMerchantIdInput, setPaystationMerchantIdInput] = useState('');
  const [paystationPasswordInput, setPaystationPasswordInput] = useState('');
  const [hasPaystationPassword, setHasPaystationPassword] = useState(false);
  const [facebookPageIdInput, setFacebookPageIdInput] = useState('');
  const [facebookAccessTokenInput, setFacebookAccessTokenInput] = useState('');
  const [hasFacebookAccessToken, setHasFacebookAccessToken] = useState(false);
  const [hasTelegramBotToken, setHasTelegramBotToken] = useState(false);
  const [telegramBotTokenInput, setTelegramBotTokenInput] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isDetectingTelegram, setIsDetectingTelegram] = useState(false);
  const [detectedChats, setDetectedChats] = useState<Array<{ id: string; title: string; type: string; isBotAdmin?: boolean }>>([]);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestFeedback, setEmailTestFeedback] = useState<{ success: boolean; message: string; diagnostic?: string } | null>(null);
  const [isUpdatingIntegrations, setIsUpdatingIntegrations] = useState(false);

  // Active Tab
  // Active Tab - Defaulting to 'orders' so admin can see customer orders immediately
  const [activeTab, setActiveTab] = useState<
    'orders' | 'inbox' | 'whatsapp' | 'ai-assistant' | 'knowledge' | 'products' | 'branding' | 'delivery' | 'embed' | 'integrations' | 'security' | 'insights' | 'team'
  >('orders');

  // Multi-user & Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: any;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('giftghor_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Strict check: ONLY superadmin has admin rights (staff never have isSuperAdmin=true)
  const isSuperAdmin = currentUser?.role === 'superadmin';

  // Auto-redirect staff members away from restricted superadmin-only tabs
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      const restrictedTabs = ['team', 'security', 'integrations', 'branding', 'embed', 'delivery'];
      if (restrictedTabs.includes(activeTab)) {
        if (currentUser.permissions?.canManageOrders) {
          setActiveTab('orders');
        } else if (currentUser.permissions?.canChat) {
          setActiveTab('inbox');
        } else if (currentUser.permissions?.canManageProducts) {
          setActiveTab('products');
        } else {
          setActiveTab('orders');
        }
      }
    }
  }, [currentUser, activeTab]);

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
  
  // New FAQ form state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState<'general' | 'delivery' | 'order' | 'payment' | 'customization'>('general');
  const [isAddingFaq, setIsAddingFaq] = useState(false);
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

  // Helper for localStorage knowledge backup
  const saveLocalKnowledgeBackup = (partial: {
    faqs?: KnowledgeFAQ[];
    uploadedFiles?: UploadedFile[];
    crawledPages?: CrawledPage[];
    deliveryPolicy?: DeliveryPolicy;
  }) => {
    try {
      const existingStr = localStorage.getItem('giftghor_knowledge_backup');
      const existing = existingStr ? JSON.parse(existingStr) : {};
      const updated = {
        ...existing,
        ...partial,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('giftghor_knowledge_backup', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save local knowledge backup', e);
    }
  };

  const [localBackupAvailable, setLocalBackupAvailable] = useState<{
    faqs?: KnowledgeFAQ[];
    uploadedFiles?: UploadedFile[];
    crawledPages?: CrawledPage[];
    deliveryPolicy?: DeliveryPolicy;
    timestamp?: string;
  } | null>(null);

  // Fetch full admin state
  const loadAdminState = async (token = authToken, isInitial = false, isPolling = false) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/state', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setAuthToken(null);
        setCurrentUser(null);
        localStorage.removeItem('giftghor_admin_token');
        localStorage.removeItem('giftghor_current_user');
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setSessions(data.sessions || {});
      if (data.teamMembers) setTeamMembers(data.teamMembers);
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
        localStorage.setItem('giftghor_current_user', JSON.stringify(data.currentUser));
      }
      
      const userIsSuper = data.currentUser?.role === 'superadmin';

      // Do not overwrite user input fields during background polling
      if (!isPolling) {
        setBranding(data.branding);
        setDeliveryPolicy(data.deliveryPolicy);
        setProducts(data.products || []);
        setCrawledPages(data.crawledPages || []);
        setUploadedFiles(data.uploadedFiles || []);
        setFaqs(data.faqs || []);

        if (userIsSuper) {
          // Fetch 2FA security settings - Super Admin only
          fetch('/api/admin/security', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((secData) => {
              if (secData && !secData.error) {
                setTwoFactorEnabled(!!secData.twoFactorEnabled);
                if (secData.twoFactorEmail) setTwoFactorEmail(secData.twoFactorEmail);
                setSmtpConfigured(!!secData.smtpConfigured);
              }
            })
            .catch(() => {});

          // Fetch Integrations - Super Admin only
          fetch('/api/admin/integrations', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((intData) => {
              if (intData && !intData.error) {
                setHasGmailAppPassword(intData.hasGmailAppPassword);
                setGmailUser(intData.gmailUser);
                setHasSteadfastSecretKey(intData.hasSteadfastSecretKey);
                setSteadfastApiKey(intData.steadfastApiKey);
                setHasTelegramBotToken(!!intData.hasTelegramBotToken);
                setTelegramChatId(intData.telegramChatId || '');
                setWhatsappNumber(intData.whatsappNumber || '');
              }
            })
            .catch(() => {});
        }

        // Auto-backup to browser localStorage when data is populated
        if (data.faqs && data.faqs.length > 0) {
          saveLocalKnowledgeBackup({
            faqs: data.faqs,
            uploadedFiles: data.uploadedFiles,
            crawledPages: data.crawledPages,
            deliveryPolicy: data.deliveryPolicy,
          });
        }
      }

      // On initial load, check if local storage has a backup with more FAQs than the server
      if (isInitial) {
        const sessionKeys = Object.keys(data.sessions || {});
        if (sessionKeys.length > 0) {
          setSelectedSessionId(sessionKeys[0]);
        }

        try {
          const localStr = localStorage.getItem('giftghor_knowledge_backup');
          if (localStr) {
            const localObj = JSON.parse(localStr);
            if (localObj && localObj.faqs && localObj.faqs.length > (data.faqs?.length || 0)) {
              setLocalBackupAvailable(localObj);
            }
          }
        } catch (e) {}
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

      if (res.ok) {
        if (data.requiresOtp) {
          setRequiresOtp(true);
          setTempToken(data.tempToken);
          setOtpTargetEmail(data.targetEmail || 'giftghor6525@gmail.com');
          setDebugOtp(data.debugOtp || null);
          showToast('Verification code sent to your email');
        } else if (data.success && data.token) {
          setAuthToken(data.token);
          if (data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('giftghor_current_user', JSON.stringify(data.user));
          }
          localStorage.setItem('giftghor_admin_token', data.token);
          showToast(data.message || (data.user ? `Welcome back, ${data.user.name}!` : 'Welcome back, Admin!'));
          loadAdminState(data.token);
        } else {
          setLoginError(data.error || 'Invalid credentials');
        }
      } else {
        setLoginError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      setLoginError('Server connection failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Verify OTP for 2-Step Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setIsVerifyingOtp(true);

    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, otp: otpInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setAuthToken(data.token);
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('giftghor_current_user', JSON.stringify(data.user));
        }
        localStorage.setItem('giftghor_admin_token', data.token);
        showToast('2-Step Verification confirmed! Welcome Admin!');
        setRequiresOtp(false);
        setOtpInput('');
        loadAdminState(data.token);
      } else {
        setOtpError(data.error || 'Invalid or expired verification code');
      }
    } catch (err) {
      setOtpError('Verification connection failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Toggle 2FA in Security settings
  const handleToggle2FA = async (enabled: boolean) => {
    setIsUpdatingSecurity(true);
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ twoFactorEnabled: enabled, twoFactorEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTwoFactorEnabled(enabled);
        showToast(data.message || (enabled ? '2-Step Verification enabled!' : '2-Step Verification disabled!'));
      } else {
        showToast(data.error || 'Failed to update 2-Step Verification');
      }
    } catch (e) {
      showToast('Failed to update security settings');
    } finally {
      setIsUpdatingSecurity(false);
    }
  };


  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingIntegrations(true);
    try {
      const payload: any = {
        gmailUser,
        steadfastApiKey,
        telegramChatId,
        whatsappNumber,
      };
      if (gmailAppPasswordInput) payload.gmailAppPassword = gmailAppPasswordInput;
      if (steadfastSecretKeyInput) payload.steadfastSecretKey = steadfastSecretKeyInput;
      if (telegramBotTokenInput) payload.telegramBotToken = telegramBotTokenInput;

      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Integrations updated and synced to Firestore successfully!');
        if (gmailAppPasswordInput) {
          setHasGmailAppPassword(true);
          setGmailAppPasswordInput('');
        }
        if (steadfastSecretKeyInput) {
          setHasSteadfastSecretKey(true);
          setSteadfastSecretKeyInput('');
        }
        if (telegramBotTokenInput) {
          setHasTelegramBotToken(true);
          setTelegramBotTokenInput('');
        }
        if (paystationPasswordInput) {
          setHasPaystationPassword(true);
          setPaystationPasswordInput('');
        }
        if (facebookAccessTokenInput) {
          setHasFacebookAccessToken(true);
          setFacebookAccessTokenInput('');
        }
      } else {
        showToast(data.error || 'Failed to update integrations');
      }
    } catch (e) {
      showToast('Network error while saving integrations');
    } finally {
      setIsUpdatingIntegrations(false);
    }
  };

  const handleDetectTelegramChats = async () => {
    setIsDetectingTelegram(true);
    try {
      const res = await fetch('/api/admin/telegram/detect-chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          botToken: telegramBotTokenInput || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.chats && data.chats.length > 0) {
        setDetectedChats(data.chats);
        showToast(`✅ ${data.chats.length}টি চ্যাট / গ্রুপ পাওয়া গেছে! নিচে ক্লিক করে চয়েস করুন।`);
      } else {
        showToast(data.error || 'কোনো চ্যাট পাওয়া যায়নি। টেলিগ্রাম গ্রুপে বা বটে যেকোনো একটি মেসেজ পাঠিয়ে আবার ক্লিক করুন।');
      }
    } catch (e) {
      showToast('টেলিগ্রাম চ্যাট ডিটেক্ট করতে সমস্যা হয়েছে');
    } finally {
      setIsDetectingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      const res = await fetch('/api/admin/telegram/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          botToken: telegramBotTokenInput || undefined,
          chatId: telegramChatId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.savedChatId && data.savedChatId !== telegramChatId) {
          setTelegramChatId(data.savedChatId);
        }
        showToast(data.message || '✅ Test notification sent! Check your Telegram on your phone.');
      } else {
        showToast(data.error || 'Failed to send Telegram test message');
      }
    } catch (e) {
      showToast('Connection error sending test alert');
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestFeedback(null);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          gmailUser: gmailUser || undefined,
          gmailAppPassword: gmailAppPasswordInput || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailTestFeedback({
          success: true,
          message: data.message || '✅ Test email sent successfully! Check your inbox.',
        });
        showToast('✅ Test email sent! Check your Gmail inbox.');
        setHasGmailAppPassword(true);
      } else {
        setEmailTestFeedback({
          success: false,
          message: data.error || 'Failed to send test email',
          diagnostic: data.diagnostic || 'Please verify your Gmail address and 16-character App Password.',
        });
        showToast(data.diagnostic || data.error || 'Failed to send test email');
      }
    } catch (e) {
      setEmailTestFeedback({
        success: false,
        message: 'Connection error while testing Gmail',
        diagnostic: 'ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।',
      });
      showToast('Connection error sending test email');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('giftghor_admin_token');
    localStorage.removeItem('giftghor_current_user');
    setSelectedSessionId(null);
    setRequiresOtp(false);
    setOtpInput('');
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
        saveLocalKnowledgeBackup({ crawledPages: data.crawledPages });
        setCrawlUrl('');
      } else {
        showToast(data.error || 'Crawling failed');
      }
    } catch (err) {
      showToast('Crawling failed');
    } finally {
      setIsCrawling(false);
    }
  };

  // Delete Crawled Page
  const handleDeleteCrawledPage = async (id: string) => {
    if (!confirm('Are you sure you want to remove this indexed page from knowledge?')) return;
    try {
      const res = await fetch(`/api/admin/crawled-pages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCrawledPages(data.crawledPages);
        showToast('Indexed page removed');
        saveLocalKnowledgeBackup({ crawledPages: data.crawledPages });
      } else {
        showToast('Failed to delete crawled page');
      }
    } catch (e) {
      showToast('Error deleting crawled page');
    }
  };

  // Trigger File Upload Knowledge
  const handleDeleteUploadedFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this uploaded knowledge?')) return;
    try {
      const res = await fetch(`/api/admin/uploaded-files/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadedFiles(data.uploadedFiles);
        showToast('File deleted successfully');
        saveLocalKnowledgeBackup({ uploadedFiles: data.uploadedFiles });
      } else {
        showToast('Error deleting file');
      }
    } catch (e) {
      showToast('Error deleting file');
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    setIsAddingFaq(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ question: newFaqQuestion, answer: newFaqAnswer, category: newFaqCategory }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFaqs(data.faqs);
        showToast('FAQ added and saved successfully!');
        setNewFaqQuestion('');
        setNewFaqAnswer('');
        saveLocalKnowledgeBackup({ faqs: data.faqs });
      } else {
        showToast('Failed to save FAQ');
      }
    } catch (e) {
      showToast('Error adding FAQ');
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFaqs(data.faqs);
        showToast('FAQ deleted successfully');
        saveLocalKnowledgeBackup({ faqs: data.faqs });
      } else {
        showToast('Error deleting FAQ');
      }
    } catch (e) {
      showToast('Error deleting FAQ');
    }
  };

  const handleUploadKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!uploadRawText.trim() && !uploadFileName.trim()) {
      showToast('Please select a file or provide text content');
      return;
    }
    setIsUploading(true);

    const name = uploadFileName.trim() || `giftghor_source_${Date.now()}.${uploadFileType}`;
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
        saveLocalKnowledgeBackup({ uploadedFiles: data.uploadedFiles });
      } else {
        showToast('Upload failed');
      }
    } catch (err) {
      showToast('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Export Knowledge & System Backup to downloadable JSON
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup/export', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `giftghor_knowledge_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Knowledge backup file downloaded successfully!');
    } catch (e) {
      showToast('Failed to export backup');
    }
  };

  // Import / Restore Backup JSON File to Server
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!confirm(`Restore ${parsed.faqs?.length || 0} FAQs, ${parsed.uploadedFiles?.length || 0} files, and settings to the server?`)) return;
        const res = await fetch('/api/admin/backup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
          body: JSON.stringify(parsed),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setFaqs(data.faqs || []);
          setUploadedFiles(data.uploadedFiles || []);
          setCrawledPages(data.crawledPages || []);
          if (data.deliveryPolicy) setDeliveryPolicy(data.deliveryPolicy);
          if (data.branding) setBranding(data.branding);
          setLocalBackupAvailable(null);
          showToast('Knowledge base successfully restored and saved to server!');
          saveLocalKnowledgeBackup({
            faqs: data.faqs,
            uploadedFiles: data.uploadedFiles,
            crawledPages: data.crawledPages,
            deliveryPolicy: data.deliveryPolicy,
          });
        } else {
          showToast('Failed to restore backup');
        }
      } catch (err) {
        showToast('Invalid backup file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Restore local browser backup to server
  const handleRestoreLocalBackup = async () => {
    if (!localBackupAvailable) return;
    try {
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(localBackupAvailable),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFaqs(data.faqs || []);
        setUploadedFiles(data.uploadedFiles || []);
        setCrawledPages(data.crawledPages || []);
        if (data.deliveryPolicy) setDeliveryPolicy(data.deliveryPolicy);
        setLocalBackupAvailable(null);
        showToast('Browser backup successfully restored to server!');
      } else {
        showToast('Failed to restore local backup');
      }
    } catch (e) {
      showToast('Error restoring local backup');
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
      const data = await res.json();
      if (res.ok && data.success) {
        setDeliveryPolicy(data.deliveryPolicy);
        showToast('Delivery rules & notices updated!');
        saveLocalKnowledgeBackup({ deliveryPolicy: data.deliveryPolicy });
      } else {
        showToast('Failed to update delivery policy');
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
      const data = await res.json();
      if (res.ok && data.success) {
        setBranding(data.branding);
        showToast('Branding settings saved!');
      } else {
        showToast('Failed to save branding');
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
  // VIEW: Protected Login Screen (with 2-Step Verification OTP)
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

          {requiresOtp ? (
            /* 2-Step Verification OTP View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Lock className="w-4 h-4 text-[#ECA548]" />
                  2-Step Verification Required
                </p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  A 6-digit security code was dispatched to:
                  <strong className="block text-amber-950 font-mono text-[11px] mt-0.5">{otpTargetEmail}</strong>
                </p>
              </div>

              {debugOtp && (
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
                  <span className="text-[11px]">Preview verification code:</span>
                  <span className="font-mono font-bold tracking-widest text-sm bg-sky-100 px-2 py-0.5 rounded text-sky-800">
                    {debugOtp}
                  </span>
                </div>
              )}

              {otpError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#262626] mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono tracking-widest font-bold bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length < 6}
                  className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  {isVerifyingOtp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Verify Code & Enter Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiresOtp(false);
                    setOtpInput('');
                    setOtpError('');
                  }}
                  className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-1"
                >
                  ← Back to username & password
                </button>
              </form>
            </div>
          ) : (
            /* Standard Secure Login View (No default credentials hint shown) */
            <>
              {loginError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#262626] mb-1">
                    Username or Gmail
                  </label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    required
                    className="w-full text-sm bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-3 focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
                    placeholder="admin or your team member Gmail"
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
                    placeholder="Enter your password"
                  />
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
            </>
          )}

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
                {currentUser ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold border shrink-0 ${
                    currentUser.role === 'superadmin'
                      ? 'bg-[#FDF7EE] text-[#ECA548] border-[#ECA548]/30'
                      : currentUser.role === 'moderator'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {currentUser.role.toUpperCase()}: {currentUser.name}
                  </span>
                ) : (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-semibold bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30 shrink-0">
                    PROD-SECURE
                  </span>
                )}
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 hidden sm:block line-clamp-1">
                {currentUser?.email ? `Signed in as ${currentUser.email} • ` : ''}gemini-2.5-flash AI Engine • giftghor.world
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
          {/* Quick sync button - Super Admin or Knowledge Managers only */}
          {(isSuperAdmin || currentUser?.permissions?.canManageKnowledge) && (
            <button
              onClick={handleSyncAndRetrain}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[#ECA548] text-[#ECA548] hover:bg-[#FDF7EE] transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Syncing...' : 'Sync & Re-train AI'}</span>
            </button>
          )}

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

            {/* Orders Management Tab */}
            {(isSuperAdmin || currentUser?.permissions?.canManageOrders || !currentUser) && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'orders'
                    ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Orders & Leads</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#262626] text-white">
                  AUTO
                </span>
              </button>
            )}

            {/* Live Chat Inbox */}
            {(isSuperAdmin || currentUser?.permissions?.canChat || !currentUser) && (
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
            )}

            {/* WhatsApp Bot Integration */}
            {(isSuperAdmin || currentUser?.permissions?.canChat || !currentUser) && (
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'whatsapp'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Bot Connect</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  NEW
                </span>
              </button>
            )}

            {/* AI Assistant - Super Admin or Knowledge Managers */}
            {(isSuperAdmin || currentUser?.permissions?.canManageKnowledge) && (
              <button
                onClick={() => setActiveTab('ai-assistant')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'ai-assistant'
                    ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#ECA548]" />
                  <span>AI Assistant (New)</span>
                </div>
              </button>
            )}

            {/* Knowledge Base - Super Admin or Knowledge Managers */}
            {(isSuperAdmin || currentUser?.permissions?.canManageKnowledge) && (
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
            )}

            {/* Products - Super Admin or Product Managers */}
            {(isSuperAdmin || currentUser?.permissions?.canManageProducts) && (
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
            )}

            {/* Delivery Policies - Super Admin only */}
            {isSuperAdmin && (
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
            )}

            {/* Insights - Super Admin or Orders Managers */}
            {(isSuperAdmin || currentUser?.permissions?.canManageOrders) && (
              <button
                onClick={() => setActiveTab('insights')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'insights'
                    ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Insights & Analytics
              </button>
            )}

            {/* Team Access Management Tab - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'team'
                    ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30 font-bold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#ECA548]" />
                  <span>Team & User Access</span>
                </div>
                {teamMembers.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {teamMembers.length}
                  </span>
                )}
              </button>
            )}

            {/* Widget Branding - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
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
            )}

            {/* GTM / Embed - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
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
            )}

            {/* Integrations Tab - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('integrations')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'integrations'
                    ? 'bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>Integrations (API)</span>
                </div>
              </button>
            )}
            
            {/* Security Tab - SUPER ADMIN ONLY */}
            {isSuperAdmin && (
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
            )}
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
                <span className="font-mono text-gray-700">v{stats.trainingVersion || "v1" || 1}</span>
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

          {/* ----------------- TAB 0: ORDERS & CAPTURED LEADS ----------------- */}
          {activeTab === 'orders' && (
            <AdminOrdersView authToken={authToken} showToast={showToast} />
          )}

          {/* ----------------- TAB: WHATSAPP BOT CONNECT ----------------- */}
          {activeTab === 'whatsapp' && (
            <AdminWhatsAppView authToken={authToken} showToast={showToast} />
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
                              {sess.needsAttention && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  ALERT
                                </span>
                              )}
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

                  {/* Attention Alert Banner if customer asked about order issues or live contact */}
                  {currentSession.needsAttention && (
                    <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🚨</span>
                        <div>
                          <strong className="font-bold">Customer requested direct contact / order help:</strong>
                          <span className="ml-1 text-amber-800">
                            The bot provided your store helpline. You can also take over to chat directly below.
                          </span>
                        </div>
                      </div>
                      {currentSession.mode !== 'admin_takeover' && (
                        <button
                          onClick={() => handleToggleTakeover(currentSession.id, 'admin_takeover')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 ml-2"
                        >
                          Reply Live
                        </button>
                      )}
                    </div>
                  )}

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
                      
                      {(currentSession.orderExtracted as any).status === 'Sent' ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-bold bg-emerald-100 px-2 py-1 rounded">
                            ✅ Order Created successfully!
                          </span>
                          {(currentSession.orderExtracted as any).steadfastTrackingCode && (
                            <span className="text-gray-500 font-mono">
                              Tracking ID: {(currentSession.orderExtracted as any).steadfastTrackingCode}
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
                                  ? '👤 Customer'
                                  : isAdmin
                                  ? '🛡️ You (Admin)'
                                  : '🤖 Gift Ghor AI Bot'}
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

          {/* ----------------- TAB: AI ASSISTANT ----------------- */}
          {activeTab === 'ai-assistant' && (
            <AdminAIAssistant />
          )}

          {/* ----------------- TAB 2: KNOWLEDGE BASE & TRAINING ----------------- */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6 max-w-5xl">
              {/* Top Banner with Re-train button & Backup options */}
              <div className="bg-[#FDF7EE] rounded-2xl border border-[#ECA548]/30 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#ECA548]" />
                      Multi-Source Knowledge Base & Training Manager
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Auto-Saved & Protected
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Crawl URLs, upload XML/CSV catalog feeds, and synchronize delivery rules into the unified Gemini 2.5 Flash context. All knowledge is permanently saved to server disk & mirrored backups.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    title="Download JSON backup of all FAQs, files, and rules"
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white text-gray-700 border border-[#ECECEC] hover:bg-gray-50 shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                    <span>Export Backup</span>
                  </button>
                  <label
                    title="Restore knowledge from a previously downloaded JSON file"
                    className="cursor-pointer px-3.5 py-2.5 rounded-xl font-bold text-xs bg-white text-gray-700 border border-[#ECECEC] hover:bg-gray-50 shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-gray-600" />
                    <span>Restore Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackupFile}
                      className="hidden"
                    />
                  </label>
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
              </div>

              {/* Local Backup Alert Banner */}
              {localBackupAvailable && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">
                        Browser Backup Available ({localBackupAvailable.faqs?.length || 0} FAQs, {localBackupAvailable.uploadedFiles?.length || 0} files)
                      </p>
                      <p className="text-[11px] text-amber-700">
                        We detected knowledge saved locally in your browser cache. Would you like to restore it to the server?
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleRestoreLocalBackup}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Restore to Server
                    </button>
                    <button
                      onClick={() => setLocalBackupAvailable(null)}
                      className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-600 font-medium rounded-lg text-xs border border-gray-200 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {syncFeedback && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncFeedback}</span>
                </div>
              )}

              {/* Sub-section 1: Website Crawler */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#ECA548]" />
                    <h3 className="font-bold text-sm text-[#262626]">
                      Website URL & Sitemap Crawler
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {crawledPages.length} source(s) indexed
                  </span>
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
                        <th className="px-4 py-2.5 text-right">Action</th>
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
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteCrawledPage(c.id)}
                              title="Delete crawled page"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {crawledPages.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">
                            No crawled pages indexed yet. Enter a URL or sitemap above to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-section 2: File & XML Feed Upload */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#ECA548]" />
                    <h3 className="font-bold text-sm text-[#262626]">
                      File & XML Product Feed Upload
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {uploadedFiles.length} file(s) uploaded
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Upload XML Google Shopping product feeds, catalog CSVs, text notes, or brochure documents. Data is parsed and saved permanently to server storage.
                </p>

                <form onSubmit={handleUploadKnowledge} className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Feed / Document Type
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
                    <div className="md:col-span-2">
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

                  {/* Direct File Picker Input */}
                  <div className="p-3 border border-dashed border-[#ECECEC] hover:border-[#ECA548] rounded-xl bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#ECA548]" />
                      <span className="text-xs text-gray-600">Choose file from your device (.txt, .csv, .xml, .json, .pdf):</span>
                    </div>
                    <input
                      type="file"
                      accept=".txt,.csv,.xml,.json,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadFileName(file.name);
                          const ext = file.name.split('.').pop()?.toLowerCase();
                          if (ext === 'xml') setUploadFileType('xml');
                          else if (ext === 'csv') setUploadFileType('csv');
                          else if (ext === 'pdf') setUploadFileType('pdf');
                          else setUploadFileType('txt');

                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setUploadRawText((ev.target?.result as string) || '');
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#ECA548] file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Raw Content / Snippet (Or paste text directly)
                    </label>
                    <textarea
                      rows={3}
                      value={uploadRawText}
                      onChange={(e) => setUploadRawText(e.target.value)}
                      placeholder="Paste text notes, policies, or XML/CSV snippet here..."
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl p-3 font-mono text-[#262626]"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" style={{ color: '#ECA548' }} />
                      Pay Station (Payment Gateway)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Merchant ID / Store ID
                        </label>
                        <input
                          type="text"
                          value={paystationMerchantIdInput}
                          onChange={(e) => setPaystationMerchantIdInput(e.target.value)}
                          placeholder="Enter Merchant ID"
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Password / Secret Key
                        </label>
                        <input
                          type="password"
                          value={paystationPasswordInput}
                          onChange={(e) => setPaystationPasswordInput(e.target.value)}
                          placeholder={hasPaystationPassword ? "•••••••••••• (Leave blank to keep current)" : "Enter Password"}
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 mb-3 flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" style={{ color: '#ECA548' }}>
                        <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                      </svg>
                      Facebook Page Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Facebook Page ID
                        </label>
                        <input
                          type="text"
                          value={facebookPageIdInput}
                          onChange={(e) => setFacebookPageIdInput(e.target.value)}
                          placeholder="e.g. 123456789012345"
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Page Access Token
                        </label>
                        <input
                          type="password"
                          value={facebookAccessTokenInput}
                          onChange={(e) => setFacebookAccessTokenInput(e.target.value)}
                          placeholder={hasFacebookAccessToken ? "•••••••••••• (Leave blank to keep current)" : "Enter Long-Lived Token"}
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5"
                    style={{ backgroundColor: '#ECA548' }}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading & Parsing...' : 'Upload & Parse Source'}</span>
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
                        <FileText className="w-5 h-5 text-[#ECA548] shrink-0" />
                        <div>
                          <p className="font-bold text-xs text-[#262626]">{f.fileName}</p>
                          <p className="text-[11px] text-gray-500">{f.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-[#ECECEC] text-gray-600">
                          {f.fileType}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteUploadedFile(f.id)}
                          title="Delete file"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {uploadedFiles.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">No uploaded files or documents yet.</p>
                  )}
                </div>
              </div>

              {/* Sub-section 3: FAQs & Quick Q&A Knowledge */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#ECA548]" />
                    <h3 className="font-bold text-sm text-[#262626]">
                      Frequently Asked Questions & Text Data
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {faqs.length} FAQ(s) saved
                  </span>
                </div>

                <form onSubmit={handleAddFaq} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-gray-700">Add New Text Data / FAQ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Question / Title (e.g. ডেলিভারি চার্জ কত?)" 
                      value={newFaqQuestion} 
                      onChange={(e) => setNewFaqQuestion(e.target.value)} 
                      className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]" 
                    />
                    <select 
                      value={newFaqCategory} 
                      onChange={(e) => setNewFaqCategory(e.target.value as any)}
                      className="text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]"
                    >
                      <option value="general">General</option>
                      <option value="delivery">Delivery</option>
                      <option value="order">Order Info</option>
                      <option value="payment">Payment</option>
                      <option value="customization">Customization</option>
                    </select>
                  </div>
                  <textarea 
                    placeholder="Answer / Text Content (Paste complete details here, instantly saved to database)" 
                    rows={3}
                    value={newFaqAnswer} 
                    onChange={(e) => setNewFaqAnswer(e.target.value)} 
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800 focus:outline-none focus:border-[#ECA548]" 
                  />
                  <button
                    type="submit"
                    disabled={isAddingFaq}
                    className="bg-[#ECA548] text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingFaq ? 'Saving FAQ...' : 'Save Knowledge / FAQ'}</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="p-4 rounded-xl border border-[#ECECEC] bg-white hover:border-[#ECA548]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-xs text-[#262626] mb-1">Q: {faq.question}</p>
                        <button
                          type="button"
                          onClick={() => handleDeleteFaq(faq.id)}
                          title="Delete FAQ"
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">A: {faq.answer}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="uppercase font-semibold text-[#ECA548]">
                          Category: {faq.category}
                        </span>
                        <span>Saved: {new Date(faq.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {faqs.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No FAQs added yet. Use the form above to add your first knowledge question.</p>
                  )}
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

          {/* ----------------- TAB: INSIGHTS & ANALYTICS ----------------- */}
          {activeTab === 'insights' && (
            <AdminInsightsView authToken={authToken} />
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


          {/* ----------------- TAB 8: INTEGRATIONS ----------------- */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 shadow-xs space-y-6">
                <div>
                  <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#ECA548]" />
                    Third-Party Integrations
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Manage your email configuration for notifications and courier API for order fulfillment.
                  </p>
                </div>

                <form onSubmit={handleSaveIntegrations} className="space-y-6">
                  {/* Telegram Instant Mobile Notifications Section */}
                  <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
                          TG
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#262626]">
                            Telegram Instant Mobile Alerts (মোবাইলে সরাসরি নোটিফিকেশন)
                          </h3>
                          <p className="text-[11px] text-gray-500">
                            ওয়েবসাইটে কাস্টমার মেসেজ দিলে, অর্ডার করলে বা হেল্প চাইলে সাথে সাথে আপনার মোবাইলে সাউন্ডসহ পুশ নোটিফিকেশন আসবে।
                          </p>
                        </div>
                      </div>
                      {(hasTelegramBotToken || telegramBotTokenInput) && telegramChatId && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Telegram Bot Token
                        </label>
                        <input
                          type="password"
                          value={telegramBotTokenInput}
                          onChange={(e) => setTelegramBotTokenInput(e.target.value)}
                          placeholder={hasTelegramBotToken ? "•••••••••••• (Leave blank to keep current)" : "e.g. 7123456789:AAH..."}
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-gray-700">
                            Telegram Chat ID(s) বা Group ID
                          </label>
                          <button
                            type="button"
                            onClick={handleDetectTelegramChats}
                            disabled={isDetectingTelegram}
                            className="text-[10px] text-sky-700 font-semibold bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {isDetectingTelegram ? 'Detecting...' : '🔍 Auto-Detect Group / Chat ID'}
                          </button>
                        </div>
                        <input
                          type="text"
                          value={telegramChatId}
                          onChange={(e) => setTelegramChatId(e.target.value)}
                          placeholder="e.g. Group: -5487582348 অথবা Personal: 8032148453"
                          className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626] font-mono"
                        />

                        {/* Detected chats selector if any found */}
                        {detectedChats.length > 0 && (
                          <div className="mt-2 p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-xs space-y-1.5">
                            <span className="font-semibold text-sky-900 text-[11px] block">
                              🎯 ডিটেক্ট হওয়া চ্যাটসমূহ (ক্লিক করলেই সেট হয়ে যাবে):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {detectedChats.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setTelegramChatId(c.id)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    telegramChatId === c.id
                                      ? 'bg-sky-600 text-white'
                                      : 'bg-white text-sky-800 border border-sky-300 hover:bg-sky-100'
                                  }`}
                                >
                                  {c.type === 'group' || c.type === 'supergroup' ? '🏷️ Group: ' : '👤 Private: '}
                                  {c.title} ({c.id})
                                </button>
                              ))}
                              {detectedChats.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setTelegramChatId(detectedChats.map(c => c.id).join(', '))}
                                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                                >
                                  👥 গ্রুপ + পার্সোনাল দুটোতেই ({detectedChats.map(c => c.id).join(', ')})
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-500 mt-1">
                          💡 <strong>জরুরি নিয়ম:</strong> টেলিগ্রাম গ্রুপের আইডির শুরুতে অবশ্যই একটি <strong>মাইনাস (-) চিহ্ন</strong> থাকতে হয় (যেমন: <code>-5487582348</code>)। মাইনাস ছাড়া শুধু নম্বর দিলে টেলিগ্রাম গ্রুপ খুঁজে পায় না।
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={isTestingTelegram}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        {isTestingTelegram ? 'Sending Test...' : '📱 Send Test Alert to My Phone (টেস্ট মেসেজ পাঠান)'}
                      </button>
                      <span className="text-[10px] text-sky-800 italic">
                        * টোকেন ও চ্যাট আইডি সেভ করার আগে বা পরে টেস্ট করুন
                      </span>
                    </div>

                    {/* How-to guide */}
                    <div className="bg-white/80 rounded-lg p-3 text-[11px] text-gray-600 border border-sky-100 space-y-2">
                      <p className="font-bold text-gray-800">📌 টেলিগ্রাম গ্রুপ নোটিফিকেশন সেটআপের সঠিক নিয়ম:</p>
                      <div className="space-y-1">
                        <p className="font-semibold text-sky-900">🔹 গ্রুপে পাঠানোর নিয়ম (একসাথে পুরো সাপোর্ট টিম পাবে):</p>
                        <p>১. টেলিগ্রামে আপনার সাপোর্ট টিমের মেম্বারদের নিয়ে একটি <strong>Group</strong> বানান (যেমন: <i>Gift Ghor Support</i>)।</p>
                        <p>২. আপনার বট <strong>@gift_ghor_alert_bot</strong> কে গ্রুপে <strong>Add</strong> করুন এবং অ্যাডমিন বানান।</p>
                        <p>৩. গ্রুপে যেকোনো একটি টেস্ট মেসেজ পাঠান (যেমন: <i>hello</i>)।</p>
                        <p>৪. উপরের <strong>"🔍 Auto-Detect Group / Chat ID"</strong> বাটনে ক্লিক করলেই গ্রুপ আইডি <code>-5487582348</code> স্বয়ংক্রিয়ভাবে খুঁজে পেয়ে যাবে!</p>
                      </div>
                      <div className="space-y-1 pt-1 border-t border-sky-100">
                        <p className="font-semibold text-sky-900">🔹 একাধিক চ্যাটে একসাথে পাঠানোর নিয়ম:</p>
                        <p>গ্রুপ আইডি ও ব্যক্তিগত চ্যাট আইডি কমা (,) দিয়ে দিন: <code>-5487582348, 8032148453</code>। তাহলে গ্রুপে এবং পার্সোনালি সবার কাছে নোটিফিকেশন পৌঁছাবে!</p>
                      </div>
                    </div>
                  </div>

                  {/* Official Store WhatsApp & Helpline Section */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#262626]">
                          Official WhatsApp / Support Helpline (সরাসরি কাস্টমার হেল্পলাইন)
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          কাস্টমার ডেলিভারি বিলম্ব, রিটার্ন বা সরাসরি কথা বলতে চাইলে চ্যাটবট এই নম্বর ও চ্যাট লিংক কাস্টমারকে দেবে।
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        WhatsApp / Contact Mobile Number
                      </label>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="e.g. 01799949455"
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                  </div>

                  {/* Gmail Section */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#ECA548] text-white flex items-center justify-center font-bold text-xs">
                          ✉️
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-[#262626]">Gmail Notifications & 16-Digit App Password</h3>
                          <p className="text-[11px] text-gray-500">
                            নতুন অর্ডার বা কাস্টমার মেসেজ আসলে সরাসরি অ্যাডমিনের জিমেইলে ইনস্ট্যান্ট নোটিফিকেশন পাঠাতে।
                          </p>
                        </div>
                      </div>
                      {hasGmailAppPassword && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Password Saved
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Gmail Address (যে ইমেইল থেকে নোটিফিকেশন যাবে)
                      </label>
                      <input
                        type="email"
                        value={gmailUser}
                        onChange={(e) => setGmailUser(e.target.value)}
                        placeholder="giftghor6525@gmail.com"
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-gray-700">
                          Google 16-Digit App Password (১৬ অক্ষরের অ্যাপ পাসওয়ার্ড)
                        </label>
                        <a
                          href="https://myaccount.google.com/apppasswords"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-[#ECA548] hover:underline"
                        >
                          🔗 Generate App Password ↗
                        </a>
                      </div>
                      <input
                        type="password"
                        value={gmailAppPasswordInput}
                        onChange={(e) => setGmailAppPasswordInput(e.target.value)}
                        placeholder={hasGmailAppPassword ? "•••••••••••• (Leave blank to keep current saved password)" : "১৬ অক্ষরের App Password পেস্ট করুন (যেমন: abcd efgh ijkl mnop)"}
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        💡 স্পেস সহ বা স্পেস ছাড়া (১৬ অক্ষর) পেস্ট করলেও সিস্টেম স্বয়ংক্রিয়ভাবে ক্লিন করে নেবে।
                      </p>
                    </div>

                    {/* Test feedback */}
                    {emailTestFeedback && (
                      <div className={`p-3 rounded-xl text-xs space-y-1 ${
                        emailTestFeedback.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                      }`}>
                        <p className="font-bold">{emailTestFeedback.message}</p>
                        {emailTestFeedback.diagnostic && (
                          <p className="text-[11px] opacity-90">{emailTestFeedback.diagnostic}</p>
                        )}
                      </div>
                    )}

                    {/* Test Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={isTestingEmail}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#262626] hover:bg-[#3d3d3d] text-white transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#ECA548]" />
                        <span>{isTestingEmail ? 'Testing Connection...' : '📧 Send Test Email (টেস্ট ইমেইল পাঠান)'}</span>
                      </button>
                      <span className="text-[10px] text-gray-500 italic">
                        * নোটিফিকেশন যাবে giftghor6525@gmail.com এবং jahidulislammozumder@outlook.com-এ
                      </span>
                    </div>

                    {/* Explanation Box */}
                    <div className="bg-white/80 rounded-lg p-3 text-[11px] text-gray-700 border border-amber-200 space-y-1.5">
                      <p className="font-bold text-gray-900">⚠️ সাধারণ জিমেইল পাসওয়ার্ড কেন কাজ করে না?</p>
                      <p>
                        গুগলের নিরাপত্তা নিয়মানুযায়ী সাধারণ ইমেইল পাসওয়ার্ড দিয়ে স্বয়ংক্রিয় সফটওয়্যার লগইন করতে পারে না (Google Error 534)। এর সমাধান খুবই সহজ:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-gray-600">
                        <li>আপনার Google একাউন্টে <strong>2-Step Verification</strong> চালু আছে কিনা দেখুন।</li>
                        <li>এরপর সরাসরি যান: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">myaccount.google.com/apppasswords</a></li>
                        <li>App name দিন <strong>Gift Ghor</strong> এবং <strong>Create</strong>-এ চাপুন।</li>
                        <li>গুগল আপনাকে <strong>১৬ অক্ষরের একটি App Password</strong> দেবে (যেমন: <code>abcd efgh ijkl mnop</code>)।</li>
                        <li>সেই ১৬ অক্ষরের পাসওয়ার্ডটি এখানে দিয়ে "Send Test Email"-এ চাপুন। ব্যাস, সাথে সাথে ভেরিফাই হয়ে যাবে!</li>
                      </ol>
                    </div>
                  </div>

                  {/* Steadfast Courier Section */}
                  <div className="p-4 rounded-xl border border-[#ECECEC] bg-gray-50 space-y-4">
                    <h3 className="font-bold text-sm text-[#262626]">Steadfast Courier API (For Order Fulfillment)</h3>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Steadfast API Key
                      </label>
                      <input
                        type="text"
                        value={steadfastApiKey}
                        onChange={(e) => setSteadfastApiKey(e.target.value)}
                        placeholder="Enter API Key"
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Steadfast Secret Key
                      </label>
                      <input
                        type="password"
                        value={steadfastSecretKeyInput}
                        onChange={(e) => setSteadfastSecretKeyInput(e.target.value)}
                        placeholder={hasSteadfastSecretKey ? "•••••••••••• (Leave blank to keep current)" : "Enter Secret Key"}
                        className="w-full text-xs bg-white border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingIntegrations}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-95"
                    style={{ backgroundColor: '#ECA548' }}
                  >
                    {isUpdatingIntegrations ? 'Saving...' : 'Save Integrations to Cloud'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ----------------- TAB 7: SECURITY & 2FA ----------------- */}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              {/* Cloud Database Persistence Badge */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-2">
                    <span>Cloud Firestore & Zero Data Loss Guarantee</span>
                    <span className="bg-emerald-200 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    All customer chats, captured orders, product updates, and knowledge items are automatically synchronized to Google Cloud Firestore. Your database and password will never revert to default upon server restarts.
                  </p>
                </div>
              </div>

              {/* 2-Step Verification Card */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-base text-[#262626] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#ECA548]" />
                      2-Step Verification (Email OTP)
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Protect your admin panel by requiring a one-time 6-digit email code upon every login.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingSecurity}
                    onClick={() => handleToggle2FA(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      twoFactorEnabled ? 'bg-[#ECA548]' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-[#ECECEC] text-xs space-y-2">
                  <div className="font-semibold text-gray-700 flex items-center justify-between">
                    <span>Registered Notification & OTP Emails:</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {twoFactorEnabled ? '2FA Active' : '2FA Inactive'}
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>giftghor6525@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>jahidulislammozumder@outlook.com</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 pt-1">
                    When a customer places an order or asks for live agent assistance in the chat, an instant email dispatch is sent to these addresses.
                  </p>
                </div>
              </div>

              {/* Password Management Card */}
              <div className="bg-white rounded-2xl border border-[#ECECEC] p-6 shadow-xs">
                <h2 className="font-bold text-base text-[#262626] mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#ECA548]" />
                  Change Master Password
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                  Set any custom password. The new password is saved directly to persistent storage.
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
                      placeholder="Enter current password"
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
                      placeholder="Enter new password (at least 4 characters)"
                      className="w-full text-xs bg-gray-50 border border-[#ECECEC] rounded-xl px-4 py-2.5 text-[#262626]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-95"
                    style={{ backgroundColor: '#262626' }}
                  >
                    <Key className="w-3.5 h-3.5 text-[#ECA548]" />
                    <span>Save New Password to Cloud</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ----------------- TAB: TEAM & USER ACCESS MANAGEMENT ----------------- */}
          {activeTab === 'team' && isSuperAdmin && (
            <AdminTeamView
              authToken={authToken || ''}
              teamMembers={teamMembers}
              onRefreshTeam={() => loadAdminState(authToken, false, false)}
              showToast={showToast}
              currentUser={currentUser}
            />
          )}
          {activeTab === 'team' && !isSuperAdmin && (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-gray-900">টিম অ্যাক্সেস সংরক্ষিত (Super Admin Only)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                নতুন টিম মেম্বার তৈরি, ডিলিট বা পারমিশন পরিবর্তনের সুবিধা শুধুমাত্র প্রধান <strong>Super Admin</strong>-এর জন্য সংরক্ষিত।
              </p>
              <button
                onClick={() => setActiveTab('orders')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ECA548] text-white hover:bg-[#d8933b]"
              >
                অর্ডার্স পেজে ফিরে যান
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
