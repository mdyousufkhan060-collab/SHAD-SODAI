import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BrandingData } from '../types';
import { DEFAULT_BRANDING, brandingService, getEffectiveLogoUrl, LogoType } from '../utils/brandingService';

interface BrandingContextType {
  branding: BrandingData;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
  updateBranding: (data: Partial<BrandingData>) => Promise<{ success: boolean; message: string }>;
  getLogo: (type: LogoType) => string;
  getSiteName: (lang?: 'en' | 'bn') => string;
  getTagline: (lang?: 'en' | 'bn') => string;
  getDescription: (lang?: 'en' | 'bn') => string;
  getCopyright: (lang?: 'en' | 'bn') => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBrandingData = useCallback(async () => {
    try {
      const data = await brandingService.fetchBranding();
      setBranding(data);
      
      // Update favicon dynamically
      const faviconUrl = getEffectiveLogoUrl(data, 'favicon');
      if (faviconUrl) {
        brandingService.updateFavicon(faviconUrl);
      }
    } catch (err) {
      console.error('[BrandingContext] Error loading branding:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrandingData();

    // Listen to custom cross-tab or cross-component sync event
    const handleSync = (e: any) => {
      if (e.detail) {
        setBranding(prev => ({ ...prev, ...e.detail }));
      } else {
        fetchBrandingData();
      }
    };

    window.addEventListener('branding-updated', handleSync);
    return () => {
      window.removeEventListener('branding-updated', handleSync);
    };
  }, [fetchBrandingData]);

  const updateBranding = useCallback(async (data: Partial<BrandingData>) => {
    // Optimistically update local state
    setBranding(prev => ({ ...prev, ...data }));
    
    const res = await brandingService.saveBranding(data);
    if (res.success) {
      await fetchBrandingData();
    }
    return res;
  }, [fetchBrandingData]);

  const getLogo = useCallback((type: LogoType = 'primary'): string => {
    return getEffectiveLogoUrl(branding, type);
  }, [branding]);

  const getSiteName = useCallback((lang: 'en' | 'bn' = 'en'): string => {
    if (lang === 'bn' && branding.site_name_bn) {
      return branding.site_name_bn;
    }
    return branding.site_name || DEFAULT_BRANDING.site_name;
  }, [branding]);

  const getTagline = useCallback((lang: 'en' | 'bn' = 'en'): string => {
    if (lang === 'bn' && branding.tagline_bn) {
      return branding.tagline_bn;
    }
    return branding.tagline || DEFAULT_BRANDING.tagline;
  }, [branding]);

  const getDescription = useCallback((lang: 'en' | 'bn' = 'en'): string => {
    if (lang === 'bn' && branding.brand_description_bn) {
      return branding.brand_description_bn;
    }
    return branding.brand_description || DEFAULT_BRANDING.brand_description;
  }, [branding]);

  const getCopyright = useCallback((lang: 'en' | 'bn' = 'en'): string => {
    if (lang === 'bn' && branding.copyright_text_bn) {
      return branding.copyright_text_bn;
    }
    return branding.copyright_text || `© 2026 ${branding.site_name}. All Rights Reserved.`;
  }, [branding]);

  const value = useMemo(() => ({
    branding,
    isLoading,
    refreshBranding: fetchBrandingData,
    updateBranding,
    getLogo,
    getSiteName,
    getTagline,
    getDescription,
    getCopyright
  }), [branding, isLoading, fetchBrandingData, updateBranding, getLogo, getSiteName, getTagline, getDescription, getCopyright]);

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = (): BrandingContextType => {
  const context = useContext(BrandingContext);
  if (!context) {
    return {
      branding: DEFAULT_BRANDING,
      isLoading: false,
      refreshBranding: async () => {},
      updateBranding: async () => ({ success: false, message: 'No provider' }),
      getLogo: (type = 'primary') => getEffectiveLogoUrl(DEFAULT_BRANDING, type),
      getSiteName: (lang = 'en') => (lang === 'bn' ? DEFAULT_BRANDING.site_name_bn : DEFAULT_BRANDING.site_name),
      getTagline: (lang = 'en') => (lang === 'bn' ? DEFAULT_BRANDING.tagline_bn : DEFAULT_BRANDING.tagline),
      getDescription: (lang = 'en') => (lang === 'bn' ? DEFAULT_BRANDING.brand_description_bn : DEFAULT_BRANDING.brand_description),
      getCopyright: (lang = 'en') => (lang === 'bn' ? DEFAULT_BRANDING.copyright_text_bn : DEFAULT_BRANDING.copyright_text),
    };
  }
  return context;
};
