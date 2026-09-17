import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BreadcrumbItem {
  label: string;
  link?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { language } = useLanguage();

  // Generate Structured Data (Schema.org BreadcrumbList)
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.link ? `${window.location.origin}${item.link}` : undefined
    }))
  };

  return (
    <nav className="flex mb-4 overflow-x-auto no-scrollbar py-2" aria-label="Breadcrumb">
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
      <ol className="inline-flex items-center space-x-1 md:space-x-3 whitespace-nowrap">
        <li className="inline-flex items-center">
          <a href="#/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
            <Home className="w-4 h-4 mr-2" />
            {language === 'bn' ? 'হোম' : 'Home'}
          </a>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              {item.active ? (
                <span className="ml-1 text-sm font-medium text-green-600 md:ml-2">
                  {item.label}
                </span>
              ) : (
                <a href={item.link} className="ml-1 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors md:ml-2">
                  {item.label}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};
