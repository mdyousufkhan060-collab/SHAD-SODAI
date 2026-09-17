import { useState, useEffect } from 'react';
import { Category, Product } from '../types';

export interface CategoryItem {
  id: string;
  name: string;
  name_bn?: string;
  slug: string;
  description?: string;
  description_bn?: string;
  image_url?: string;
  imageUrl?: string;
  image?: string;
  iconImage?: string;
  icon_image?: string;
  sort_order: number;
  sortOrder?: number;
  displayOrder?: number;
  status: string;
  is_active?: boolean;
}

let cachedCategories: CategoryItem[] | null = null;
let fetchPromise: Promise<CategoryItem[]> | null = null;

export const categoryService = {
  // Synchronous cache access (avoids layout shift or blank states)
  getCachedCategories(): CategoryItem[] {
    return cachedCategories || [];
  },

  // Real Database Source: GET /api/categories
  async fetchCategories(forceRefresh = false): Promise<CategoryItem[]> {
    if (!forceRefresh && cachedCategories && cachedCategories.length > 0) {
      return cachedCategories;
    }

    if (fetchPromise && !forceRefresh) {
      return fetchPromise;
    }

    fetchPromise = (async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : [];

        // Filter active categories and standardize database fields
        const normalized: CategoryItem[] = rawList
          .filter((cat: any) => {
            if (cat.status !== undefined && cat.status !== 'active') return false;
            if (cat.is_active !== undefined && cat.is_active === false) return false;
            return true;
          })
          .map((cat: any) => {
            const img = cat.image_url || cat.imageUrl || cat.icon_image || cat.iconImage || cat.image || '';
            const order = Number(cat.sort_order ?? cat.displayOrder ?? cat.sortOrder ?? 0);
            const rawSlug = (cat.slug || cat.id || '').trim();
            const cleanSlug = rawSlug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

            return {
              id: String(cat.id),
              name: cat.name || '',
              name_bn: cat.name_bn || '',
              slug: cleanSlug || String(cat.id),
              description: cat.description || '',
              description_bn: cat.description_bn || '',
              image_url: img,
              imageUrl: img,
              image: img,
              iconImage: img,
              icon_image: img,
              sort_order: order,
              sortOrder: order,
              displayOrder: order,
              status: cat.status || 'active',
              is_active: true
            };
          })
          // Strict database sequence
          .sort((a, b) => a.sort_order - b.sort_order);

        cachedCategories = normalized;
        
        // Dispatch update event for reactive components
        window.dispatchEvent(new CustomEvent('categories-updated', { detail: normalized }));
        
        return normalized;
      } catch (err) {
        console.error('[categoryService] Error fetching categories:', err);
        return cachedCategories || [];
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },

  // Lookup Category by slug or id (case-insensitive, normalized)
  async getCategoryBySlugOrId(slugOrId: string): Promise<CategoryItem | null> {
    if (!slugOrId) return null;
    const target = decodeURIComponent(slugOrId).trim().toLowerCase().replace(/\/+$/, '');

    // 1. Check local cache first
    const list = await this.fetchCategories();
    const found = list.find(c => 
      c.slug.toLowerCase() === target || 
      c.id.toLowerCase() === target ||
      c.name.toLowerCase() === target
    );
    if (found) return found;

    // 2. Fetch specific from database API
    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(target)}`);
      if (res.ok) {
        const cat = await res.json();
        const img = cat.image_url || cat.imageUrl || cat.icon_image || cat.iconImage || cat.image || '';
        const order = Number(cat.sort_order ?? cat.displayOrder ?? 0);
        return {
          id: String(cat.id),
          name: cat.name || '',
          name_bn: cat.name_bn || '',
          slug: cat.slug || String(cat.id),
          description: cat.description || '',
          description_bn: cat.description_bn || '',
          image_url: img,
          imageUrl: img,
          image: img,
          iconImage: img,
          icon_image: img,
          sort_order: order,
          sortOrder: order,
          displayOrder: order,
          status: cat.status || 'active',
          is_active: true
        };
      }
    } catch (e) {
      console.error('[categoryService] Error fetching category by slug:', e);
    }

    return null;
  }
};

// React Hook for Reactive & Cached Category Data
export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(() => categoryService.getCachedCategories());
  const [loading, setLoading] = useState<boolean>(categories.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async (force = false) => {
      try {
        const data = await categoryService.fetchCategories(force);
        if (isMounted) {
          setCategories(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load categories');
          setLoading(false);
        }
      }
    };

    // If cache is already populated, update immediately
    if (cachedCategories && cachedCategories.length > 0) {
      setCategories(cachedCategories);
      setLoading(false);
    }

    loadData();

    // Listen for category updates from admin or database
    const handleUpdate = (e: any) => {
      if (isMounted && e.detail) {
        setCategories(e.detail);
        setLoading(false);
      }
    };

    window.addEventListener('categories-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('categories-updated', handleUpdate);
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    return categoryService.fetchCategories(true);
  };

  return { categories, loading, error, refresh };
};
