import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  ShoppingCart, 
  Heart, 
  Leaf, 
  X, 
  Home, 
  LayoutGrid, 
  Tag, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Droplet, 
  Flame, 
  Calendar, 
  GlassWater, 
  ShieldCheck, 
  Headset, 
  User,
  ChevronDown,
  ChevronUp,
  Globe,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Bell,
  MessageCircle
} from 'lucide-react';
import { PRODUCTS } from '../data';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedCategoryName, getTranslatedName } from '../utils/translations';
import { cartService } from '../utils/cartService';
import { tracking } from '../utils/tracking';
import { useCategories } from '../utils/categoryService';

import { NotificationCenter } from './NotificationCenter';

export const Header = () => {
  const { language, t, changeLanguage, showSwitcher, enabledLanguages } = useLanguage();
  const { categories: dbCategories } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const drawerRef = useRef<HTMLDivElement>(null);
  const cartDrawerRef = useRef<HTMLDivElement>(null);

  const [cartCount, setCartCount] = useState(cartService.getCartCount());
  const [cartItems, setCartItems] = useState(cartService.getCartItems());
  const [wishlistCount, setWishlistCount] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Sync cart and wishlist changes reactively
  useEffect(() => {
    cartService.getWishlistItems().then(items => setWishlistCount(items.length));

    fetch('/api/footer/config')
      .then(res => res.json())
      .then(d => setSettings(d.settings || {}))
      .catch(err => console.error('Failed to load header settings:', err));

    const handleCartSync = () => {
      setCartCount(cartService.getCartCount());
      setCartItems(cartService.getCartItems());
    };
    const handleWishlistSync = () => {
      cartService.getWishlistItems().then(items => setWishlistCount(items.length));
    };

    window.addEventListener('cart-updated', handleCartSync);
    window.addEventListener('wishlist-updated', handleWishlistSync);

    return () => {
      window.removeEventListener('cart-updated', handleCartSync);
      window.removeEventListener('wishlist-updated', handleWishlistSync);
    };
  }, []);

  // Cart helper actions
  const handleIncreaseQty = (productId: string, variantId?: number) => {
    const item = cartItems.find(i => i.productId === productId && i.variantId === variantId);
    if (item) {
      cartService.updateCartQuantity(productId, item.quantity + 1, variantId);
    }
  };

  const handleDecreaseQty = (productId: string, variantId?: number) => {
    const item = cartItems.find(i => i.productId === productId && i.variantId === variantId);
    if (item && item.quantity > 1) {
      cartService.updateCartQuantity(productId, item.quantity - 1, variantId);
    } else {
      cartService.removeFromCart(productId, variantId);
    }
  };

  const handleRemoveItem = (productId: string, variantId?: number) => {
    cartService.removeFromCart(productId, variantId);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Sync hash change
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Sync ESC key press to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Click outside to close drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const isActive = (route: string) => {
    if (route === '#/') {
      return currentHash === '#/' || currentHash === '' || currentHash === '#home';
    }
    return currentHash.startsWith(route);
  };

  const menuItems = [
    { label: t('home'), route: '#/', icon: Home },
    { label: t('offers'), route: '#/offers', icon: Tag },
    { label: t('fastSell'), route: '#/flash-sale', icon: Zap },
    { label: language === 'bn' ? 'নতুন পণ্য' : 'New Arrivals', route: '#/new-arrivals', icon: Sparkles },
    { label: language === 'bn' ? 'বেস্ট সেলিং' : 'Best Selling', route: '#/best-selling', icon: TrendingUp },
  ];

  // Map category slugs to proper icons for visual consistency
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'honey':
      case 'honey-oil': return Droplet;
      case 'oil-ghee':
      case 'ghee': return GlassWater;
      case 'dates':
      case 'dried-fruits':
      case 'dry-food': return Calendar;
      case 'spices': return Flame;
      case 'nuts-seeds':
      case 'healthy-snacks': return Sparkles;
      default: return ShieldCheck;
    }
  };

  return (
    <>
      <header className="sticky top-0 bg-white px-4 h-14 flex items-center justify-between border-b border-gray-100 shadow-sm z-50" id="header-container">
        {/* Left section: Hamburger, Logo */}
        <div className="flex items-center gap-3" id="header-left-section">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-1 hover:bg-gray-50 rounded-md transition-colors cursor-pointer" 
            aria-label="Open Menu" 
            id="header-menu-btn"
          >
            <Menu className="w-7 h-7 text-gray-800" id="header-menu-icon" />
          </button>
          
          <a href="#/" className="flex items-center gap-2 ml-1" id="header-brand-group">
            {settings.company_logo || settings.footer_logo_url ? (
              <img 
                src={settings.company_logo || settings.footer_logo_url} 
                alt={settings.store_name || 'SHAD GHOR'} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const leaf = document.createElement('div');
                    leaf.innerHTML = '<svg class="w-7 h-7 text-emerald-600 fill-emerald-600/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C10.5 14.33 13.5 16 13.5 16s0 2.5-3 2.5c-3.14 0-4.14-1.5-6.42-1.5C2.86 17 2 18.5 2 21Z"/><path d="M7 14.5c0-3 2-4.5 5-4.5s5 1.5 5 4.5"/></svg>';
                    parent.prepend(leaf.firstChild as Node);
                  }
                }}
              />
            ) : (
              <Leaf className="w-7 h-7 text-emerald-600 fill-emerald-600/10" id="header-logo-icon" />
            )}
            <span className="font-black text-xl tracking-tighter text-emerald-600 uppercase" id="header-brand-name">
              {settings.store_name || 'SHAD GHOR'}
            </span>
          </a>
        </div>

        {/* Right section: Icons */}
        <div className="flex items-center gap-0.5 sm:gap-1" id="header-right-section">
          <button 
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2 hover:bg-gray-50 rounded-lg relative text-gray-700 hover:text-emerald-600 transition-colors cursor-pointer hidden sm:flex" 
            aria-label="Notifications" 
            id="header-notifications-btn"
          >
            <Bell className="w-6 h-6" id="header-notifications-icon" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white" id="header-notifications-count">
                {unreadNotifications}
              </span>
            )}
          </button>

          <a href="#/account" className="p-2 hover:bg-gray-50 rounded-lg relative text-gray-700 hover:text-emerald-600 transition-colors" aria-label={t('myAccount')} id="header-account-link">
            <User className="w-6 h-6" id="header-account-icon" />
          </a>
          
          <a href="#/wishlist" className="p-2 hover:bg-gray-50 rounded-lg relative text-gray-700 hover:text-rose-500 transition-colors cursor-pointer" aria-label="Wishlist" id="header-wishlist-btn">
            <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} id="header-wishlist-icon" />
            {wishlistCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border-2 border-white" id="header-wishlist-count">
                {wishlistCount}
              </span>
            )}
          </a>
          
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2 hover:bg-gray-50 rounded-lg relative text-gray-700 hover:text-emerald-600 transition-colors cursor-pointer" 
            aria-label="Cart" 
            id="header-cart-btn"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" id="header-cart-icon" />
              <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white shadow-sm" id="header-cart-count">
                {cartCount}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Category Bar: Strictly synchronized sequence & real category data */}
      <div className="bg-white border-b border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sticky top-14 z-30" id="header-category-bar-wrapper">
        <nav 
          className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 overflow-x-auto hide-scrollbar h-9 sm:h-9.5 text-[11px] sm:text-xs font-semibold select-none"
          id="header-category-bar"
          aria-label="Category Navigation Bar"
        >
          <a
            href="#/categories"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md shrink-0 transition-colors font-bold ${
              isActive('#/categories') && !currentHash.startsWith('#/category/')
                ? 'text-emerald-700 bg-emerald-50'
                : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
            }`}
            id="catbar-all-categories"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === 'bn' ? 'সকল ক্যাটাগরি' : 'All Categories'}</span>
          </a>

          <div className="h-3.5 w-px bg-gray-200 shrink-0 mx-0.5" />

          {dbCategories.map((cat) => {
            const catRoute = `#/category/${cat.slug || cat.id}`;
            const isCatActive = currentHash === catRoute || currentHash === `#/category/${cat.slug}` || currentHash === `#/category/${cat.id}`;
            const catName = language === 'bn' ? (cat.name_bn || cat.name) : cat.name;

            return (
              <a
                key={`catbar-${cat.id}`}
                href={catRoute}
                className={`px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap transition-all duration-150 ${
                  isCatActive
                    ? 'text-emerald-700 font-bold bg-emerald-50'
                    : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50/80'
                }`}
                id={`catbar-item-${cat.slug || cat.id}`}
              >
                {catName}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Slide-out Hamburger Drawer System */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        id="hamburger-backdrop"
      >
        <div 
          ref={drawerRef}
          className={`fixed top-0 bottom-0 left-0 bg-white h-full w-[84%] sm:w-[350px] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          id="hamburger-side-drawer"
        >
          {/* Upper Drawer Area */}
          <div className="flex-1 flex flex-col overflow-y-auto" id="drawer-upper-container">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100" id="drawer-header">
              <div className="flex items-center gap-2" id="drawer-brand-group">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-white border border-gray-100 p-1 overflow-hidden" id="drawer-logo-container">
                  {settings.company_logo || settings.footer_logo_url ? (
                    <img src={settings.company_logo || settings.footer_logo_url} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Leaf className="w-5 h-5 fill-emerald-600/10 text-emerald-600" />
                  )}
                </div>
                <span className="font-extrabold text-base tracking-wider text-emerald-800 font-sans uppercase" id="drawer-brand-name">
                  {settings.store_name || 'SHAD GHOR'}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {/* 🌐 Global Language Switcher at the top-right of side drawer */}
                {showSwitcher && (enabledLanguages.en && enabledLanguages.bn) && (
                  <button
                    onClick={() => changeLanguage(language === 'bn' ? 'en' : 'bn')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                    title="Switch Language"
                    id="drawer-lang-toggle"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{language === 'bn' ? 'EN' : 'বাংলা'}</span>
                  </button>
                )}

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                  aria-label="Close Menu"
                  id="drawer-close-btn"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Items Link List */}
            <nav className="p-3 flex flex-col gap-1" id="drawer-navigation-links">
              {/* Home */}
              <a
                href="#/"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive('#/') 
                    ? 'text-emerald-600 bg-emerald-50/50' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                id="drawer-nav-home"
              >
                <Home className={`w-4.5 h-4.5 ${isActive('#/') ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span>{t('home')}</span>
              </a>

              {/* Expandable Categories Accordion */}
              <div className="flex flex-col gap-1" id="drawer-accordion-categories">
                <button
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 text-left cursor-pointer ${
                    isActive('#/categories') ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-expanded={isCategoriesExpanded}
                  id="drawer-categories-accordion-btn"
                >
                  <div className="flex items-center gap-3">
                    <LayoutGrid className={`w-4.5 h-4.5 ${isActive('#/categories') ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <span>{t('categories')}</span>
                  </div>
                  {isCategoriesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* All Database Categories (Top-level, independent) */}
                <div 
                  className={`flex flex-col pl-7 border-l border-gray-100 ml-5 gap-1 transition-all duration-300 overflow-hidden ${
                    isCategoriesExpanded ? 'max-h-[600px] opacity-100 py-1' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                  id="drawer-categories-container"
                >
                  {dbCategories.map((category) => {
                    const CatIcon = getCategoryIcon(category.slug);
                    const catRoute = `#/category/${category.slug}`;
                    const catActive = currentHash === catRoute;
                    const catName = language === 'bn' ? (category.name_bn || category.name) : category.name;

                    return (
                      <a
                        key={category.id}
                        href={catRoute}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all duration-150 ${
                          catActive 
                            ? 'text-emerald-600 bg-emerald-50/30' 
                            : 'text-gray-600 hover:bg-gray-50/50'
                        }`}
                        id={`drawer-cat-${category.slug}`}
                      >
                        <CatIcon className={`w-3.5 h-3.5 ${catActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span>{catName}</span>
                      </a>
                    );
                  })}
                  
                  {/* Link to view all categories page */}
                  <a
                    href="#/categories"
                    onClick={() => setIsOpen(false)}
                    className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider hover:underline py-1 pl-3"
                    id="drawer-cat-view-all"
                  >
                    {language === 'bn' ? 'সব ক্যাটাগরি দেখুন →' : 'View All Categories →'}
                  </a>
                </div>
              </div>

              {/* Other Static Nav Links */}
              {menuItems.slice(1).map((item) => {
                const ItemIcon = item.icon;
                const active = isActive(item.route);

                return (
                  <a
                    key={item.label}
                    href={item.route}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      active 
                        ? 'text-emerald-600 bg-emerald-50/50' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    id={`drawer-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  >
                    <ItemIcon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                  </a>
                );
              })}

              <div className="h-px bg-gray-100 my-2" />

              {/* Dynamic Categories as root items too (Dry Food, Spices, Honey etc. from database) */}
              <div className="flex flex-col gap-1" id="drawer-quick-categories">
                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase px-3.5 mb-1 block">
                  {language === 'bn' ? 'ক্যাটাগরি সমূহ' : 'Categories'}
                </span>
                {dbCategories.slice(0, 6).map((cat) => {
                  const catRoute = `#/category/${cat.slug}`;
                  const active = currentHash === catRoute;
                  const CatIcon = getCategoryIcon(cat.slug);
                  const catName = language === 'bn' ? (cat.name_bn || cat.name) : cat.name;

                  return (
                    <a
                      key={`quick-${cat.id}`}
                      href={catRoute}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                        active 
                          ? 'text-emerald-600 bg-emerald-50/50' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      id={`drawer-quick-${cat.slug}`}
                    >
                      <CatIcon className={`w-4.5 h-4.5 ${active ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span>{catName}</span>
                    </a>
                  );
                })}
              </div>

              <div className="h-px bg-gray-100 my-2" />

              {/* Support & Account */}
              <a
                href="#/support"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive('#/support') ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-700 hover:bg-gray-50'
                }`}
                id="drawer-nav-support"
              >
                <Headset className={`w-4.5 h-4.5 ${isActive('#/support') ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span>{t('support')}</span>
              </a>

              <a
                href="#/account"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive('#/account') ? 'text-emerald-600 bg-emerald-50/50' : 'text-gray-700 hover:bg-gray-50'
                }`}
                id="drawer-nav-account"
              >
                <User className={`w-4.5 h-4.5 ${isActive('#/account') ? 'text-emerald-600' : 'text-gray-500'}`} />
                <span>{t('myAccount')}</span>
              </a>
            </nav>
          </div>

          {/* Bottom Menu Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-1.5" id="drawer-footer">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-bold" id="drawer-footer-links">
              <a href="#/privacy" onClick={() => setIsOpen(false)} className="hover:text-emerald-600">{t('privacyPolicy')}</a>
              <span>•</span>
              <a href="#/terms" onClick={() => setIsOpen(false)} className="hover:text-emerald-600">{t('termsConditions')}</a>
              <span>•</span>
              <a href="#/contact" onClick={() => setIsOpen(false)} className="hover:text-emerald-600">{t('contactUs')}</a>
            </div>
            <p className="text-[9px] text-gray-400">© 2026 SHAD GHOR. {t('allRightsReserved')}</p>
          </div>
        </div>
      </div>

      {/* Slide-out Cart Drawer System (Step 20C) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          isCartOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsCartOpen(false);
        }}
        id="cart-backdrop"
      >
        <div 
          ref={cartDrawerRef}
          className={`fixed top-0 bottom-0 right-0 bg-white h-full w-[88%] sm:w-[380px] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out z-50 ${
            isCartOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          id="cart-side-drawer"
        >
          {/* Cart Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white" id="cart-drawer-header">
            <div className="flex items-center gap-2" id="cart-drawer-title-group">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <span className="font-extrabold text-sm text-gray-800" id="cart-drawer-title">
                {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full" id="cart-drawer-badge">
                {cartCount}
              </span>
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              aria-label="Close Cart"
              id="cart-drawer-close-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50" id="cart-items-container">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12" id="cart-empty-view">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-4xs" id="cart-empty-icon-box">
                  <ShoppingCart className="w-8 h-8 text-gray-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-600">
                    {language === 'bn' ? 'আপনার কার্টটি এখন খালি আছে!' : 'Your shopping cart is empty!'}
                  </p>
                  <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto">
                    {language === 'bn' ? 'আমাদের সেরা প্রাকৃতিক পণ্যগুলো দেখে নিন।' : 'Explore our range of pure, organic products.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-5xs"
                >
                  {language === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
                </button>
              </div>
            ) : (
              cartItems.map((item, idx) => {
                const product = PRODUCTS.find(p => p.id === item.productId);
                if (!product) return null;

                return (
                  <div 
                    key={`${item.productId}-${item.variantId || idx}`} 
                    className="bg-white p-3 rounded-xl border border-gray-150/80 shadow-5xs flex gap-3 relative transition-all text-left"
                    id={`cart-item-card-${item.productId}-${item.variantId || 'base'}`}
                  >
                    {/* Item Image */}
                    <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-xs text-gray-800 truncate pr-4">
                          {getTranslatedName(product.name, language)}
                        </h5>
                        {item.variantName && (
                          <p className="text-[9px] font-bold text-amber-600 tracking-wide uppercase bg-amber-50/60 inline-block px-1.5 py-0.5 rounded-md">
                            {language === 'bn' ? 'ওজন:' : 'Size:'} {item.variantName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        {/* Quantity controls */}
                        <div className="flex items-center gap-1 border border-gray-200 bg-gray-50 rounded-lg p-0.5">
                          <button
                            onClick={() => handleDecreaseQty(item.productId, item.variantId)}
                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white text-gray-500 hover:text-emerald-600 cursor-pointer transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-[10px] font-black text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleIncreaseQty(item.productId, item.variantId)}
                            className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-white text-gray-500 hover:text-emerald-600 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Price Display */}
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block font-bold">
                            ৳{item.price} x {item.quantity}
                          </span>
                          <span className="text-xs font-black text-emerald-600 block">
                            ৳{item.price * item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.productId, item.variantId)}
                      className="absolute top-2.5 right-2.5 text-gray-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-gray-50 cursor-pointer animate-fade-in"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-gray-150 bg-white space-y-3" id="cart-drawer-footer">
              <div className="flex justify-between items-center" id="cart-drawer-subtotal-row">
                <span className="text-xs font-bold text-gray-400">
                  {language === 'bn' ? 'সর্বমোট মূল্য:' : 'Subtotal Amount:'}
                </span>
                <span className="text-base font-black text-emerald-600">
                  ৳{cartTotal}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);

                    // Track InitiateCheckout Meta/TikTok Event
                    tracking.track('InitiateCheckout', {
                      content_ids: cartItems.map(i => i.productId),
                      contents: cartItems.map(i => {
                        const product = PRODUCTS.find(p => p.id === i.productId);
                        return {
                          id: i.productId,
                          name: product?.name || 'Unknown Product',
                          quantity: i.quantity,
                          item_price: i.price
                        };
                      }),
                      value: cartTotal,
                      currency: 'BDT',
                      num_items: cartCount
                    });

                    window.location.hash = '#/checkout';
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/15"
                >
                  <span>{language === 'bn' ? 'অর্ডার সম্পূর্ণ করুন (চেকআউট)' : 'Proceed to Checkout'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <NotificationCenter 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
        customerId={localStorage.getItem('shadghor_customer_id')} 
        onUnreadChange={setUnreadNotifications}
      />
    </>
  );
};
