import { pgTable, text, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linked)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  price: integer('price').notNull(),
  category: text('category'),
  imageUrl: text('image_url'),
  url: text('url'),
  description: text('description'),
  customizable: boolean('customizable').default(false),
  stockStatus: text('stock_status').default('in_stock'),
  stock: integer('stock').default(50),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerAddress: text('customer_address'),
  deliveryLocation: text('delivery_location'),
  totalAmount: integer('total_amount').notNull(),
  codAmount: integer('cod_amount'),
  isPaid: boolean('is_paid').default(false),
  items: jsonb('items'),
  status: text('status').default('pending'),
  steadfastConsignmentId: text('steadfast_consignment_id'),
  steadfastTrackingCode: text('steadfast_tracking_code'),
  steadfastDeliveryStatus: text('steadfast_delivery_status'),
  steadfastLastCheckedAt: timestamp('steadfast_last_checked_at'),
  notes: text('notes'),
  source: text('source').default('chat'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Crawled Pages & Knowledge Base from Sitemap
export const crawledPages = pgTable('crawled_pages', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  title: text('title'),
  content: text('content'),
  category: text('category'),
  crawledAt: timestamp('crawled_at').defaultNow(),
});

// Branding & Shop Configuration
export const branding = pgTable('branding', {
  id: text('id').primaryKey().default('default'),
  shopName: text('shop_name').notNull(),
  tagline: text('tagline'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  socialLinks: jsonb('social_links'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Delivery Policy
export const deliveryPolicy = pgTable('delivery_policy', {
  id: text('id').primaryKey().default('default'),
  insideDhakaRate: integer('inside_dhaka_rate').default(70),
  outsideDhakaRate: integer('outside_dhaka_rate').default(130),
  freeDeliveryAbove: integer('free_delivery_above'),
  estimatedDhaka: text('estimated_dhaka'),
  estimatedOutside: text('estimated_outside'),
  policyText: text('policy_text'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin Settings & Integrations
export const adminSettings = pgTable('admin_settings', {
  id: text('id').primaryKey().default('default'),
  telegramBotToken: text('telegram_bot_token'),
  telegramChatId: text('telegram_chat_id'),
  steadfastApiKey: text('steadfast_api_key'),
  steadfastSecretKey: text('steadfast_secret_key'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  notificationEmails: jsonb('notification_emails'),
  passwordHash: text('password_hash'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Team Members
export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Chat Sessions & Conversations
export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  customerName: text('customer_name'),
  customerPhone: text('customer_phone'),
  status: text('status').default('active'),
  messages: jsonb('messages'),
  orderExtracted: jsonb('order_extracted'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
