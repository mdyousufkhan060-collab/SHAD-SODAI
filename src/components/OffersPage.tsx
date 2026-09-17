import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from './ProductCard';
import { offerService, Offer } from '../utils/offerService';
import { tracking } from '../utils/tracking';
import { PromotionalBanner } from './PromotionalBanner';
import { Clock, Tag, Search, ArrowUpDown, ChevronDown, RefreshCw } from 'lucide-react';

export const OffersPage = () => {
  const { language, t } = useLanguage();
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Search, Filter, Sort and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const itemsPerPage = 12;

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Update document title and SEO meta description
  useEffect(() => {
    document.title = language === 'bn' 
      ? 'স্বাদ ঘর অফারসমূহ | সেরা ছাড় ও সীমিত সময়ের ডিল' 
      : 'SHAD GHOR Offers | Best Deals & Limited Time Discounts';
    
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute('content', language === 'bn' 
        ? 'স্বাদ ঘরের তাজা শাকসবজি, মধু, ঘি এবং খেজুরের ওপর বিশেষ ছাড় ও মেগা অফারসমূহ উপভোগ করুন।' 
        : 'Explore special discounts, limited time deals and savings on organic honey, ghee, spices and dates at SHAD GHOR.');
    }
  }, [language]);

  // Load Active Campaigns on mount
  useEffect(() => {
    const fetchOffers = () => {
      const active = offerService.getActiveOffers();
      setActiveOffers(active);
      if (active.length > 0) {
        // Select the primary Flash Sale or first active offer by default
        const flash = active.find(o => o.slug === 'flash-sale') || active[0];
        setSelectedOffer(flash);
      } else {
        setSelectedOffer(null);
      }
    };

    fetchOffers();
    // Re-check validity of campaign dates every 15 seconds
    const interval = setInterval(fetchOffers, 15000);
    return () => clearInterval(interval);
  }, []);

  // Sync Products list based on search, filter, sort, and pagination
  useEffect(() => {
    if (!selectedOffer) {
      setDisplayedProducts([]);
      setTotalProductsCount(0);
      setHasMore(false);
      return;
    }

    // Offset is calculated using (page - 1) * limit
    const offset = 0;
    const limit = currentPage * itemsPerPage; // Cumulative display for "Load More"

    const result = offerService.getOfferProductsPaged(selectedOffer.id, {
      category: selectedCategory,
      sortBy: sortBy,
      search: searchQuery,
      limit: limit,
      offset: offset
    });

    setDisplayedProducts(result.items);
    setTotalProductsCount(result.total);
    setHasMore(result.hasMore);
  }, [selectedOffer, selectedCategory, sortBy, searchQuery, currentPage]);

  // Reset pagination to page 1 whenever search, filter or campaign changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOffer, selectedCategory, sortBy, searchQuery]);

  // Track search event
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const timer = setTimeout(() => {
        tracking.track('Search', { search_term: searchQuery.trim() });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Live countdown timer updating every second
  useEffect(() => {
    if (!selectedOffer) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(selectedOffer.end_at) - +new Date();
      if (difference <= 0) {
        // Campaign expired! Refresh offers list instantly
        const active = offerService.getActiveOffers();
        setActiveOffers(active);
        if (active.length > 0) {
          setSelectedOffer(active[0]);
        } else {
          setSelectedOffer(null);
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const clockTimer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(clockTimer);
  }, [selectedOffer]);

  const handleContinueShopping = () => {
    window.location.hash = '#/';
  };

  const padZero = (num: number) => String(num).padStart(2, '0');

  const categories = [
    { key: 'All', en: 'All Offers', bn: 'সবগুলো অফার' },
    { key: 'Honey', en: 'Honey', bn: 'মধু' },
    { key: 'Oil & Ghee', en: 'Oil & Ghee', bn: 'তেল ও ঘি' },
    { key: 'Dates', en: 'Dates', bn: 'খেজুর' },
    { key: 'Nuts & Seeds', en: 'Nuts & Seeds', bn: 'বাদাম ও বীজ' },
    { key: 'Spices', en: 'Spices', bn: 'মসলা' },
    { key: 'Beverages', en: 'Beverages', bn: 'বেভারেজ' },
    { key: 'Functional Foods', en: 'Functional Foods', bn: 'ফাংশনাল ফুড' },
    { key: 'Fresh Vegetables', en: 'Vegetables', bn: 'শাকসবজি' }
  ];

  const sortingOptions = [
    { key: 'featured', en: 'Featured', bn: 'জনপ্রিয়তা' },
    { key: 'discount', en: 'Biggest Discount', bn: 'সর্বোচ্চ ছাড়' },
    { key: 'price-asc', en: 'Price: Low to High', bn: 'মূল্য: কম থেকে বেশি' },
    { key: 'price-desc', en: 'Price: High to Low', bn: 'মূল্য: বেশি থেকে কম' },
    { key: 'newest', en: 'Newest Offers', bn: 'নতুন অফার' }
  ];

  // Render Empty State if no offers are active
  if (activeOffers.length === 0 || !selectedOffer) {
    return (
      <div 
        className="w-full max-w-lg mx-auto px-4 py-20 text-center space-y-6 animate-fade-in" 
        id="offers-empty-state"
      >
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
          <Tag className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-gray-800">
            {language === 'bn' ? 'অফারসমূহ' : 'Offers & Campaigns'}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-400">
            {language === 'bn' ? 'এই মুহূর্তে কোনো সক্রিয় ডিসকাউন্ট অফার নেই। অনুগ্রহ করে পরে আবার চেক করুন!' : 'No active discount offers available right now. Please check back later!'}
          </p>
        </div>
        <button
          onClick={handleContinueShopping}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-3xs active:scale-95"
        >
          {language === 'bn' ? 'শপিং চালিয়ে যান' : 'Continue Shopping'}
        </button>
      </div>
    );
  }

  return (
    <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-4 animate-fade-in" id="offers-page-main">
      
      {/* 1. COMPACT PAGE HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-100 shadow-3xs" id="offers-page-header">
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-black text-gray-800 tracking-tight flex items-center gap-1.5">
            <Tag className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{language === 'bn' ? 'বিশেষ ছাড় ও অফারসমূহ' : 'Discount Campaigns'}</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-gray-400">
            {language === 'bn' ? 'স্বাদ ঘরের খাঁটি খাবারে বিশেষ ছাড় ও অফার' : 'Premium handpicked organic foods at special discount rates'}
          </p>
        </div>

        {/* Campaign Tabs horizontally scrollable if multiple campaigns are active */}
        {activeOffers.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-0.5" id="campaign-selector-tabs">
            {activeOffers.map((offer) => (
              <button
                key={offer.id}
                onClick={() => setSelectedOffer(offer)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-md cursor-pointer whitespace-nowrap transition-all duration-200 border uppercase tracking-wider ${
                  selectedOffer.id === offer.id 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs' 
                    : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {language === 'bn' ? offer.title_bn : offer.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <PromotionalBanner location="offer_banner" className="px-0" />

      {/* 2. FLASH SALE / CAMPAIGN BANNER HERO */}
      <section 
        className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-3xs flex flex-col" 
        id="campaign-section"
      >
        {/* Responsive Compact Banner Area */}
        <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1] bg-gray-50 border-b border-gray-50" id="campaign-banner">
          <img 
            src={selectedOffer.banner_image} 
            alt={selectedOffer.title} 
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent flex flex-col justify-center p-3 sm:p-5 text-white space-y-1">
            <span className="text-[8px] sm:text-[9px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/55 w-fit px-2 py-0.5 rounded-sm">
              {language === 'bn' ? 'সীমিত সময়ের অফার' : 'Limited Time Offer'}
            </span>
            <h2 className="text-sm sm:text-base md:text-xl font-black tracking-wide">
              {language === 'bn' ? selectedOffer.title_bn : selectedOffer.title}
            </h2>
            <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-200 line-clamp-2 max-w-xs sm:max-w-md">
              {language === 'bn' ? selectedOffer.description_bn : selectedOffer.description}
            </p>
          </div>
        </div>

        {/* Live Countdown & Info Bar */}
        <div className="flex flex-col xs:flex-row items-center justify-between gap-3 bg-emerald-50/20 p-2.5 sm:p-3.5 border-t border-emerald-100/20" id="campaign-meta-bar">
          <div className="text-center xs:text-left space-y-0.5">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center justify-center xs:justify-start gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
              <span>{language === 'bn' ? 'ফ্ল্যাশ সেল লাইভ!' : 'FLASH SALE IS ACTIVE'}</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400">
              {language === 'bn' ? 'অফার শেষ হওয়ার পূর্বে স্টক ফুরিয়ে যাওয়ার আগেই কিনুন' : 'Order before the time expires and stock runs out'}
            </p>
          </div>

          {/* Countdown Clock Display */}
          <div className="flex items-center gap-1 text-center" id="countdown-clock">
            {[
              { value: timeLeft.days, label: language === 'bn' ? 'দিন' : 'Days' },
              { value: timeLeft.hours, label: language === 'bn' ? 'ঘণ্টা' : 'Hours' },
              { value: timeLeft.minutes, label: language === 'bn' ? 'মি:' : 'Mins' },
              { value: timeLeft.seconds, label: language === 'bn' ? 'সে:' : 'Secs' }
            ].map((unit, uIdx, arr) => (
              <React.Fragment key={uIdx}>
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-600 text-white font-black text-xs sm:text-sm px-2 py-1 rounded-md min-w-[28px] sm:min-w-[34px] shadow-3xs">
                    {padZero(unit.value)}
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">{unit.label}</span>
                </div>
                {uIdx < arr.length - 1 && (
                  <span className="text-emerald-600 font-black text-xs pb-3">:</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COMPACT SEARCH, FILTER AND SORT BAR */}
      <section className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-3xs space-y-2.5" id="offers-controls-section">
        {/* Top layer: Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2" id="controls-top-row">
          {/* Search bar */}
          <div className="relative flex-1 max-w-full sm:max-w-xs" id="search-bar-wrapper">
            <span className="absolute inset-y-0 left-2.5 flex items-center justify-center text-gray-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder={language === 'bn' ? 'অফারের পণ্য খুঁজুন...' : 'Search offer products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-150 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold"
              id="offers-search-input"
            />
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0 flex items-center gap-1.5" id="sort-selector-wrapper">
            <span className="text-[10px] font-black text-gray-400 flex items-center gap-0.5 uppercase tracking-wider">
              <ArrowUpDown className="w-3 h-3" />
              <span>{language === 'bn' ? 'সর্ট করুন:' : 'Sort By:'}</span>
            </span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-150 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
                id="offers-sort-select"
              >
                {sortingOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {language === 'bn' ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
              <span className="absolute inset-y-0 right-2 flex items-center justify-center text-gray-400 pointer-events-none">
                <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Bottom layer: Horizontally Scrollable Category Pills */}
        <div className="relative w-full border-t border-gray-50 pt-2" id="controls-categories-row">
          <div 
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5 px-0.5 scroll-smooth" 
            id="offers-category-pills"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 text-[10px] font-black rounded-full cursor-pointer whitespace-nowrap transition-all duration-200 border ${
                  selectedCategory === cat.key 
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-150 text-gray-600'
                }`}
              >
                {language === 'bn' ? cat.bn : cat.en}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. PRODUCTS GRID AREA */}
      <section className="space-y-4" id="offer-grid-section">
        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 px-1">
          <h4 className="font-extrabold text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest">
            {language === 'bn' ? 'অফারভুক্ত পণ্যসমূহ' : 'Available Offers'}
          </h4>
          <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-full">
            {language === 'bn' ? `${totalProductsCount}টি পণ্য` : `${totalProductsCount} Products`}
          </span>
        </div>

        {/* Dynamic Responsive Grid - no card inside card wrapping */}
        {displayedProducts.length > 0 ? (
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 px-0.5" 
            id="offer-products-grid"
          >
            {displayedProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          /* Empty Search/Filter State */
          <div className="bg-white py-14 text-center border border-gray-100 rounded-xl space-y-3 shadow-3xs" id="grid-empty-state">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto border border-gray-100">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-400">
              {language === 'bn' ? 'আপনার সার্চ বা ক্যাটাগরি ফিল্টারের সাথে মিলে যায় এমন কোনো পণ্য পাওয়া যায়নি।' : 'No products matched your search queries or selected category filter.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs font-black text-emerald-600 hover:text-emerald-700 underline flex items-center justify-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'রিসেট ফিল্টার' : 'Reset Filters'}</span>
            </button>
          </div>
        )}

        {/* 5. LOAD MORE PAGINATION */}
        {hasMore && (
          <div className="flex flex-col items-center justify-center pt-6 pb-2 gap-2" id="pagination-load-more-wrapper">
            <span className="text-[10px] sm:text-xs text-gray-400 font-bold">
              {language === 'bn' 
                ? `মোট ${totalProductsCount}টি পণ্যের মধ্যে ${displayedProducts.length}টি দেখানো হচ্ছে` 
                : `Showing ${displayedProducts.length} of ${totalProductsCount} items`}
            </span>
            <div className="w-48 bg-gray-100 h-1 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${(displayedProducts.length / totalProductsCount) * 100}%` }}
              ></div>
            </div>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-2.5 rounded-lg uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-3xs active:scale-95"
              id="offers-load-more-btn"
            >
              {language === 'bn' ? 'আরো লোড করুন' : 'Load More'}
            </button>
          </div>
        )}
      </section>

    </main>
  );
};
