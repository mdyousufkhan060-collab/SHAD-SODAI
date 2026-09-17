import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingCart, Heart, Star, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName, getTranslatedCategoryName } from '../utils/translations';
import { offerService } from '../utils/offerService';
import { productService } from '../utils/productService';
import { cartService } from '../utils/cartService';
import { tracking } from '../utils/tracking';
import { reviewService } from '../utils/reviewService';

interface Props {
  product: Product;
  isSlider?: boolean;
  key?: string;
}

export const ProductCard = ({ product, isSlider = false }: Props) => {
  const { language, t } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const productImg = product.imageUrl || (product as any).image_url || '';
  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice !== undefined ? product.oldPrice : ((product as any).old_price || 0));

  useEffect(() => {
    cartService.isInWishlist(product.id).then(setIsWishlisted);
  }, [product.id]);

  useEffect(() => {
    setImgError(false);
  }, [productImg]);

  const stock = product.stock_quantity !== undefined 
    ? Number(product.stock_quantity) 
    : offerService.getInventoryStock(product.id);
  const isSoldOut = stock <= 0;

  const ext = productService.getProductExtension(product.id, product.name);
  const unit = product.unit || (ext ? ext.unit : '500g');
  
  const shortDesc = language === 'bn' 
    ? ((product as any).short_description_bn || product.short_description || '')
    : (product.short_description || (product as any).short_description_bn || '');

  const [reviewCount, setReviewCount] = useState(product.review_count || 0);

  useEffect(() => {
    const fetchStats = async () => {
      if (product.review_count !== undefined) return;
      
      const stats = await reviewService.getProductRatingStats(product.id);
      const count = stats.totalCount > 0 
        ? stats.totalCount 
        : Math.floor((parseInt(product.id.replace(/\D/g, '')) || 5) * 7 % 25) + 3;
      setReviewCount(count);
    };
    fetchStats();
  }, [product.id, product.review_count]);

  const discountPercent = (oldPrice > price && price > 0)
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Sync wishlist status when wishlist-updated is emitted
  useEffect(() => {
    const handleWishlistSync = () => {
      cartService.isInWishlist(product.id).then(setIsWishlisted);
    };
    window.addEventListener('wishlist-updated', handleWishlistSync);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistSync);
    };
  }, [product.id]);

  const handleCardClick = () => {
    const target = product.slug || product.id || productService.getProductSlug(product.id, product.name);
    if (!target) return;
    window.location.hash = `#/product/${target}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return;
    
    const result = cartService.addToCart(product.id, 1);
    if (result.success) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1500);

      // Track AddToCart Meta/TikTok Event
      tracking.track('AddToCart', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: price,
        currency: 'BDT'
      });
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isAddedNow = await cartService.toggleWishlist(product.id);
    setIsWishlisted(isAddedNow);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-[6px] border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group select-none relative cursor-pointer ${
        isSlider 
          ? 'w-[150px] sm:w-[170px] md:w-[190px] shrink-0' 
          : 'w-full'
      }`}
      id={`product-card-${product.id}`}
      style={{ borderRadius: '6px' }}
    >
      {/* 1. PRODUCT IMAGE AREA (Clean Rectangular Structure, border-radius: 4px 4px 0 0) */}
      <div 
        className="relative aspect-square w-full bg-[#fbfbfb] overflow-hidden flex items-center justify-center p-2.5 sm:p-3 border-b border-gray-100 rounded-t-[4px]" 
        id={`product-img-viewport-${product.id}`}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        {productImg && !imgError ? (
          <img 
            src={productImg} 
            alt=""
            aria-label={getTranslatedName(product.name, language)}
            className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 ${isSoldOut ? 'opacity-40 grayscale' : 'group-hover:scale-105'}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            id={`product-img-${product.id}`}
            onError={() => setImgError(true)}
          />
        ) : (
          /* Neutral Food Product Placeholder with no broken browser icon or raw alt text */
          <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center p-3 select-none text-gray-300">
            <svg 
              className="w-10 h-10 stroke-[1.25] text-gray-300 mb-1" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase">SHAD GHOR</span>
          </div>
        )}
        
        {/* Wishlist Button (Clean rectangular 4px radius, NOT circular pill) */}
        <button 
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white text-gray-400 hover:text-rose-500 rounded-[4px] border border-gray-200/80 flex items-center justify-center transition-colors shadow-xs cursor-pointer z-10"
          aria-label="Add to Wishlist"
          id={`product-wishlist-btn-${product.id}`}
          style={{ borderRadius: '4px' }}
        >
          <Heart 
            className={`w-3.5 h-3.5 transition-colors ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} 
            id={`product-wishlist-icon-${product.id}`}
          />
        </button>

        {/* Discount Badge (Clean subtle rectangle, NOT large pill) */}
        {discountPercent > 0 && !isSoldOut && (
          <div 
            className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] shadow-xs z-10 uppercase tracking-tight"
            style={{ borderRadius: '3px' }}
          >
            {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* 2. PRODUCT CONTENT AREA */}
      <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 bg-white text-left" id={`product-content-${product.id}`}>
        <div>
          {/* CATEGORY & UNIT */}
          <div className="flex items-center justify-between gap-1 mb-1" id={`product-header-${product.id}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 truncate">
              {getTranslatedCategoryName(product.category, language)}
            </span>
            <span className="text-[10px] text-gray-400 font-medium shrink-0">{unit}</span>
          </div>

          {/* Product Name (Controlled 2-line clamp, clean alignment) */}
          <h3 
            className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors min-h-[2.1rem] sm:min-h-[2.4rem]" 
            id={`product-title-${product.id}`}
            title={getTranslatedName(product.name, language)}
          >
            {getTranslatedName(product.name, language)}
          </h3>

          {/* Short Description (Clean 1-line clamp) */}
          {shortDesc && (
            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5" title={shortDesc}>
              {shortDesc}
            </p>
          )}
          
          {/* Rating and Reviews (★ 4.8 (24 Reviews)) */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-600" id={`product-stats-${product.id}`}>
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-gray-800 text-xs">{product.rating || '4.8'}</span>
            <span className="text-[10px] text-gray-400">
              ({language === 'bn' ? `${reviewCount} রিভিউ` : `${reviewCount} Reviews`})
            </span>
          </div>

          {/* Stock Status Badge */}
          <div className="flex items-center gap-1.5 mt-1.5" id={`product-stock-badge-${product.id}`}>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] inline-flex items-center gap-1 ${
              isSoldOut 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : stock <= 10 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSoldOut ? 'bg-red-500' : stock <= 10 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {isSoldOut 
                ? (language === 'bn' ? 'স্টক শেষ' : 'Sold Out') 
                : stock <= 10 
                  ? (language === 'bn' ? `সীমিত স্টক (${stock})` : `Low Stock (${stock})`) 
                  : (language === 'bn' ? 'ইন স্টক' : 'In Stock')}
            </span>
          </div>
        </div>

        {/* 3. PRICE & ACTIONS */}
        <div className="mt-2 pt-1 border-t border-gray-50">
          {/* Price line (৳550  ৳650) */}
          <div className="flex items-baseline gap-2" id={`product-price-box-${product.id}`}>
            <span className="text-sm sm:text-base font-extrabold text-emerald-800" id={`product-price-${product.id}`}>
              ৳{price}
            </span>
            {oldPrice > price && (
              <span className="text-xs text-gray-400 line-through font-normal">
                ৳{oldPrice}
              </span>
            )}
          </div>

          {/* Action Button: [ ADD TO CART ] (Clean rectangular, border-radius: 4px) */}
          <button
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className={`w-full mt-2 py-2 px-2 rounded-[4px] flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs ${
              isSoldOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : isAdded 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white'
            }`}
            id={`product-add-btn-${product.id}`}
            style={{ borderRadius: '4px' }}
          >
            {isAdded ? (
              <span>{t('added')}</span>
            ) : isSoldOut ? (
              <span>{language === 'bn' ? 'স্টক শেষ' : 'Sold Out'}</span>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart'}</span>
              </>
            )}
          </button>
          
          {/* Subtle View Details text */}
          <div className="w-full mt-1 text-center">
            <span className="text-[10px] font-medium text-emerald-700 hover:text-emerald-800 group-hover:underline inline-flex items-center gap-0.5">
              {language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
              <ChevronRight size={10} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
