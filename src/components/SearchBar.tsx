import React, { useState } from 'react';
import { Search, X, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SearchBar = () => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.hash = `#/products?search=${encodeURIComponent(searchTerm.trim())}`;
    }
  };

  return (
    <div className="px-2.5 sm:px-3 pt-1.5 pb-1 bg-white max-w-7xl mx-auto w-full" id="homepage-search-bar">
      <form onSubmit={handleSearch} className="relative w-full group">
        {/* Left Search Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none">
          <Search className="w-4 h-4" />
        </div>

        {/* Compact, Wide, Rectangular Search Input (48px - 50px height, 6px - 8px radius) */}
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search SHAD GHOR products..."
          className="w-full h-[48px] sm:h-[50px] pl-10 pr-20 bg-white border border-gray-200/90 rounded-[6px] text-xs sm:text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all"
          id="homepage-search-input"
          style={{ borderRadius: '6px' }}
        />

        {/* Right Action Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-gray-100 rounded-[4px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-gray-200" />
          <button 
            type="button" 
            className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
            aria-label="Search by image"
            onClick={() => {
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = 'image/*';
              fileInput.onchange = () => {
                window.location.hash = `#/products?imageSearch=active`;
              };
              fileInput.click();
            }}
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
