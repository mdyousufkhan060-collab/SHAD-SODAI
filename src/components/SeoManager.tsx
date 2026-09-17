import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export const SeoManager = () => {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [pageSeo, setPageSeo] = useState<any>(null);

  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load SEO settings:', err);
      }
    };

    fetchGlobalSettings();
  }, []);

  useEffect(() => {
    const handleRouteChange = async () => {
      const hash = window.location.hash || '#/';
      if (hash.startsWith('#/admin')) return;

      let path = '';
      let slug = '';

      if (hash.startsWith('#/product/')) {
        path = 'product';
        slug = hash.replace('#/product/', '').split('?')[0];
      } else if (hash.startsWith('#/category/')) {
        path = 'category';
        slug = hash.replace('#/category/', '').split('?')[0];
      } else if (hash.startsWith('#/brand/')) {
        path = 'brand';
        slug = hash.replace('#/brand/', '').split('?')[0];
      } else if (hash === '#/about') {
        path = 'about';
      } else if (hash === '#/contact') {
        path = 'contact';
      }

      try {
        const res = await fetch(`/api/seo/page?path=${path}&slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setPageSeo(data);
        }
      } catch (err) {
        console.error('Failed to fetch page SEO:', err);
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  useEffect(() => {
    const activeSeo = pageSeo || settings;
    if (!activeSeo) return;

    // Determine current route
    const hash = window.location.hash || '#/';
    
    // Don't apply SEO to admin pages
    if (hash.startsWith('#/admin')) return;

    // Apply Global Settings
    const title = activeSeo.seo_title || (language === 'bn' ? 'স্বাদ ঘর — প্রিমিয়াম অর্গানিক শপ' : 'SHAD GHOR — Premium Organic Shop');
    const description = activeSeo.seo_description || '১০০% খাঁটি ও প্রাকৃতিক সুন্দরবনের মধু, ঘি, মসলা এবং অর্গানিক খাবার।';
    
    document.title = title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', activeSeo.seo_keywords || '');

    // Update Canonical
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', activeSeo.seo_canonical || window.location.origin + window.location.hash);

    // Robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', `${activeSeo.seo_index || 'index'}, ${activeSeo.seo_follow || 'follow'}`);

    // Open Graph
    const ogTags = [
      { property: 'og:title', content: activeSeo.og_title || title },
      { property: 'og:description', content: activeSeo.og_description || description },
      { property: 'og:image', content: activeSeo.og_image || '' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'website' }
    ];

    ogTags.forEach(tag => {
      let element = document.querySelector(`meta[property="${tag.property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', tag.property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    // Twitter
    const twitterTags = [
      { name: 'twitter:card', content: activeSeo.twitter_card || 'summary_large_image' },
      { name: 'twitter:title', content: activeSeo.twitter_title || activeSeo.og_title || title },
      { name: 'twitter:description', content: activeSeo.twitter_description || activeSeo.og_description || description },
      { name: 'twitter:image', content: activeSeo.twitter_image || activeSeo.og_image || '' }
    ];

    twitterTags.forEach(tag => {
      let element = document.querySelector(`meta[name="${tag.name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', tag.name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', tag.content);
    });

    // Structured Data (JSON-LD)
    let scriptSchema = document.getElementById('seo-structured-data');
    if (!scriptSchema) {
      scriptSchema = document.createElement('script');
      scriptSchema.setAttribute('id', 'seo-structured-data');
      scriptSchema.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptSchema);
    }
    
    // Build Structured Data based on pageSeo if it exists
    let schema: any = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SHAD SHODAI",
      "url": "https://shadshodai.com",
      "logo": "https://shadshodai.com/logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": activeSeo.store_phone || "",
        "contactType": "customer service"
      }
    };

    if (pageSeo) {
      if (window.location.hash.startsWith('#/product/')) {
        schema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": pageSeo.seo_title,
          "description": pageSeo.seo_description,
          "image": pageSeo.og_image,
          "url": window.location.href
        };
      }
    }

    scriptSchema.textContent = JSON.stringify(schema);

  }, [settings, pageSeo, language]);

  return null;
};
