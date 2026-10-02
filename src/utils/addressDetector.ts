// Smart Bangladesh Delivery Location & Address Detector for Gift Ghor
// Accurately classifies addresses into 'inside_dhaka' (৳70) vs 'outside_dhaka' (৳130)

export interface DetectionResult {
  location: 'inside_dhaka' | 'outside_dhaka';
  charge: number;
  reason: string;
  matchedKeyword?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

// 64 Districts of Bangladesh outside Dhaka city
const OUTSIDE_DHAKA_DISTRICTS = [
  // Chittagong Division
  'chittagong', 'chattogram', 'চট্টগ্রাম', 'চট্রগ্রাম',
  'cox\'s bazar', 'coxsbazar', 'কক্সবাজার',
  'comilla', 'cumilla', 'কুমিল্লা',
  'feni', 'ফেনী',
  'noakhali', 'নোয়াখালী', 'নোয়াখালী',
  'brahmanbaria', 'ব্রাহ্মণবাড়িয়া', 'ব্রাহ্মণবাড়িয়া',
  'chandpur', 'চাঁদপুর',
  'lakshmipur', 'লক্ষ্মীপুর',
  'bandarban', 'বান্দরবান',
  'rangamati', 'রাঙ্গামাটি', 'রাঙামাটি',
  'khagrachhari', 'খাগড়াছড়ি', 'খাগড়াছড়ি',

  // Sylhet Division
  'sylhet', 'সিলেট',
  'moulvibazar', 'মৌলভীবাজার',
  'habiganj', 'হবিগঞ্জ',
  'sunamganj', 'সুনামগঞ্জ',

  // Rajshahi Division
  'rajshahi', 'রাজশাহী',
  'bogra', 'bogura', 'বগুড়া', 'বগুড়া',
  'pabna', 'পাবনা',
  'sirajganj', 'সিরাজগঞ্জ',
  'naogaon', 'নওগাঁ',
  'natore', 'নাটোর',
  'chapainawabganj', 'চাঁপাইনবাবগঞ্জ',
  'joypurhat', 'জয়পুরহাট', 'জয়পুরহাট',

  // Khulna Division
  'khulna', 'খুলনা',
  'jessore', 'jashore', 'যশোর',
  'kushtia', 'কুষ্টিয়া', 'কুষ্টিয়া',
  'satkhira', 'সাতক্ষীরা',
  'bagerhat', 'বাগেরহাট',
  'jhenaidah', 'ঝিনাইদহ',
  'chuadanga', 'চুয়াডাঙ্গা', 'চুয়াডাঙ্গা',
  'magura', 'মাগুরা',
  'meherpur', 'মেহেরপুর',
  'narail', 'নড়াইল', 'নড়াইল',

  // Barisal Division
  'barisal', 'barishal', 'বরিশাল',
  'patuakhali', 'পটুয়াখালী', 'পটুয়াখালী',
  'bhola', 'ভোলা',
  'pirojpur', 'পিরোজপুর',
  'jhalokati', 'jhalakati', 'ঝালকাঠি',
  'barguna', 'বরগুনা',

  // Rangpur Division
  'rangpur', 'রংপুর',
  'dinajpur', 'দিনাজপুর',
  'gaibandha', 'গাইবান্ধা',
  'kurigram', 'কুড়িগ্রাম', 'কুড়িগ্রাম',
  'lalmonirhat', 'লালমনিরহাট',
  'nilphamari', 'নীলফামারী',
  'panchagarh', 'পঞ্চগড়', 'পঞ্চগড়',
  'thakurgaon', 'ঠাকুরগাঁও',

  // Mymensingh Division
  'mymensingh', 'ময়মনসিংহ', 'ময়মনসিংহ',
  'jamalpur', 'জামালপুর',
  'netrokona', 'নেত্রকোণা', 'নেত্রকোনা',
  'sherpur', 'শেরপুর',

  // Dhaka Division districts (excluding core Dhaka City)
  'gazipur', 'গাজীপুর', 'টঙ্গী', 'tongi', 'boardbazar', 'বোর্ডবাজার',
  'narayanganj', 'নারায়ণগঞ্জ', 'নারায়ণগঞ্জ', 'সিদ্ধিরগঞ্জ', 'siddhirganj', 'সোনারগাঁও', 'sonargaon',
  'tangail', 'টাঙ্গাইল',
  'narsingdi', 'নরসিংদী',
  'kishoreganj', 'কিশোরগঞ্জ',
  'manikganj', 'মানিকগঞ্জ',
  'munshiganj', 'মুন্সীগঞ্জ',
  'faridpur', 'ফরিদপুর',
  'gopalganj', 'গোপালগঞ্জ',
  'madaripur', 'মাদারীপুর',
  'shariatpur', 'শরীয়তপুর', 'শরীয়তপুর',
  'rajbari', 'রাজবাড়ী', 'রাজবাড়ী',

  // Generic outside indicators
  'গ্রাম', 'উপজেলা', 'ইউনিয়ন', 'ইউনিয়ন পরিষদ', 'post code', 'থানা', 'উপজেলা', 'village', 'thana'
];

// Dhaka city major areas, thanas and landmarks
const DHAKA_CITY_AREAS = [
  // Major Areas
  'dhaka', 'ঢাকা', 'dhaka city', 'ঢাকা সিটি', 'ঢাকা মহানগর',
  'mirpur', 'মিরপুর', 'মিরপুর ১', 'মিরপুর ২', 'মিরপুর ১০', 'মিরপুর ১১', 'মিরপুর ১২', 'মিরপুর ১৪', 'mirpur-1', 'mirpur-2', 'mirpur-10', 'mirpur-11', 'mirpur-12', 'mirpur-14',
  'dhanmondi', 'ধানমন্ডি', 'dhanmondi 27', 'dhanmondi 32', 'জিগাতলা', 'jigatola',
  'uttara', 'উত্তরা', 'uttara sector', 'sector 1', 'sector 3', 'sector 7', 'sector 10', 'sector 11', 'sector 13', 'উত্তরা সেক্টর',
  'gulshan', 'গুলশান', 'gulshan 1', 'gulshan 2', 'গুলশান ১', 'গুলশান ২',
  'banani', 'বনানী', 'banani dohs', 'বনানী ডিওএইচএস',
  'mohammadpur', 'মোহাম্মদপুর', 'মোহাম্মাদপুর', 'টাউন হল', 'town hall', 'japan garden', 'জাপান গার্ডেন',
  'motijheel', 'মতিঝিল', 'দিলকুশা', 'dilkusha',
  'badda', 'বাড্ডা', 'উত্তর বাড্ডা', 'দক্ষিণ বাড্ডা', 'মধ্য বাড্ডা', 'merul badda', 'মেরুল বাড্ডা',
  'malibagh', 'মালিবাগ', 'মৌচাক', 'mouchak',
  'jatrabari', 'যাত্রাবাড়ী', 'যাত্রাবাড়ী', 'ধোলাইপাড়', 'dholairpar', 'সায়দাবাদ', 'sayedabad',
  'bashundhara', 'বসুন্ধরা', 'বসুন্ধরা আবাসিক', 'bashundhara r/a', 'ব্লক',
  'paltan', 'পল্টন', 'নয়া পল্টন', 'পুরানা পল্টন', 'paltan',
  'shahbagh', 'শাহবাগ', 'শাহবাগ মোড়',
  'farmgate', 'ফার্মগেট', 'তেজকুনিপাড়া', 'tezkunipara',
  'tejgaon', 'তেজগাঁও', 'তেজগাঁও শিল্প এলাকা',
  'rampura', 'রামপুরা', 'বনশ্রী', 'banasree', 'আফতাবনগর', 'aftabnagar',
  'khilgaon', 'খিলগাঁও', 'তিলপাপাড়া', 'tilpapara', 'খিলগাও',
  'mohakhali', 'মহাখালী', 'মহাখালি', 'mohakhali dohs', 'ওয়ারলেস',
  'shyamoli', 'শ্যামলী', 'শ্যামলি', 'রিং রোড', 'ring road',
  'lalbagh', 'লালবাগ', 'লালবাগ কেল্লা',
  'wari', 'ওয়ারী', 'ওয়ারী', 'র‌্যাংকিন স্ট্রিট',
  'chawkbazar', 'চকবাজার', 'চক বাজার',
  'keraniganj', 'কেরানীগঞ্জ', 'কেরানিগঞ্জ', 'জিনজিরা', 'jinjira',
  'savar', 'সাভার', 'সাভার বাজার', 'dhamrai', 'ধামরাই', 'ashulia', 'আশুলিয়া', 'আশুলিয়া',
  'demra', 'ডেমরা', 'কোনাপাড়া', 'konapara',
  'kamrangirchar', 'কামরাঙ্গীরচর', 'কামরাঙ্গিরচর',
  'cantonment', 'ক্যান্টনমেন্ট', 'মিরপুর ডিওএইচএস', 'mirpur dohs',
  'kafrul', 'কাফরুল', 'ইব্রাহিমপুর', 'ibrahimpur',
  'hazaribagh', 'হাজারীবাগ', 'হাজারিবাগ',
  'khilkhet', 'খিলক্ষেত', 'খিলখেত',
  'nikunja', 'নিকুঞ্জ', 'nikunja 1', 'nikunja 2',
  'baridhara', 'বারিধারা', 'বারিধারা ডিওএইচএস', 'baridhara dohs',
  'mugda', 'মুগদা', 'মুগদা মেডিকেল',
  'sutrapur', 'সূত্রাপুর', 'গেন্ডারিয়া', 'গেণ্ডারিয়া', 'gandaria',
  'kotwali', 'কোতোয়ালী', 'কোতোয়ালী', 'সদরঘাট', 'sadrghat',
  'new market', 'নিউ মার্কেট', 'আজিমপুর', 'azimpur',
  'panthapath', 'পান্থপথ', 'গ্রীন রোড', 'green road',
  'kalabagan', 'কলাবাগান', 'সোবহানবাগ', 'sobhanbagh',
  'adabor', 'আদাবর', 'শেখেরটেক', 'shekhertek',
  'kuril', 'কুড়িল', 'কুড়িল', 'কুড়িল বিশ্বরোড',
  'vatara', 'ভাটারা', 'নদ্দা', 'nadda',
  'bosila', 'বসিলা',
  'postagola', 'পোস্তগোলা', 'জুরাইন', 'jurain',
  'dania', 'দনিয়া', 'দানিয়া',
  'shantinagar', 'শান্তিনগর', 'কাকরাইল', 'kakrail', 'সেগুনবাগিচা', 'segunbagicha',
  'bijoynagar', 'বিজয়নগর', 'বিজয়নগর',
  'elephant road', 'এলিফ্যান্ট রোড', 'বাটা সিগন্যাল',
  'agargaon', 'আগারগাঁও', 'আগারগাও', 'তালতলা', 'taltola',
  'shewrapara', 'শেওড়াপাড়া', 'শেওড়াপাড়া', 'পশ্চিম শেওড়াপাড়া',
  'kazipara', 'কাজীপাড়া', 'কাজীপাড়া',
  'pallabi', 'পল্লবী', 'রূপনগর', 'rupnagar',
  'gabtoli', 'গাবতলী', 'কল্যাণপুর', 'kallyanpur',
  'bhasantek', 'ভাসানটেক',
  'baipayl', 'বাইপাইল', 'নবীনগর', 'nobinagar'
];

/**
 * Intelligent delivery location detector.
 * Normalizes Bengali & English text and identifies whether the address belongs to Inside Dhaka or Outside Dhaka.
 */
export function detectDeliveryLocation(
  address: string,
  insideCost: number = 70,
  outsideCost: number = 130
): DetectionResult {
  if (!address || !address.trim()) {
    return {
      location: 'inside_dhaka',
      charge: insideCost,
      reason: 'ডিফল্ট নির্বাচন (ঢাকার ভিতরে)',
      confidence: 'none',
    };
  }

  const rawLower = address.toLowerCase().trim();

  // 1. Check for Outside Dhaka districts first (highest priority: e.g. "Chittagong" or "Sylhet")
  for (const district of OUTSIDE_DHAKA_DISTRICTS) {
    // Avoid false positives like "Dhaka Chittagong Highway" if "Dhaka" is also explicitly the main destination
    const pattern = new RegExp(`(^|\\s|[.,;\\-\\/])${district.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}($|\\s|[.,;\\-\\/])`, 'i');
    if (pattern.test(rawLower) || rawLower.includes(district)) {
      return {
        location: 'outside_dhaka',
        charge: outsideCost,
        reason: `অটো-সনাক্ত: '${district}' (ঢাকার বাইরে)`,
        matchedKeyword: district,
        confidence: 'high',
      };
    }
  }

  // 2. Check for Dhaka areas / thanas
  for (const area of DHAKA_CITY_AREAS) {
    const pattern = new RegExp(`(^|\\s|[.,;\\-\\/])${area.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}($|\\s|[.,;\\-\\/])`, 'i');
    if (pattern.test(rawLower) || rawLower.includes(area)) {
      return {
        location: 'inside_dhaka',
        charge: insideCost,
        reason: `অটো-সনাক্ত: '${area}' (ঢাকার ভিতরে)`,
        matchedKeyword: area,
        confidence: 'high',
      };
    }
  }

  // 3. Postal Code heuristic: Dhaka postal codes are 1000 - 1399
  const postalMatch = rawLower.match(/\b(1[0-3]\d{2})\b/);
  if (postalMatch) {
    return {
      location: 'inside_dhaka',
      charge: insideCost,
      reason: `পোস্টাল কোড ${postalMatch[1]} (ঢাকা মেট্রো)`,
      matchedKeyword: postalMatch[1],
      confidence: 'medium',
    };
  }

  // 4. Default fallback: If text length is substantial (> 15 chars) but no Dhaka keywords, assume outside Dhaka
  if (rawLower.length > 20) {
    return {
      location: 'outside_dhaka',
      charge: outsideCost,
      reason: 'ঢাকার বাইরের ঠিকানা সনাক্ত হয়েছে',
      confidence: 'medium',
    };
  }

  // Default to inside Dhaka
  return {
    location: 'inside_dhaka',
    charge: insideCost,
    reason: 'ঢাকার ভিতরে',
    confidence: 'low',
  };
}
