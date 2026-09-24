import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Gift,
  Heart,
  Search,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Star,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Check,
  Eye,
} from 'lucide-react';
import { ProductItem } from '../types';
import { GiftGhorChatWidget } from './GiftGhorChatWidget';

interface StorefrontPreviewProps {
  onGoToAdmin: () => void;
}

export const StorefrontPreview: React.FC<StorefrontPreviewProps> = ({ onGoToAdmin }) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartCount, setCartCount] = useState<number>(1);
  const [cartTotal, setCartTotal] = useState<number>(550);
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    // Fetch live products from backend
    fetch('/api/public/branding')
      .then(() => {
        // also get default products or fallback
        return fetch('/api/chat/session/probe');
      })
      .catch(() => {});

    // Use Gift Ghor's curated product catalog
    const initialProducts: ProductItem[] = [
      {
        id: 'p-1',
        title: 'Custom Engraved Wooden Photo Frame (৫x৭ ইঞ্চি)',
        price: 550,
        originalPrice: 650,
        category: 'Wooden Art',
        stockStatus: 'in_stock',
        description: 'প্রিমিয়াম পাইন উডে প্রিয়জনের ছবি ও মেসেজ সহ লেজার এনগ্রেভড ফ্রেম।',
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&q=80',
        customizable: true,
      },
      {
        id: 'p-2',
        title: 'Personalized Magic Mirror Photo Frame with LED Light',
        price: 690,
        originalPrice: 850,
        category: 'Lamps & Mirrors',
        stockStatus: 'in_stock',
        description: 'লাইট অন করলেই ছবির চমৎকার দৃশ্য! ইউএসবি এবং ব্যাটারি ডাবল পাওয়ার অপশন।',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500&q=80',
        customizable: true,
      },
      {
        id: 'p-3',
        title: 'Custom Spotify Acrylic Music Plaque with Wooden Stand',
        price: 480,
        originalPrice: 590,
        category: 'Acrylic Art',
        stockStatus: 'in_stock',
        description: 'স্ক্যান করলেই বাজবে পছন্দের গান। ক্রিস্টাল ক্লিয়ার অ্যাক্রিলিক শিট ও কাঠের বেস।',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80',
        customizable: true,
      },
      {
        id: 'p-4',
        title: 'Rotating Crystal Photo Lamp with Bluetooth Speaker',
        price: 1250,
        originalPrice: 1550,
        category: 'Smart Decor',
        stockStatus: 'in_stock',
        description: '৩৬০ ডিগ্রি রোটেটিং ল্যাম্প, রিমোট কন্ট্রোল এবং বিল্ট-ইন হাই বেস মিউজিক স্পিকার।',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
        customizable: true,
      },
      {
        id: 'p-5',
        title: 'Customized Leather Wallet & Keychain Combo for Men',
        price: 890,
        originalPrice: 1100,
        category: 'Men Accessories',
        stockStatus: 'in_stock',
        description: 'নাম খোদাই করা লেদার ওয়ালেট, মেটাল কি-রিং ও রয়্যাল ব্লু কলম। লাক্সারি গিফট বক্স।',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80',
        customizable: true,
      },
      {
        id: 'p-6',
        title: 'Personalized Smart Vacuum Flask with Temperature Display (500ml)',
        price: 520,
        originalPrice: 650,
        category: 'Lifestyle',
        stockStatus: 'in_stock',
        description: 'টাচ স্ক্রিন এলইডি ডিসপ্লে। নাম এনগ্রেভ সহ ১২ ঘণ্টা পর্যন্ত তাপমাত্রা ধরে রাখে।',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80',
        customizable: true,
      },
    ];
    setProducts(initialProducts);
  }, []);

  const handleAddToCart = (item: ProductItem) => {
    setCartCount((c) => c + 1);
    setCartTotal((t) => t + item.price);
    setAddedNotice(`"${item.title.substring(0, 30)}..." added to cart!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const toggleLike = (id: string) => {
    setLikedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = ['All', 'Wooden Art', 'Lamps & Mirrors', 'Acrylic Art', 'Men Accessories'];
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white font-sans text-[#262626] pb-28 relative selection:bg-[#FDF7EE] selection:text-[#ECA548]">
      {/* Gift Ghor Official Brand Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#ECECEC] z-30 px-4 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: '#ECA548' }}
            >
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xl tracking-tight text-[#262626]">
                  Gift Ghor
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ECA548]" />
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                giftghor.world • Personalized Gifts
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ম্যাজিক মিরর, কাঠের ফ্রেম বা স্পটিফাই প্লেক খুঁজুন..."
                className="w-full bg-[#FDF7EE]/50 border border-[#ECECEC] rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
              />
            </div>
          </div>

          {/* Right perks & cart */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-600 bg-[#FDF7EE] px-3 py-1.5 rounded-full border border-[#ECA548]/30">
              <Truck className="w-4 h-4 text-[#ECA548]" />
              <span>ঢাকা ৳৮০ | বাইরে ৳১৩০ (COD)</span>
            </div>

            <div className="relative p-2 rounded-xl border border-[#ECECEC] hover:border-[#ECA548] cursor-pointer transition-colors">
              <ShoppingBag className="w-5 h-5 text-[#262626]" />
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-xs"
                style={{ backgroundColor: '#ECA548' }}
              >
                {cartCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner with Brand Palette */}
      <section className="bg-gradient-to-r from-[#FDF7EE] via-white to-[#FDF7EE] border-b border-[#ECECEC] py-10 px-4 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#ECA548] border border-[#ECA548]/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>বাংলাদেশের সেরা কাস্টমাইজড গিফট শপ</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#262626] leading-tight">
              প্রিয়জনের মুখের হাসিতে, <br />
              <span className="text-[#ECA548]">উপহার হোক স্মৃতিময়!</span>
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              ছবি ও নাম দিয়ে তৈরি প্রিমিয়াম কোয়ালিটি উডেন ফ্রেম, ক্রিস্টাল ল্যাম্প ও অ্যাক্রিলিক মিউজিক প্লেক। ক্যাশ অন ডেলিভারিতে সরাসরি বাসায় পৌঁছে দেওয়া হয়।
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#products-section"
                className="px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center gap-2 hover:opacity-95"
                style={{ backgroundColor: '#ECA548' }}
              >
                <span>ক্যাটালগ দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>২৪ ঘণ্টা রিপ্লেসমেন্ট গ্যারান্টি</span>
              </div>
            </div>
          </div>

          {/* Hero Featured Card */}
          <div className="relative w-full max-w-sm">
            <div className="bg-white rounded-3xl p-4 shadow-xl border border-[#ECECEC] relative z-10">
              <div className="h-56 rounded-2xl overflow-hidden bg-gray-100 relative mb-3">
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80"
                  alt="Custom Wooden Frame"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#ECA548] text-white shadow-xs">
                  Best Seller
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#262626]">Custom Wooden Engraved Frame</h4>
                  <p className="text-xs text-emerald-600 font-semibold">In Stock • ৳550 BDT</p>
                </div>
                <button
                  onClick={() =>
                    handleAddToCart({
                      id: 'hero-item',
                      title: 'Custom Wooden Engraved Frame',
                      price: 550,
                      category: 'Wooden Art',
                      stockStatus: 'in_stock',
                      description: 'Best seller',
                      imageUrl: '',
                    })
                  }
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
            <div className="absolute -inset-2 bg-[#ECA548]/15 rounded-3xl blur-xl" />
          </div>
        </div>
      </section>

      {/* Product Catalog Section */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#262626]">জনপ্রিয় কাস্টমাইজড প্রোডাক্টস</h2>
            <p className="text-xs text-gray-500 mt-1">
              যেকোনো প্রোডাক্টের বিস্তারিত জানতে ডানদিকের চ্যাট উইজেটে প্রশ্ন করুন
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#ECA548] text-white shadow-xs'
                    : 'bg-[#FDF7EE] text-[#262626] hover:bg-gray-100 border border-[#ECECEC]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isLiked = likedItems[product.id];

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-[#ECECEC] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#ECA548]/40 transition-all flex flex-col group"
              >
                {/* Product Image */}
                <div className="h-56 bg-gray-100 relative overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.customizable && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-[#ECA548] shadow-xs border border-[#ECA548]/30">
                        Customizable ✨
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleLike(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xs transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${isLiked ? 'text-rose-500 fill-rose-500' : ''}`}
                    />
                  </button>
                </div>

                {/* Body info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#ECA548] tracking-wide">
                      {product.category}
                    </span>
                    <h3 className="font-bold text-sm text-[#262626] mt-1 leading-snug">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ECECEC] flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-base text-[#262626]">
                          ৳{product.price}
                        </span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">
                            ৳{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        In Stock
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all hover:opacity-90 active:scale-95 flex items-center gap-1.5"
                      style={{ backgroundColor: '#ECA548' }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom Cart Pill Bar (Gift Ghor authentic UX pattern) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md bg-[#262626] text-white rounded-full px-5 py-3 shadow-2xl border border-white/20 flex items-center justify-between animate-fadeIn">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ backgroundColor: '#ECA548' }}
          >
            {cartCount}
          </div>
          <div>
            <p className="text-xs font-semibold">Shopping Cart Total</p>
            <p className="text-[11px] text-gray-300 font-mono">৳{cartTotal} BDT</p>
          </div>
        </div>

        <button
          onClick={() => {
            setAddedNotice('Proceeding to checkout with Cash on Delivery!');
            setTimeout(() => setAddedNotice(null), 3000);
          }}
          className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xs transition-all hover:opacity-90"
          style={{ backgroundColor: '#ECA548' }}
        >
          Checkout (COD)
        </button>
      </div>

      {/* Added notice alert */}
      {addedNotice && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#262626] text-white text-xs px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/20">
          <Check className="w-4 h-4 text-[#ECA548]" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* THE EMBEDDABLE CLIENT CHAT WIDGET */}
      <GiftGhorChatWidget />
    </div>
  );
};
