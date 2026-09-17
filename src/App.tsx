import { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BottomNavigation } from './components/BottomNavigation';
import { useLanguage } from './context/LanguageContext';
import { adminService } from './utils/adminService';
import { tracking } from './utils/tracking';
import { SeoManager } from './components/SeoManager';

// Direct synchronous imports for instant SPA transitions (No full-screen loading spinner)
import { HomePage } from './components/HomePage';
import { AccountPage } from './components/AccountPage';
import { SupportCenter } from './components/SupportCenter';
import { OffersPage } from './components/OffersPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { CategoriesPage } from './components/CategoriesPage';
import { CategoryProductPage } from './components/CategoryProductPage';
import { AboutUsPage } from './components/AboutUsPage';
import { ContactUsPage } from './components/ContactUsPage';
import { PolicyPage } from './components/PolicyPage';
import { FAQPage } from './components/FAQPage';
import { BrandsPage } from './components/BrandsPage';
import { BrandProductPage } from './components/BrandProductPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { SearchResultsPage } from './components/SearchResultsPage';
import { NotFoundPage } from './components/NotFoundPage';

// Admin views can remain lazy loaded
const AdminLogin = lazy(() => import('./components/AdminLogin').then(module => ({ default: module.AdminLogin })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

// Loading Component for Suspense (Used only for Admin routes)
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const { language } = useLanguage();
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(adminService.requireAdminAuth());
  
  // Initialize Tracking Engine (Meta Pixel / CAPI)
  useEffect(() => {
    tracking.loadConfig();
  }, []);

  // Track PageView on route change
  useEffect(() => {
    if (!currentHash.startsWith('#/admin')) {
      tracking.track('PageView');
    }
  }, [currentHash]);

  // Handle direct URL access and pathname-based SPA navigation
  useEffect(() => {
    const syncRoute = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;

      if (pathname && pathname !== '/' && !hash) {
        if (pathname === '/admin' || pathname === '/admin/' || pathname.startsWith('/admin/')) {
          window.location.replace('/#/admin/dashboard');
          return;
        } else {
          // Normalize pathname to hash (e.g. /category/dry-food -> #/category/dry-food)
          window.location.replace(`/#${pathname}`);
          return;
        }
      }

      const activeHash = window.location.hash || '#/';
      setCurrentHash(activeHash);
      if (activeHash.startsWith('#/admin')) {
        setIsAdminAuthenticated(adminService.requireAdminAuth());
      }
      window.scrollTo(0, 0);
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
    };
  }, []);

  // Secure administrative routing wall & redirect rules
  useEffect(() => {
    if (currentHash.startsWith('#/admin')) {
      adminService.checkSession().then(user => {
        const authenticated = !!user;
        setIsAdminAuthenticated(authenticated);

        if (!authenticated && currentHash !== '#/admin/login') {
          window.location.hash = '#/admin/login';
        } else if (authenticated && (currentHash === '#/admin' || currentHash === '#/admin/login')) {
          window.location.hash = '#/admin/dashboard';
        }
      });
    }
  }, [currentHash]);

  // Dynamic SEO meta tag configuration to prevent indexing administrative views
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    
    const isPrivate = currentHash.startsWith('#/admin') || 
                      currentHash.startsWith('#/account') || 
                      currentHash.startsWith('#/cart') || 
                      currentHash.startsWith('#/checkout') ||
                      currentHash.startsWith('#/wishlist');

    if (isPrivate) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        metaRobots.setAttribute('content', 'noindex, nofollow');
        document.head.appendChild(metaRobots);
      } else {
        metaRobots.setAttribute('content', 'noindex, nofollow');
      }
    } else {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    }
  }, [currentHash]);

  // If we are navigating the Admin system, bypass customer-facing DOM entirely for absolute structural isolation
  if (currentHash.startsWith('#/admin')) {
    if (!isAdminAuthenticated) {
      return (
        <Suspense fallback={<PageLoader />}>
          <AdminLogin 
            onLoginSuccess={() => {
              setIsAdminAuthenticated(true);
              window.location.hash = '#/admin/dashboard';
            }} 
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<PageLoader />}>
        <AdminDashboard 
          onLogout={() => {
            setIsAdminAuthenticated(false);
            sessionStorage.removeItem('admin_profile_state');
            localStorage.removeItem('admin_session_token');
            window.location.replace('/#/');
          }} 
        />
      </Suspense>
    );
  }

  // Route Dispatcher (Pure instant SPA components without blocking Suspense loader)
  const renderContent = () => {
    const hash = currentHash.split('?')[0];

    if (hash === '#/' || hash === '' || hash === '#home') return <HomePage />;
    if (hash === '#/offers') return <OffersPage />;
    if (hash === '#/support' || hash.startsWith('#/support/')) return <SupportCenter />;
    if (hash === '#/account' || hash === '#/wishlist') return <AccountPage onBackToHome={() => { window.location.hash = '#/'; }} />;
    if (hash.startsWith('#/product/')) return <ProductDetailsPage />;
    if (hash === '#/categories') return <CategoriesPage />;
    if (hash.startsWith('#/category/') || hash.startsWith('#/categories/')) {
      const catSlug = hash.startsWith('#/category/')
        ? hash.substring('#/category/'.length).split('?')[0]
        : hash.substring('#/categories/'.length).split('?')[0];
      return <CategoryProductPage key={catSlug || 'category-view'} categorySlug={catSlug} />;
    }
    if (hash === '#/brands') return <BrandsPage />;
    if (hash.startsWith('#/brand/')) return <BrandProductPage />;
    if (hash === '#/cart') return <CartPage />;
    if (hash === '#/checkout') return <CheckoutPage />;
    if (hash === '#/search') return <SearchResultsPage />;
    if (hash === '#/about') return <AboutUsPage />;
    if (hash === '#/contact') return <ContactUsPage />;
    if (hash.startsWith('#/policy/')) {
      const policySlug = hash.substring(9);
      return <PolicyPage slug={policySlug} />;
    }
    if (hash === '#/faq') return <FAQPage />;

    return <NotFoundPage />;
  };

  const isProductDetailsView = currentHash.startsWith('#/product/');

  return (
    <div className={`min-h-screen bg-white font-sans text-gray-800 ${isProductDetailsView ? 'pb-0' : 'pb-[env(safe-area-inset-bottom)]'}`}>
      <SeoManager />
      
      {/* Semantic Header */}
      <Header />

      {/* Semantic Main Content Area - Note: SearchBar is inside HomePage only */}
      <main id="main-content" className={isProductDetailsView ? '' : 'pb-16 md:pb-0'}>
        {renderContent()}
      </main>
      
      {/* Semantic Footer */}
      <Footer />

      {/* Bottom Navigation fixed across mobile views ONLY (Icons only) */}
      {!isProductDetailsView && <BottomNavigation />}
    </div>
  );
}
