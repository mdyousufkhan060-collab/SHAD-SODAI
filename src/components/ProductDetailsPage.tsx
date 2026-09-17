import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName, getTranslatedCategoryName } from '../utils/translations';
import { offerService } from '../utils/offerService';
import { productService } from '../utils/productService';
import { cartService } from '../utils/cartService';
import { tracking } from '../utils/tracking';
import { reviewService } from '../utils/reviewService';
import { accountService } from '../utils/accountService';
import { CATEGORIES } from '../data';
import { ProductCard } from './ProductCard';
import { Breadcrumbs } from './Breadcrumbs';
import { ProductCheckoutModal } from './ProductCheckoutModal';
import { 
  Star, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  ShieldCheck, 
  Clock, 
  HelpCircle, 
  Layers, 
  Info,
  CheckCircle2,
  AlertCircle,
  Camera,
  X,
  Lock,
  MessageSquare,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Share2,
  Copy,
  Maximize2,
  Sparkles,
  Check,
  Leaf,
  Package,
  Flame,
  Zap,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';

export const ProductDetailsPage = () => {
  const { language, t } = useLanguage();
  
  const toBnNum = (num: number | string) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => bnDigits[parseInt(d, 10)] || d).join('');
  };

  const [currentSlug, setCurrentSlug] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [product, setProduct] = useState<any | null>(null);
  const [specs, setSpecs] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [mainImage, setMainImage] = useState<string>('');
  const [selectedThumbIndex, setSelectedThumbIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'specifications' | 'nutrition' | 'storage' | 'description' | 'delivery' | 'reviews'>('specifications');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);

  // Zoom and Lightbox states
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [zoomPos, setZoomPos] = useState<{ x: number, y: number }>({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Reviews states
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsTotalCount, setReviewsTotalCount] = useState<number>(0);
  const [ratingStats, setRatingStats] = useState<any>({
    averageRating: 0,
    totalCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [formName, setFormName] = useState<string>('');
  const [formText, setFormText] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Current user info
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    accountService.getLoggedInUser().then(setCurrentUser);
  }, []);

  // Parse product slug from hash router on mount and change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      let slug = '';
      if (hash.startsWith('#/product/')) {
        slug = hash.replace('#/product/', '').split('?')[0];
      } else if (hash.startsWith('#/products/')) {
        slug = hash.replace('#/products/', '').split('?')[0];
      }
      if (slug) {
        setCurrentSlug(decodeURIComponent(slug));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Fetch product data and recommendations dynamically
  useEffect(() => {
    if (!currentSlug) return;

    let isMounted = true;
    setIsLoading(true);

    const fetchProduct = async () => {
      try {
        let response = await fetch(`/api/products/${encodeURIComponent(currentSlug)}`);
        if (!response.ok && currentSlug.includes('-')) {
          const potentialId = currentSlug.substring(currentSlug.lastIndexOf('-') + 1);
          response = await fetch(`/api/products/${encodeURIComponent(potentialId)}`);
        }
        if (!response.ok) throw new Error('Product not found');
        const resolvedProduct = await response.json();
        if (!isMounted) return;

        const mappedProduct = {
          ...resolvedProduct,
          imageUrl: resolvedProduct.image_url || resolvedProduct.imageUrl,
          image_url: resolvedProduct.image_url || resolvedProduct.imageUrl,
          oldPrice: resolvedProduct.old_price !== undefined ? resolvedProduct.old_price : resolvedProduct.oldPrice,
          old_price: resolvedProduct.old_price !== undefined ? resolvedProduct.old_price : resolvedProduct.oldPrice,
          stock_quantity: resolvedProduct.stock_quantity !== undefined ? resolvedProduct.stock_quantity : 50,
          slug: resolvedProduct.slug || resolvedProduct.id,
        };

        setProduct(mappedProduct);
        const extension = productService.getProductExtension(resolvedProduct.id, resolvedProduct.name);
        setSpecs(extension);

        // Determine image gallery
        const dbImages = productService.getProductImages(resolvedProduct.id);
        const primaryImgRow = dbImages.find(img => img.is_primary) || dbImages[0];
        const primaryUrl = resolvedProduct.images?.[0] || resolvedProduct.gallery?.[0] || (primaryImgRow ? primaryImgRow.image_url : (mappedProduct.imageUrl || mappedProduct.image_url));
        setMainImage(primaryUrl);
        setSelectedThumbIndex(0);

        setQuantity(1);
        cartService.isInWishlist(resolvedProduct.id).then(setIsWishlisted);

        // Fetch variants
        let pVariants = resolvedProduct.variants && Array.isArray(resolvedProduct.variants) && resolvedProduct.variants.length > 0
          ? resolvedProduct.variants
          : productService.getProductVariants(resolvedProduct.id);

        if (!pVariants || pVariants.length === 0) {
          // Default dry food standard variants fallback
          pVariants = [
            { id: 1, name: '100g', weight_grams: 100, price: mappedProduct.price ? Math.round(mappedProduct.price * 0.45) : 180, is_active: true },
            { id: 2, name: '250g', weight_grams: 250, price: mappedProduct.price || 380, is_active: true, is_default: true },
            { id: 3, name: '500g', weight_grams: 500, price: mappedProduct.price ? Math.round(mappedProduct.price * 1.9) : 720, is_active: true },
            { id: 4, name: '1kg', weight_grams: 1000, price: mappedProduct.price ? Math.round(mappedProduct.price * 3.7) : 1400, is_active: true }
          ];
        }

        setVariants(pVariants);
        // Requirement 3: When multiple variants exist, user MUST explicitly select one before ordering/adding to cart
        if (pVariants.length > 1) {
          setSelectedVariant(null);
        } else if (pVariants.length === 1) {
          setSelectedVariant(pVariants[0]);
        } else {
          setSelectedVariant(null);
        }

        // Fetch recommendations (min 6, max 10 priority based)
        try {
          const recTarget = resolvedProduct.slug || resolvedProduct.id;
          const recRes = await fetch(`/api/products/${encodeURIComponent(recTarget)}/recommendations`);
          if (recRes.ok) {
            const recData = await recRes.json();
            if (recData.products && recData.products.length > 0) {
              const mappedRecs = recData.products.map((p: any) => ({
                ...p,
                imageUrl: p.image_url || p.imageUrl,
                image_url: p.image_url || p.imageUrl,
                oldPrice: p.old_price !== undefined ? p.old_price : p.oldPrice,
                old_price: p.old_price !== undefined ? p.old_price : p.oldPrice,
                stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : 50,
                slug: p.slug || p.id
              }));
              setRecommendations(mappedRecs);
            } else {
              setRecommendations(productService.getRelatedProducts(resolvedProduct.id, resolvedProduct.category));
            }
          } else {
            setRecommendations(productService.getRelatedProducts(resolvedProduct.id, resolvedProduct.category));
          }
        } catch {
          setRecommendations(productService.getRelatedProducts(resolvedProduct.id, resolvedProduct.category));
        }

        // Fetch ratings & reviews
        try {
          const stats = await reviewService.getProductRatingStats(resolvedProduct.id);
          setRatingStats(stats);
          setReviewsTotalCount(stats.totalCount);
          const revRes = await reviewService.getReviewsForProduct(resolvedProduct.id, 1, 10);
          setReviewsList(revRes.reviews || []);
        } catch (rErr) {
          console.warn('Reviews fetch warning', rErr);
        }

      } catch (err) {
        console.error('Error fetching product:', err);
        setProduct(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProduct();

    return () => {
      isMounted = false;
    };
  }, [currentSlug]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Safe fallback if product is null and not loading
  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-8" id="product-details-skeleton">
        <div className="h-6 bg-gray-200 rounded-md w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-6 space-y-4">
            <div className="aspect-square bg-gray-200 rounded-2xl w-full" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="md:col-span-6 space-y-5">
            <div className="h-5 bg-gray-200 rounded w-1/4" />
            <div className="h-9 bg-gray-200 rounded w-3/4" />
            <div className="h-5 bg-gray-200 rounded w-1/2" />
            <div className="h-12 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded-xl w-full" />
            <div className="flex gap-4">
              <div className="h-12 bg-gray-200 rounded-xl flex-1" />
              <div className="h-12 bg-gray-200 rounded-xl flex-1" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center space-y-5" id="product-not-found-view">
        <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-800">
          {language === 'bn' ? 'পণ্যটি খুঁজে পাওয়া যায়নি' : 'Product Not Found'}
        </h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto font-medium">
          {language === 'bn' 
            ? 'আপনি যে পণ্যটি খুঁজছেন তা হয়তো সরানো হয়েছে অথবা লিংকটি সঠিক নয়।' 
            : 'The product you are looking for may have been removed or the link is incorrect.'}
        </p>
        <a 
          href="#/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          <span>{language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}</span>
        </a>
      </main>
    );
  }

  // Inventory & Pricing calculations
  const rawStock = product.stock_quantity !== undefined 
    ? Number(product.stock_quantity) 
    : offerService.getInventoryStock(product.id);
  const stock = selectedVariant ? (selectedVariant.stock_quantity ?? rawStock) : rawStock;
  const isSoldOut = stock <= 0;

  // Requirement 3: Multi-variant check and mandatory selection rules
  const hasMultipleVariants = variants && variants.length > 1;
  const isVariantRequiredAndMissing = hasMultipleVariants && !selectedVariant;
  const isActionDisabled = isSoldOut || isVariantRequiredAndMissing;

  const validVariantPrices = variants && variants.length > 0 
    ? variants.map((v: any) => Number(v.price) || 0).filter(p => p > 0) 
    : [];
  const minVariantPrice = validVariantPrices.length > 0 ? Math.min(...validVariantPrices) : (product.price || 0);
  const maxVariantPrice = validVariantPrices.length > 0 ? Math.max(...validVariantPrices) : (product.price || 0);

  // Price calculations based on selected variant
  const basePrice = selectedVariant 
    ? Number(selectedVariant.price) 
    : (hasMultipleVariants ? minVariantPrice : (Number(product.price) || 0));

  const rawOldPrice = selectedVariant 
    ? (selectedVariant.old_price || selectedVariant.oldPrice || (selectedVariant.price ? Math.round(selectedVariant.price * 1.15) : 0))
    : (product.oldPrice || product.old_price || (product.discount_percent ? Math.round(basePrice / (1 - product.discount_percent / 100)) : (basePrice > 0 ? Math.round(basePrice * 1.15) : 0)));

  const baseOldPrice = Number(rawOldPrice) || 0;
  const discountPercent = baseOldPrice > basePrice ? Math.round(((baseOldPrice - basePrice) / baseOldPrice) * 100) : 0;

  const priceDetails = {
    price: basePrice,
    oldPrice: baseOldPrice,
    discountPercent
  };

  // Image strip derivation
  const dbImages = productService.getProductImages(product.id);
  const fallbackImg = "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=800&fit=crop";
  const allImages: string[] = (product.images && product.images.length > 0)
    ? product.images
    : (product.gallery && Array.isArray(product.gallery) && product.gallery.length > 0)
      ? product.gallery
      : (dbImages && dbImages.length > 0)
        ? dbImages.map(img => img.image_url)
        : [product.imageUrl || product.image_url || fallbackImg];

  // Increase / Decrease Quantity handlers
  const handleIncrease = () => {
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    } else {
      showToast('error', language === 'bn' ? `স্টক সীমাবদ্ধতা! সর্বোচ্চ ${stock}টি অর্ডার সম্ভব` : `Stock limit! Only ${stock} units remaining.`);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
      setQuantity(1);
    } else if (val > stock) {
      setQuantity(stock);
      showToast('error', language === 'bn' ? `সর্বোচ্চ ${stock}টি অর্ডার সম্ভব` : `Max available stock is ${stock} units.`);
    } else {
      setQuantity(val);
    }
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (isActionDisabled) {
      if (isVariantRequiredAndMissing) {
        showToast('error', language === 'bn' ? 'অনুগ্রহ করে প্রথমে একটি ওজন বা সাইজ নির্বাচন করুন।' : 'Please select a weight or size first.');
      }
      return;
    }
    const result = cartService.addToCart(product.id, quantity, selectedVariant?.id);
    if (result.success) {
      showToast('success', language === 'bn' ? 'পণ্যটি কার্টে যুক্ত করা হয়েছে!' : 'Item successfully added to your cart!');
      tracking.track('AddToCart', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: priceDetails.price * quantity,
        currency: 'BDT'
      });
    } else {
      showToast('error', result.message);
    }
  };

  // Buy Now Flow (ORDER NOW)
  const handleBuyNow = async () => {
    if (isActionDisabled) {
      if (isVariantRequiredAndMissing) {
        showToast('error', language === 'bn' ? 'অনুগ্রহ করে প্রথমে একটি ওজন বা সাইজ নির্বাচন করুন।' : 'Please select a weight or size first.');
      }
      return;
    }
    const result = cartService.initiateBuyNow(product.id, quantity, selectedVariant?.id);
    if (result.success) {
      tracking.track('InitiateCheckout', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: priceDetails.price * quantity,
        currency: 'BDT',
        contents: [{
          id: product.id,
          name: product.name,
          quantity: quantity,
          item_price: priceDetails.price
        }]
      });
      setCheckoutModalOpen(true);
    } else {
      showToast('error', result.message);
    }
  };

  // Wishlist Toggle
  const handleToggleWishlist = async () => {
    const isAddedNow = await cartService.toggleWishlist(product.id);
    setIsWishlisted(isAddedNow);
    if (isAddedNow) {
      showToast('success', language === 'bn' ? 'পছন্দের তালিকায় যুক্ত হয়েছে' : 'Added to your Wishlist!');
    } else {
      showToast('success', language === 'bn' ? 'পছন্দের তালিকা থেকে সরানো হয়েছে' : 'Removed from your Wishlist!');
    }
  };

  // Next / Previous thumbnail gallery navigators
  const handleNextThumb = () => {
    const nextIndex = (selectedThumbIndex + 1) % allImages.length;
    setSelectedThumbIndex(nextIndex);
    setMainImage(allImages[nextIndex]);
  };

  const handlePrevThumb = () => {
    const prevIndex = (selectedThumbIndex - 1 + allImages.length) % allImages.length;
    setSelectedThumbIndex(prevIndex);
    setMainImage(allImages[prevIndex]);
  };

  // Image Zoom Lens calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) handleNextThumb();
    else if (diff < -50) handlePrevThumb();
    setTouchStart(null);
  };

  // Share handlers
  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = getTranslatedName(product.name, language);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('success', language === 'bn' ? 'লিঙ্ক কপি করা হয়েছে!' : 'Product link copied to clipboard!');
      } catch {
        showToast('error', 'Could not copy link');
      }
    }
  };

  // Review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) {
      setFormError(language === 'bn' ? 'অনুগ্রহ করে আপনার নাম ও মতামত লিখুন।' : 'Please enter your name and comment.');
      return;
    }
    setIsSubmittingReview(true);
    setFormError(null);
    try {
      await reviewService.submitReview({
        product_id: product.id,
        product_name: product.name,
        product_image: mainImage || product.imageUrl,
        rating: formRating,
        comment: formText.trim(),
        images: []
      });
      setFormSuccess(true);
      setFormName('');
      setFormText('');
      setTimeout(() => {
        setIsReviewFormOpen(false);
        setFormSuccess(false);
      }, 2000);
      // Refresh reviews
      const stats = await reviewService.getProductRatingStats(product.id);
      setRatingStats(stats);
      const revRes = await reviewService.getReviewsForProduct(product.id, 1, 10);
      setReviewsList(revRes.reviews || []);
    } catch {
      setFormError(language === 'bn' ? 'রিভিউ জমা দেওয়া সম্ভব হয়নি।' : 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Smooth scroll to reviews tab
  const handleScrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Structured Specifications map
  const productSpecs = product.specifications && Object.keys(product.specifications).length > 0
    ? product.specifications
    : {
        "Product Type": language === 'bn' ? 'ড্রাইড ফুড' : 'Dry Food',
        "Brand": specs?.brand || 'SHAD GHOR',
        "Net Weight": selectedVariant?.name || specs?.unit || specs?.weight || '250g',
        "Ingredients": product.ingredients || specs?.ingredients || (language === 'bn' ? '১০০% প্রাকৃতিক উপাদান' : '100% Natural Ingredients'),
        "Origin": specs?.origin || 'Bangladesh',
        "Packaging": 'Food Grade Air-tight Pack',
        "Storage": product.storage || specs?.storage || (language === 'bn' ? 'শুকনো ও ঠান্ডা স্থানে রাখুন' : 'Store in a cool, dry place'),
        "Shelf Life": specs?.shelf_life || '12 Months',
        "SKU": selectedVariant?.sku || specs?.sku || product.sku || 'SHG-DF-001',
        "Category": getTranslatedCategoryName(product.category, language)
      };

  const keyFeatures: string[] = (product.key_features && product.key_features.length > 0)
    ? product.key_features
    : (specs?.highlights && specs.highlights.length > 0)
      ? specs.highlights
      : [
          '১০০% প্রাকৃতিক ও ফরমালিনমুক্ত',
          'স্বাস্থ্যসম্মত খাদ্য-গ্রেড প্যাকেজিং',
          'ভিটামিন ও খনিজে ভরপুর খাঁটি পুষ্টি',
          'কোনো কৃত্রিম রং বা প্রিজারভেটিভ নেই'
        ];

  const nutritionList: { nutrient: string; per100g: string }[] = (product.nutrition && Array.isArray(product.nutrition) && product.nutrition.length > 0)
    ? product.nutrition
    : [
        { nutrient: language === 'bn' ? 'শক্তি (Energy)' : 'Energy', per100g: '320 kcal' },
        { nutrient: language === 'bn' ? 'প্রোটিন (Protein)' : 'Protein', per100g: '2.8 g' },
        { nutrient: language === 'bn' ? 'কার্বোহাইড্রেট (Carbohydrate)' : 'Carbohydrate', per100g: '78 g' },
        { nutrient: language === 'bn' ? 'চর্বি (Fat)' : 'Fat', per100g: '0.8 g' },
        { nutrient: language === 'bn' ? 'ফাইবার (Dietary Fiber)' : 'Dietary Fiber', per100g: '4.5 g' },
        { nutrient: language === 'bn' ? 'প্রাকৃতিক চিনি (Natural Sugars)' : 'Natural Sugars', per100g: '62 g' }
      ];

  return (
    <main className="max-w-7xl mx-auto px-4 pt-4 pb-28 space-y-8 animate-fade-in" id="product-details-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className={`fixed top-18 right-4 left-4 sm:left-auto sm:w-80 z-50 p-3.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 border animate-slide-in ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
          id="toast-alert"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { 
            label: getTranslatedCategoryName(product.category, language), 
            link: `#/category/${CATEGORIES.find(c => c.name === product.category)?.slug || ''}` 
          },
          { 
            label: getTranslatedName(product.name, language), 
            active: true 
          }
        ]} 
      />

      {/* CORE 2-COLUMN GRID (Gallery on Left, Info on Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start" id="product-core-grid">
        
        {/* LEFT COLUMN: IMAGE GALLERY SYSTEM */}
        <div className="md:col-span-6 space-y-3" id="gallery-left-block">
          
          {/* Main Large Image Frame with Zoom Lens & Swipe */}
          <div 
            className="relative aspect-square w-full rounded-lg border border-gray-200 bg-[#fbfbfb] overflow-hidden flex items-center justify-center select-none cursor-crosshair group shadow-xs" 
            id="main-image-viewport"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img 
              src={mainImage} 
              alt={getTranslatedName(product.name, language)} 
              className={`w-full h-full object-contain p-4 sm:p-6 transition-transform duration-200 ease-out ${
                isZoomed ? 'scale-150 pointer-events-none' : 'scale-100'
              } ${isSoldOut ? 'opacity-40 grayscale-[40%]' : ''}`}
              style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImg;
              }}
              id="main-large-img"
              loading="eager"
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.badge && (
                <span className="bg-emerald-700 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-sm shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{product.badge}</span>
                </span>
              )}
              {isSoldOut ? (
                <span className="bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-sm shadow-xs">
                  {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
                </span>
              ) : stock <= 5 ? (
                <span className="bg-amber-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-sm shadow-xs animate-pulse">
                  {language === 'bn' ? `মাত্র ${toBnNum(stock)}টি বাকি` : `Only ${stock} left`}
                </span>
              ) : null}
            </div>

            {priceDetails.discountPercent > 0 && !isSoldOut && (
              <span className="absolute top-3 right-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-sm shadow-sm uppercase z-10 pointer-events-none">
                {priceDetails.discountPercent}% {language === 'bn' ? 'ছাড়' : 'OFF'}
              </span>
            )}

            {/* Lightbox trigger button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 w-8 h-8 rounded-md bg-white/95 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-xs hover:scale-105 transition-all cursor-pointer z-10"
              title={language === 'bn' ? 'বড় করে দেখুন' : 'View Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Navigational Arrows */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrevThumb(); }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-xs text-gray-700 hover:scale-105 transition-all cursor-pointer z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNextThumb(); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-md flex items-center justify-center shadow-xs text-gray-700 hover:scale-105 transition-all cursor-pointer z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails Row */}
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x" id="thumbnails-strip">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedThumbIndex(idx);
                    setMainImage(imgUrl);
                  }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md border p-1 bg-white overflow-hidden shrink-0 snap-start transition-all cursor-pointer ${
                    selectedThumbIndex === idx 
                      ? 'border-2 border-emerald-700 ring-2 ring-emerald-600/20 shadow-xs' 
                      : 'border-gray-200 hover:border-gray-300 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Thumbnail ${idx + 1}`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImg;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CORE PRODUCT INFORMATION */}
        <div className="md:col-span-6 space-y-4" id="product-info-column">
          
          {/* Category & Brand Header */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <a 
                href={`#/category/${CATEGORIES.find(c => c.name === product.category)?.slug || ''}`}
                className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200 hover:bg-emerald-100 transition-colors"
              >
                {getTranslatedCategoryName(product.category, language)}
              </a>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                SHAD GHOR
              </span>
            </div>

            {/* Wishlist button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`p-2 rounded-md border transition-all cursor-pointer ${
                isWishlisted 
                  ? 'border-rose-300 bg-rose-50 text-rose-600' 
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-400 hover:text-gray-600'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Product Title */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
              {getTranslatedName(product.name, language)}
            </h1>
            {language !== 'bn' && product.name_bn && (
              <p className="text-sm font-semibold text-gray-500 mt-0.5">{product.name_bn}</p>
            )}
            {language === 'bn' && product.name !== product.name_bn && (
              <p className="text-xs font-semibold text-gray-400 mt-0.5">{product.name}</p>
            )}
          </div>

          {/* Rating and Reviews Counter Bar */}
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleScrollToReviews}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group"
            >
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${
                      (product.rating || ratingStats.averageRating || 4.8) >= star 
                        ? 'fill-amber-500 text-amber-500' 
                        : 'text-gray-200'
                    }`} 
                  />
                ))}
              </div>
              <span className="font-extrabold text-gray-800 ml-1">
                {(product.rating || ratingStats.averageRating || 4.8).toFixed(1)}
              </span>
              <span className="text-gray-400 font-bold group-hover:text-emerald-700 transition-colors">
                ({reviewsTotalCount || product.review_count || 12} {language === 'bn' ? 'রিভিউ' : 'reviews'})
              </span>
            </button>
            <span className="text-gray-300">•</span>
            <span className="text-gray-400 font-bold text-[11px]">
              SKU: <strong className="text-gray-700">{selectedVariant?.sku || specs?.sku || product.sku || 'SHG-DF-001'}</strong>
            </span>
          </div>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
            {language === 'bn' 
              ? (specs?.short_description_bn || product.short_description || `আমাদের প্রিমিয়াম মানের ${getTranslatedName(product.name, language)} সম্পূর্ণ প্রাকৃতিকভাবে প্রক্রিয়াজাত এবং পুষ্টিগুণে ভরপুর।`) 
              : (specs?.short_description || product.short_description || `Premium handpicked ${product.name} sourced directly to ensure maximum freshness, hygienic packing, and authentic taste.`)}
          </p>

          {/* Price Block */}
          <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200 flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-2.5">
                {isVariantRequiredAndMissing && minVariantPrice !== maxVariantPrice ? (
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                    ৳{toBnNum(minVariantPrice)} - ৳{toBnNum(maxVariantPrice)}
                  </span>
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                    ৳{toBnNum(priceDetails.price)}
                  </span>
                )}
                {priceDetails.oldPrice > priceDetails.price && (
                  <span className="text-sm font-bold text-gray-400 line-through">
                    ৳{toBnNum(priceDetails.oldPrice)}
                  </span>
                )}
              </div>

              {priceDetails.discountPercent > 0 && (
                <span className="bg-red-50 text-red-700 border border-red-200 font-black text-xs px-2.5 py-1 rounded-sm">
                  {toBnNum(priceDetails.discountPercent)}% {language === 'bn' ? 'ছাড়' : 'OFF'}
                </span>
              )}
            </div>

            {isVariantRequiredAndMissing && (
              <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'bn' ? 'অর্ডার বা কার্টে যোগ করতে অনুগ্রহ করে নিচে ওজন নির্বাচন করুন' : 'Please select weight below to order or add to cart'}</span>
              </p>
            )}
          </div>

          {/* Weight / Size Variants Selector (MANDATORY REQUIREMENT) */}
          {variants.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 uppercase tracking-wider text-[11px] font-black flex items-center gap-1">
                  <span>{language === 'bn' ? 'ওজন / সাইজ নির্বাচন করুন:' : 'Select Weight / Size:'}</span>
                  <span className="text-red-500">*</span>
                </span>
                {selectedVariant ? (
                  <span className="text-emerald-800 font-black bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 text-[11px]">
                    {selectedVariant.name}
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold text-[11px] animate-pulse">
                    {language === 'bn' ? 'নির্বাচন আবশ্যক' : 'Required'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      className={`p-2.5 rounded-md text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                        isSelected 
                          ? 'border-2 border-emerald-700 bg-emerald-50/80 text-emerald-900 font-black ring-1 ring-emerald-700 shadow-xs' 
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-xs font-black">{variant.name}</span>
                      <span className={`text-[11px] ${isSelected ? 'text-emerald-800 font-black' : 'text-gray-500'}`}>
                        ৳{toBnNum(variant.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Availability Status */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-gray-400 uppercase text-[10px] font-black tracking-wider">
              {language === 'bn' ? 'প্রাপ্যতা:' : 'Availability:'}
            </span>
            {isSoldOut ? (
              <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-sm border border-red-200">
                {language === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            ) : stock <= 5 ? (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                {language === 'bn' ? `মাত্র ${toBnNum(stock)}টি স্টকে আছে` : `Only ${stock} items left`}
              </span>
            ) : (
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                <span>{language === 'bn' ? 'স্টকে আছে' : 'In Stock'}</span>
              </span>
            )}
          </div>

          {/* Quantity Selector & Total Preview */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
              {language === 'bn' ? 'পরিমাণ' : 'Quantity'}
            </label>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center border border-gray-300 rounded-md bg-white overflow-hidden shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={isSoldOut || quantity <= 1}
                  className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={quantity}
                  onChange={handleQuantityInput}
                  disabled={isSoldOut}
                  className="w-12 h-9 border-none text-center font-black text-xs text-gray-900 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={isSoldOut || quantity >= stock}
                  className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {language === 'bn' ? 'মোট মূল্য' : 'Subtotal'}
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  ৳{toBnNum(priceDetails.price * quantity)}
                </span>
              </div>
            </div>
          </div>

          {/* Share Product Bar (Clean & soft-square) */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold flex items-center gap-1.5 text-gray-500 text-[11px] uppercase tracking-wider">
              <Share2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'bn' ? 'শেয়ার করুন:' : 'Share Product:'}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShare('copy')}
                className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Copy Link"
              >
                <Copy className="w-3 h-3" />
                <span>{language === 'bn' ? 'কপি লিংক' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare('whatsapp')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md text-[11px] font-bold text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Share on WhatsApp"
              >
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleShare('facebook')}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md text-[11px] font-bold text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Share on Facebook"
              >
                <span>Facebook</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* KEY FEATURES / HIGHLIGHTS SECTION (Clean Horizontal Rows, subtle divider) */}
      {keyFeatures && keyFeatures.length > 0 && (
        <section className="bg-white rounded-md border border-gray-200 p-4 sm:p-5 space-y-3" id="key-features-section">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <h3 className="font-black text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>{language === 'bn' ? 'পণ্যের মূল বৈশিষ্ট্যসমূহ' : 'Key Highlights & Features'}</span>
            </h3>
            <span className="text-[11px] font-bold text-gray-400">
              SHAD GHOR PREMIUM QUALITY
            </span>
          </div>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden bg-gray-50/40">
            {keyFeatures.map((feat, fidx) => (
              <div 
                key={fidx} 
                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50/80 transition-colors text-xs text-gray-800 font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="leading-normal flex-1">{feat}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TABS NAVIGATION SYSTEM (Simple, modern, soft-square, SHAD GHOR Green active) */}
      <div className="border-b border-gray-200 pt-3" id="pdp-tabs-nav">
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none snap-x text-xs">
          {[
            { id: 'specifications', label: language === 'bn' ? 'স্পেসিফিকেশন' : 'Specifications' },
            { id: 'nutrition', label: language === 'bn' ? 'উপাদান ও পুষ্টি' : 'Nutrition Facts' },
            { id: 'storage', label: language === 'bn' ? 'সংরক্ষণ ও ব্যবহার' : 'Storage & Usage' },
            { id: 'description', label: language === 'bn' ? 'পণ্যের বিবরণ' : 'Description' },
            { id: 'delivery', label: language === 'bn' ? 'ডেলিভারি ও রিটার্ন' : 'Delivery & Return' },
            { id: 'reviews', label: `${language === 'bn' ? 'কাস্টমার রিভিউ' : 'Reviews'} (${reviewsTotalCount || ratingStats.totalCount || 0})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-t-md text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start flex items-center gap-1.5 ${
                  isActive 
                    ? 'border-b-2 border-emerald-700 bg-emerald-50 text-emerald-900 font-black' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b-2 border-transparent font-bold'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS CONTENT CONTAINER */}
      <div className="bg-white rounded-b-md border border-t-0 border-gray-200 p-4 sm:p-6 shadow-2xs" id="tabs-content-block">
        
        {/* TAB 1: DESCRIPTION */}
        {activeTab === 'description' && (
          <div className="space-y-4 animate-fade-in" id="tab-content-description">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
              {language === 'bn' ? 'পণ্য সম্পর্কে বিস্তারিত' : 'About This Product'}
            </h3>
            <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 font-medium">
              <p className="whitespace-pre-line">
                {language === 'bn' 
                  ? (specs?.description_bn || product.description || `স্বাদ ঘর-এর প্রিমিয়াম ${getTranslatedName(product.name, language)} সম্পূর্ণ প্রাকৃতিকভাবে সংগৃহীত এবং স্বাস্থ্যকর পরিবেশে ড্রাই করা। এতে কোনো কৃত্রিম রং, স্বাদ বা ক্ষতিকর প্রিজারভেটিভ নেই। এটি শিশুদের জন্য যেমন স্বাস্থ্যকর নাস্তা, তেমনই পরিবারের সবার পুষ্টি নিশ্চিত করতে দারুণ উপকারী।`) 
                  : (specs?.description || product.description || `Shad Ghor premium quality ${product.name} is processed naturally under hygienic conditions. Completely free from artificial coloring, chemicals, or harmful preservatives. An ideal healthy snack for all family members packed with natural sweetness and fiber.`)}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: KEY FEATURES */}
        {activeTab === 'features' && (
          <div className="space-y-4 animate-fade-in" id="tab-content-features">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
              {language === 'bn' ? 'পণ্যের মূল বৈশিষ্ট্য' : 'Key Features'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50/70 border border-gray-100 rounded-xl text-xs font-bold text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SPECIFICATIONS */}
        {activeTab === 'specifications' && (
          <div className="space-y-4 animate-fade-in" id="tab-content-specifications">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
              {language === 'bn' ? 'প্রোডাক্ট স্পেসিফিকেশন' : 'Technical Specifications'}
            </h3>
            <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
              {Object.entries(productSpecs).map(([key, value], idx) => (
                <div key={idx} className={`grid grid-cols-3 p-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">{key}</span>
                  <span className="col-span-2 font-bold text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INGREDIENTS & NUTRITION */}
        {activeTab === 'nutrition' && (
          <div className="space-y-6 animate-fade-in" id="tab-content-nutrition">
            {/* Ingredients */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'উপাদানসমূহ (Ingredients)' : 'Ingredients'}</span>
              </h3>
              <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-xs font-bold text-gray-700 leading-relaxed">
                {product.ingredients || specs?.ingredients || (language === 'bn' ? '১০০% প্রাকৃতিক ড্রাই ফ্রুটস / খাদ্যশস্য (কোনো কৃত্রিম ফ্লেভার বা মিষ্টিযুক্ত নয়)।' : '100% pure dried fruits / natural organic food ingredients without any added sugars or artificial additives.')}
              </div>
            </div>

            {/* Nutrition Facts Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{language === 'bn' ? 'পুষ্টি উপাদান (Nutrition Facts per 100g)' : 'Nutrition Facts (Per 100g)'}</span>
              </h3>
              <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                <div className="grid grid-cols-2 p-3 bg-gray-100/70 font-black text-gray-700 text-[11px] uppercase">
                  <span>{language === 'bn' ? 'পুষ্টিগুণ (Nutrient)' : 'Nutrient'}</span>
                  <span className="text-right">{language === 'bn' ? 'প্রতি ১০০ গ্রামে' : 'Amount / 100g'}</span>
                </div>
                {nutritionList.map((item, nidx) => (
                  <div key={nidx} className={`grid grid-cols-2 p-3 ${nidx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <span className="font-bold text-gray-700">{item.nutrient}</span>
                    <span className="text-right font-black text-emerald-700">{item.per100g}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STORAGE & USAGE */}
        {activeTab === 'storage' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in" id="tab-content-storage">
            <div className="p-5 bg-gray-50/70 border border-gray-150 rounded-xl space-y-2.5">
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'সংরক্ষণ পদ্ধতি' : 'How to Store'}</span>
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {product.storage || specs?.storage || (language === 'bn' 
                  ? 'প্যাকেট খোলার পর জিপ-লক সিল ভালোভাবে আটকে ঠান্ডা ও শুষ্ক জায়গায় রাখুন। সরাসরি রোদ বা আর্দ্রতা থেকে দূরে রাখুন। চাইলে কাঁচের এয়ারটাইট বয়ামে রেখে দীর্ঘদিন সংরক্ষণ করতে পারেন।' 
                  : 'Store in a cool, dry place away from moisture and direct sunlight. Once opened, keep sealed in its ziplock pouch or transfer to an airtight glass container.')}
              </p>
            </div>

            <div className="p-5 bg-gray-50/70 border border-gray-150 rounded-xl space-y-2.5">
              <h4 className="text-xs font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{language === 'bn' ? 'ব্যবহারবিধি' : 'How to Use / Serving Ideas'}</span>
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {product.usage || specs?.usage || (language === 'bn' 
                  ? 'সরাসরি হেলদি স্ন্যাকস হিসেবে খাওয়া যায়। এছাড়া সকালের ওটস, কর্নফ্লেক্স, কাস্টার্ড বা স্মুদির সাথে মিশিয়ে খাওয়া যায়।' 
                  : 'Ready to eat straight from the pouch. Excellent as an on-the-go snack, or mixed into breakfast oats, yogurts, granolas, and desserts.')}
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: DELIVERY & POLICY */}
        {activeTab === 'delivery' && (
          <div className="space-y-6 animate-fade-in" id="tab-content-delivery">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50/60 border border-gray-150 rounded-xl space-y-2">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'ডেলিভারি তথ্য' : 'Delivery Information'}</span>
                </h4>
                <ul className="text-xs text-gray-600 space-y-1.5 list-disc list-inside font-medium">
                  <li>{language === 'bn' ? 'সারাদেশে হোম ডেলিভারি উপলব্ধ' : 'Nationwide home delivery available.'}</li>
                  <li>{language === 'bn' ? 'ঢাকার ভিতরে ২৪-৪৮ ঘণ্টার মধ্যে দ্রুত পৌঁছানো' : 'Inside Dhaka: 24 to 48 hours.'}</li>
                  <li>{language === 'bn' ? 'ঢাকার বাইরে ২-৪ কার্যদিবস' : 'Outside Dhaka: 2 to 4 business days.'}</li>
                  <li>{language === 'bn' ? 'ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে' : 'Cash on delivery supported.'}</li>
                </ul>
              </div>

              <div className="p-4 bg-gray-50/60 border border-gray-150 rounded-xl space-y-2">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? '৭ দিনের সহজ রিটার্ন পলিসি' : '7 Days Return Policy'}</span>
                </h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                  {language === 'bn' 
                    ? 'পণ্য গ্রহণের সময় কোনো ত্রুটি বা অসন্তুষ্টি থাকলে ডেলিভারি ম্যানের উপস্থিতিতেই যাচাই করে ফেরত দিতে পারেন। সম্পূর্ণ রিফান্ড অথবা দ্রুত রিপ্লেসমেন্টের নিশ্চয়তা।' 
                    : 'If unsatisfied or if any defect is detected, return it immediately or claim replacement within 7 days in original condition.'}
                </p>
              </div>
            </div>

            {/* FAQs Accordion */}
            {specs?.faqs && specs.faqs.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'bn' ? 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)' : 'Frequently Asked Questions'}</span>
                </h4>
                <div className="space-y-2">
                  {specs.faqs.map((faq: any, fidx: number) => {
                    const isOpen = openFaqIndex === fidx;
                    return (
                      <div key={fidx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : fidx)}
                          className="w-full p-3.5 flex items-center justify-between text-left font-bold text-xs text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                          <span>{language === 'bn' ? (faq.question_bn || faq.question) : faq.question}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                        </button>
                        {isOpen && (
                          <div className="p-3.5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/40">
                            {language === 'bn' ? (faq.answer_bn || faq.answer) : faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REVIEWS */}
        {activeTab === 'reviews' && (
          <div ref={reviewsSectionRef} className="space-y-6 animate-fade-in" id="tab-content-reviews">
            
            {/* Review Header & Write Review Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  {language === 'bn' ? 'কাস্টমার রিভিউ ও রেটিং' : 'Customer Reviews & Ratings'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  {language === 'bn' 
                    ? `যাচাইকৃত ক্রেতাদের নির্ভরযোগ্য মতামত (${reviewsTotalCount} টি রিভিউ)` 
                    : `Verified buyer feedback and ratings (${reviewsTotalCount} reviews)`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-3xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'রিভিউ লিখুন' : 'Write a Review'}</span>
              </button>
            </div>

            {/* Statistical Rating Summary */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gray-50/50 border border-gray-150 rounded-2xl p-5">
              <div className="md:col-span-4 text-center space-y-1.5">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                  {language === 'bn' ? 'গড় স্কোর' : 'AVERAGE RATING'}
                </span>
                <div className="text-4xl font-black text-gray-900 tracking-tight">
                  {(product.rating || ratingStats.averageRating || 4.8).toFixed(1)}
                  <span className="text-xs text-gray-400 font-bold"> / 5.0</span>
                </div>
                <div className="flex justify-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${
                        (product.rating || ratingStats.averageRating || 4.8) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-200'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 font-bold">
                  {reviewsTotalCount || 12} {language === 'bn' ? 'ক্রেতার মতামত অনুযায়ী' : 'total verified ratings'}
                </p>
              </div>

              {/* Breakdown Bars */}
              <div className="md:col-span-8 space-y-1.5 text-xs">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratingStats.distribution?.[stars] || (stars === 5 ? 10 : stars === 4 ? 2 : 0);
                  const total = reviewsTotalCount || 12;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-10 text-right font-bold text-gray-500 flex items-center justify-end gap-1">
                        {stars} <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                      <span className="w-12 text-right text-gray-400 font-bold text-[10px]">
                        {pct}% ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Submission Form Modal / Box */}
            {isReviewFormOpen && (
              <form onSubmit={handleReviewSubmit} className="p-5 border border-emerald-200 bg-emerald-50/20 rounded-2xl space-y-4 animate-fade-in">
                <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wider">
                  {language === 'bn' ? 'আপনার অভিজ্ঞতা ও মতামত দিন' : 'Leave Your Review'}
                </h4>

                {formSuccess ? (
                  <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'ধন্যবাদ! আপনার রিভিউটি সংরক্ষিত হয়েছে।' : 'Thank you! Your review has been saved.'}</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        {language === 'bn' ? 'রেটিং দিন' : 'Select Rating'}
                      </label>
                      <div className="flex gap-1 text-amber-400 cursor-pointer">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFormRating(s)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${s <= formRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                          {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
                        </label>
                        <input
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder={language === 'bn' ? 'যেমন: মোহাম্মদ রাসেল' : 'e.g. Rasel Ahmed'}
                          className="w-full h-10 px-3 border border-gray-200 bg-white rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        {language === 'bn' ? 'মতামত বা মন্তব্য' : 'Review Comment'}
                      </label>
                      <textarea
                        rows={3}
                        value={formText}
                        onChange={(e) => setFormText(e.target.value)}
                        placeholder={language === 'bn' ? 'পণ্যটির স্বাদ ও মান সম্পর্কে লিখুন...' : 'Write about product quality, taste, packing...'}
                        className="w-full p-3 border border-gray-200 bg-white rounded-xl text-xs font-medium outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    {formError && (
                      <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{formError}</span>
                      </p>
                    )}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(false)}
                        className="px-4 py-2 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        {language === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-3xs cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingReview ? (language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...') : (language === 'bn' ? 'রিভিউ প্রকাশ করুন' : 'Submit Review')}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* Verified Reviews List */}
            <div className="space-y-3 pt-2">
              {reviewsList && reviewsList.length > 0 ? (
                reviewsList.map((rev: any, ridx: number) => (
                  <div key={ridx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {(rev.user_name || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-gray-800 flex items-center gap-1.5">
                            <span>{rev.user_name || 'Verified Customer'}</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              ✓ {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                            </span>
                          </h5>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <Star key={st} className={`w-3.5 h-3.5 ${st <= (rev.rating || 5) ? 'fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                  {language === 'bn' ? 'এখনো কোনো রিভিউ দেওয়া হয়নি। আপনিই প্রথম রিভিউ দিন!' : 'No reviews yet. Be the first to review this product!'}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* IMPORTANT PRODUCT NOTES */}
      <section className="p-5 bg-amber-50/40 border border-amber-100/60 rounded-2xl flex items-start gap-3 text-xs" id="important-notes-banner">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1 font-medium text-amber-900">
          <h4 className="font-black text-xs uppercase tracking-wider text-amber-800">
            {language === 'bn' ? 'বিশেষ সতর্কতা ও তথ্য' : 'Important Product Notice'}
          </h4>
          <p className="leading-relaxed text-[11px] sm:text-xs text-amber-900/80">
            {language === 'bn' 
              ? 'যেহেতু আমাদের ড্রাই ফুড শতভাগ কেমিক্যালমুক্ত এবং প্রাকৃতিক উপায়ে তৈরি, তাই ঋতুভেদে পণ্যগুলোর রঙ বা আকারে সামান্য তারতম্য দেখা যেতে পারে। সেরা মানের জন্য সর্বদা শুকনো পাত্রে সিল করে রাখুন।' 
              : 'As our dry foods are 100% natural with no artificial preservatives, slight seasonal variance in texture or color is normal. Always seal tightly in a dry container for optimal crispness and freshness.'}
          </p>
        </div>
      </section>

      {/* 16. "YOU MAY ALSO LIKE" (RECOMMENDED PRODUCTS: MIN 6, MAX 10) */}
      {recommendations && recommendations.length > 0 && (
        <section className="space-y-5 pt-4" id="recommended-products-section">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>{language === 'bn' ? 'আপনার আরও পছন্দ হতে পারে' : 'You May Also Like'}</span>
              </h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                {language === 'bn' ? 'একই ধরনের প্রিমিয়াম নির্বাচিত পণ্যসমূহ' : 'Recommended premium organic selections'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4" id="recommendations-grid">
            {recommendations.slice(0, 10).map((recProduct) => (
              <ProductCard key={recProduct.id} product={recProduct} />
            ))}
          </div>
        </section>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[300] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in select-none"
          id="product-lightbox-modal"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div 
            className="relative max-w-3xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={mainImage} 
              alt="Fullscreen Preview" 
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevThumb}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextThumb}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR (Unified, Black + SHAD GHOR Green, Mandatory Weight Selection) */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3 px-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        id="unified-sticky-action-bar"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Price & Selection summary */}
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block leading-none">
              {language === 'bn' ? 'মোট মূল্য' : 'Total Price'}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base sm:text-xl font-black text-emerald-800">
                {isVariantRequiredAndMissing ? (
                  minVariantPrice !== maxVariantPrice 
                    ? `৳${toBnNum(minVariantPrice * quantity)} - ৳${toBnNum(maxVariantPrice * quantity)}`
                    : `৳${toBnNum(minVariantPrice * quantity)}`
                ) : (
                  `৳${toBnNum(priceDetails.price * quantity)}`
                )}
              </span>
              {selectedVariant ? (
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 hidden sm:inline-block">
                  {selectedVariant.name}
                </span>
              ) : hasMultipleVariants ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 hidden sm:inline-block">
                  {language === 'bn' ? 'ওজন নির্বাচন আবশ্যক' : 'Select Weight'}
                </span>
              ) : null}
            </div>
          </div>

          {/* Action Buttons: ADD TO CART (SHAD GHOR Green) & ORDER NOW (Black) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl justify-end">
            {/* ADD TO CART */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isActionDisabled}
              className={`flex-1 sm:flex-initial sm:min-w-[170px] h-11 sm:h-12 px-4 rounded-md font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isActionDisabled
                  ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-[0.98] cursor-pointer'
              }`}
              id="sticky-add-to-cart-btn"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>
                {isSoldOut
                  ? (language === 'bn' ? 'স্টক শেষ' : 'Sold Out')
                  : isVariantRequiredAndMissing
                    ? (language === 'bn' ? 'ওজন নির্বাচন করুন' : 'Select Weight')
                    : (language === 'bn' ? 'কার্টে যোগ করুন' : 'Add to Cart')}
              </span>
            </button>

            {/* ORDER NOW (Black) */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isActionDisabled}
              className={`flex-1 sm:flex-initial sm:min-w-[170px] h-11 sm:h-12 px-4 rounded-md font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                isActionDisabled
                  ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-black hover:bg-gray-900 text-white shadow-xs active:scale-[0.98] cursor-pointer'
              }`}
              id="sticky-order-now-btn"
            >
              <Zap className="w-4 h-4 fill-white shrink-0" />
              <span>
                {isSoldOut
                  ? (language === 'bn' ? 'স্টক শেষ' : 'Sold Out')
                  : isVariantRequiredAndMissing
                    ? (language === 'bn' ? 'ওজন নির্বাচন করুন' : 'Select Weight')
                    : (language === 'bn' ? 'এখনই অর্ডার করুন' : 'Order Now')}
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* CHECKOUT MODAL FLOW */}
      <ProductCheckoutModal 
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        product={product}
        selectedVariant={selectedVariant}
        quantity={quantity}
        priceDetails={priceDetails}
        mainImage={mainImage}
        specs={specs}
        language={language}
        currentUser={currentUser}
      />
    </main>
  );
};
