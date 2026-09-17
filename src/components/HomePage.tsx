import React, { useState, useEffect } from 'react';
import { SearchBar } from './SearchBar';
import { HeroSlider } from './HeroSlider';
import { CategoryBannerCarousel } from './CategoryBannerCarousel';
import { FastSellSlider } from './FastSellSlider';
import { ProductSection } from './ProductSection';
import { PromotionalBanner } from './PromotionalBanner';
import { HomepageSection, Category } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const HomePage = () => {
  const { language } = useLanguage();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, categoriesRes] = await Promise.all([
        fetch('/api/homepage/sections'),
        fetch('/api/categories')
      ]);

      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setSections(data);
      }

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData.filter((c: Category) => c.status === 'active'));
      }
    } catch (err) {
      console.error('[HomePage] Fetch homepage data error:', err);
    }
  };

  // Filter other sections (excluding hero_slider, category_banner, fast_sell which are rendered in fixed top order)
  const otherSections = sections.filter(
    (s) => s.enabled && !['hero_slider', 'category_banner', 'fast_sell'].includes(s.section_key)
  );

  return (
    <div className="bg-white pb-20 animate-fade-in" id="customer-homepage">
      {/* 1. SEARCH BAR - Compact 48-52px height, 6px radius, Home page only */}
      <SearchBar />

      {/* 2. 16:9 MAIN HERO BANNER */}
      <div className="pt-0">
        <HeroSlider />
      </div>

      {/* 3. CATEGORY SECTION (Immediately below Hero Banner) */}
      <CategoryBannerCarousel />

      {/* 4. FAST SELL / PRODUCT SECTION */}
      <FastSellSlider />

      {/* 5. OTHER HOMEPAGE SECTIONS */}
      {otherSections.length > 0 ? (
        otherSections.map((section) => {
          switch (section.section_key) {
            case 'category_products':
              return (
                <div key={section.id} className="space-y-1">
                  {categories.map((category) => (
                    <ProductSection 
                      key={`${section.id}-${category.id}`}
                      titleEn={category.name}
                      titleBn={category.name_bn || category.name}
                      categoryName={category.name}
                      limit={4}
                      viewAllLink={`category/${category.slug}`}
                    />
                  ))}
                </div>
              );

            case 'homepage_promo':
              return <PromotionalBanner key={section.id} location="homepage_promo" />;

            case 'new_arrivals':
              return (
                <ProductSection 
                  key={section.id}
                  titleEn="New Arrivals"
                  titleBn="নতুন পণ্য"
                  type="new_arrivals"
                  limit={4}
                  viewAllLink="new-arrivals"
                />
              );

            case 'best_sellers':
              return (
                <ProductSection 
                  key={section.id}
                  titleEn="Best Sellers"
                  titleBn="সেরা বিক্রিত"
                  type="best_sellers"
                  limit={4}
                  viewAllLink="best-sellers"
                />
              );

            case 'featured_products':
              return (
                <ProductSection 
                  key={section.id}
                  titleEn="Featured Products"
                  titleBn="বিশেষ পণ্য"
                  type="featured"
                  limit={4}
                  viewAllLink="featured"
                />
              );

            default:
              return null;
          }
        })
      ) : (
        <ProductSection 
          titleEn="Featured Products"
          titleBn="বিশেষ পণ্য"
          type="featured"
          limit={4}
          viewAllLink="featured"
        />
      )}
    </div>
  );
};
