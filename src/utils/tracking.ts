/**
 * SHAD SHODAI Tracking & Analytics Engine
 * Professional-grade implementation for Meta Pixel (CAPI), TikTok Pixel (Events API), and GA4
 */

interface PixelConfig {
  enabled: boolean;
  pixelId: string;
  testEventCode?: string;
  events: {
    pageView: boolean;
    viewContent: boolean;
    search: boolean;
    addToCart: boolean;
    initiateCheckout: boolean;
    addPaymentInfo: boolean;
    purchase: boolean;
  };
}

interface TikTokConfig {
  enabled: boolean;
  pixelId: string;
  testEventCode?: string;
  events: {
    pageView: boolean;
    viewContent: boolean;
    search: boolean;
    addToCart: boolean;
    initiateCheckout: boolean;
    addPaymentInfo: boolean;
    completePayment: boolean;
  };
}

interface GoogleConfig {
  enabled: boolean;
  measurementId: string;
}

interface WebsiteConfig {
  enabled: boolean;
  gtmId?: string;
  headScript?: string;
  bodyScript?: string;
  footerScript?: string;
}

class TrackingManager {
  private config: PixelConfig | null = null;
  private tiktokConfig: TikTokConfig | null = null;
  private googleConfig: GoogleConfig | null = null;
  private websiteConfig: WebsiteConfig | null = null;
  
  private initialized: boolean = false;
  private ttInitialized: boolean = false;
  private gaInitialized: boolean = false;
  private wsInitialized: boolean = false;
  
  private sentTransactions: Set<string> = new Set();

  public async loadConfig() {
    try {
      const res = await fetch('/api/tracking/config');
      if (res.ok) {
        const data = await res.json();
        
        // 1. Meta Pixel
        if (data.facebook && data.facebook.enabled && data.facebook.pixelId) {
          this.config = data.facebook;
          this.initPixel();
        }
        
        // 2. TikTok Pixel
        if (data.tiktok && data.tiktok.enabled && data.tiktok.pixelId) {
          this.tiktokConfig = data.tiktok;
          this.initTikTokPixel();
        }
        
        // 3. Google Analytics (GA4)
        if (data.google && data.google.enabled && data.google.measurementId) {
          this.googleConfig = data.google;
          this.initGoogleAnalytics();
        }
        
        // 4. Website Tracking (GTM / Custom Scripts)
        if (data.website && data.website.enabled) {
          this.websiteConfig = data.website;
          this.initWebsiteTracking();
        }
      }
    } catch (err) {
      console.error('[Tracking] Initialization failed:', err);
    }
  }

  private initPixel() {
    if (!this.config || this.initialized) return;
    const id = this.config.pixelId;
    const win = window as any;
    if (win.fbq) return;

    /* eslint-disable */
    (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(win, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    win.fbq('init', id);
    this.initialized = true;
    this.track('PageView');
  }

  private initTikTokPixel() {
    if (!this.tiktokConfig || this.ttInitialized) return;
    const id = this.tiktokConfig.pixelId;
    const win = window as any;
    if (win.ttq) return;

    /* eslint-disable */
    (function (w, d, t) {
      w.TTP = w.TTP || [];
      w.TTP.push({ pixelId: id, testEventCode: '' });
      if (w.ttq) return;
      var ttq = (w.ttq = w.ttq || []);
      ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "setAnonymousId", "setUserId", "load"];
      ttq.setAndDefer = function(t, e) { t.deferred = !0, t.executable = e; };
      for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
      ttq.load = function(e, n) {
        var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
        ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = i, ttq._t = ttq._t || {}, ttq._t[e] = +new Date(), ttq._o = ttq._o || {}, ttq._o[e] = n || {};
        var o = d.createElement("script"); o.type = "text/javascript", o.async = !0, o.src = i + "?sdkid=" + e + "&lib=" + t;
        var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a);
      };
      ttq.load(id);
    })(win, document, 'ttq');
    /* eslint-enable */

    this.ttInitialized = true;
    this.track('PageView');
  }

  private initGoogleAnalytics() {
    if (!this.googleConfig || this.gaInitialized) return;
    const id = this.googleConfig.measurementId;
    const win = window as any;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(script);

    win.dataLayer = win.dataLayer || [];
    win.gtag = function () { win.dataLayer.push(arguments); };
    win.gtag('js', new Date());
    win.gtag('config', id, { send_page_view: false });

    this.gaInitialized = true;
    this.track('PageView');
  }

