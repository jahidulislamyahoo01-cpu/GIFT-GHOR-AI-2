export interface ProductItem {
  id: string;
  title: string;
  price: number; // in BDT
  originalPrice?: number;
  category: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  description: string;
  imageUrl: string;
  url?: string;
  customizable?: boolean;
}

export interface CrawledPage {
  id: string;
  url: string;
  title: string;
  pageType: 'sitemap' | 'product' | 'page';
  status: 'success' | 'failed' | 'pending';
  wordCount: number;
  itemsFound: number;
  crawledAt: string;
  contentSummary: string;
  rawText?: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: 'txt' | 'csv' | 'xml' | 'pdf';
  size: number; // bytes
  parsedItemsCount: number;
  uploadedAt: string;
  summary: string;
}

export interface KnowledgeFAQ {
  id: string;
  question: string;
  answer: string;
  category: 'delivery' | 'order' | 'payment' | 'customization' | 'general';
  updatedAt: string;
}

export interface DeliveryPolicy {
  insideDhakaCost: number; // 80 BDT
  outsideDhakaCost: number; // 130 BDT
  codAvailable: boolean; // Cash on Delivery
  deliveryTimeDhaka: string; // 24-48 hours
  deliveryTimeOutside: string; // 2-4 days
  advancePaymentRequired: boolean; // e.g. 100-200 Tk confirmation for outside Dhaka or none
  advancePaymentNote: string;
  returnPolicyText: string;
  specialNotice: string;
}

export interface BrandingSettings {
  storeName: string;
  widgetTitle: string;
  widgetSubtitle: string;
  logoUrl: string;
  primaryColor: string; // #ECA548
  headerTextColor: string; // #262626
  welcomeMessage: string;
  quickReplies: string[];
  showOnlineStatus: boolean;
  fontFamily?: string;
}

export interface OrderDetails {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  productDetails?: string;
  notes?: string;
  orderStatus: 'lead' | 'confirmed' | 'pending_call';
  collectedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'bot' | 'admin';
  text: string;
  timestamp: string;
  orderData?: OrderDetails;
}

export interface ChatSession {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  unreadCount: number;
  lastActivity: string;
  status: 'active' | 'resolved';
  mode: 'ai' | 'admin_takeover';
  messages: ChatMessage[];
  orderExtracted?: OrderDetails;
}

export interface AdminOverviewStats {
  totalSessions: number;
  unreadSessions: number;
  ordersCaptured: number;
  totalProducts: number;
  knowledgeSourcesCount: number;
  lastTrainedAt: string;
  aiMode: string;
}