  private initWebsiteTracking() {
    if (!this.websiteConfig || this.wsInitialized) return;

    // GTM
    if (this.websiteConfig.gtmId) {
      const id = this.websiteConfig.gtmId;
      /* eslint-disable */
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],j=d.createElement(s) as any,dl=l!='dataLayer'?'&l='+l:'';j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode!.insertBefore(j,f);
      })(window,document,'script','dataLayer',id);
      /* eslint-enable */
    }

    // Custom Scripts
    if (this.websiteConfig.headScript) this.injectScript(this.websiteConfig.headScript, 'head');
    if (this.websiteConfig.bodyScript) this.injectScript(this.websiteConfig.bodyScript, 'body-start');
    if (this.websiteConfig.footerScript) this.injectScript(this.websiteConfig.footerScript, 'body-end');

    this.wsInitialized = true;
  }

  private injectScript(content: string, position: 'head' | 'body-start' | 'body-end') {
    try {
      const container = position === 'head' ? document.head : document.body;
      const div = document.createElement('div');
      div.innerHTML = content;
      
      const fragment = document.createDocumentFragment();
      Array.from(div.childNodes).forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          Array.from((node as HTMLScriptElement).attributes).forEach(attr => script.setAttribute(attr.name, attr.value));
          script.textContent = node.textContent;
          fragment.appendChild(script);
        } else {
          fragment.appendChild(node.cloneNode(true));
        }
      });

      if (position === 'body-start') {
        container.insertBefore(fragment, container.firstChild);
      } else {
        container.appendChild(fragment);
      }
    } catch (err) {
      console.error(`[Tracking] Script injection failed (${position}):`, err);
    }
  }

  /**
   * Main tracking dispatcher
   * @param eventName Standard names: PageView, ViewContent, Search, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase
   */
  public track(eventName: string, data: any = {}) {
    // 1. Deduplication for Purchase
    if (eventName === 'Purchase' || eventName === 'CompletePayment') {
      const id = data.transaction_id || data.order_id;
      if (id) {
        if (this.sentTransactions.has(id)) return;
        this.sentTransactions.add(id);
      }
    }

    // 2. Generate Event ID for Deduplication
    const eventId = data.event_id || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const enrichedData = { ...data, event_id: eventId };

    // 3. Dispatch to Meta
    this.dispatchMeta(eventName, enrichedData);

    // 4. Dispatch to TikTok
    this.dispatchTikTok(eventName, enrichedData);

    // 5. Dispatch to GA4
    this.dispatchGA4(eventName, enrichedData);
  }

  private dispatchMeta(eventName: string, data: any) {
    if (!this.config?.enabled || !this.initialized) return;
    const win = window as any;
    
    const eventMap: Record<string, keyof PixelConfig['events']> = {
      'PageView': 'pageView',
      'ViewContent': 'viewContent',
      'Search': 'search',
      'AddToCart': 'addToCart',
      'InitiateCheckout': 'initiateCheckout',
      'AddPaymentInfo': 'addPaymentInfo',
      'Purchase': 'purchase'
    };

    const key = eventMap[eventName];
    if (key && !this.config.events[key]) return;

    if (win.fbq) {
      win.fbq('track', eventName, data, { eventID: data.event_id });
    }

    // CAPI (Server-side)
    fetch('/api/tracking/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventData: data,
        eventId: data.event_id,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(() => {});
  }

  private dispatchTikTok(eventName: string, data: any) {
    if (!this.tiktokConfig?.enabled || !this.ttInitialized) return;
    const win = window as any;

    const eventMap: Record<string, keyof TikTokConfig['events']> = {
      'PageView': 'pageView',
      'ViewContent': 'viewContent',
      'Search': 'search',
      'AddToCart': 'addToCart',
      'InitiateCheckout': 'initiateCheckout',
      'AddPaymentInfo': 'addPaymentInfo',
      'Purchase': 'completePayment'
    };

    const key = eventMap[eventName];
    if (key && !this.tiktokConfig.events[key]) return;

    const ttEventName = eventName === 'Purchase' ? 'CompletePayment' : eventName;

    if (win.ttq) {
      win.ttq.track(ttEventName, data, { event_id: data.event_id });
    }

    // TikTok Events API (Server-side)
    fetch('/api/tracking/tiktok-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: ttEventName,
        eventData: data,
        eventId: data.event_id,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(() => {});
  }

  private dispatchGA4(eventName: string, data: any) {
    if (!this.googleConfig?.enabled || !this.gaInitialized) return;
    const win = window as any;
    if (!win.gtag) return;

    const eventMap: Record<string, string> = {
      'PageView': 'page_view',
      'ViewContent': 'view_item',
      'Search': 'search',
      'AddToCart': 'add_to_cart',
      'InitiateCheckout': 'begin_checkout',
      'AddPaymentInfo': 'add_payment_info',
      'Purchase': 'purchase'
    };

    const gaEventName = eventMap[eventName] || eventName;

    // GA4 Ecommerce Schema Mapping
    const gaData: any = { ...data };
    if (data.contents) {
      gaData.items = data.contents.map((item: any) => ({
        item_id: String(item.id || item.item_id),
        item_name: item.name || item.item_name,
        item_category: item.category || item.item_category,
        price: Number(item.price || item.item_price || 0),
        quantity: item.quantity || 1
      }));
      delete gaData.contents;
    }

    win.gtag('event', gaEventName, gaData);
  }
}

export const tracking = new TrackingManager();

