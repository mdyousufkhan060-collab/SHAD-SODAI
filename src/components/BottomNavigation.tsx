import { useState, useEffect } from 'react';
import { Home, LayoutGrid, Tag, Headset, User } from 'lucide-react';

export const BottomNavigation = () => {
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const isActive = (route: string) => {
    if (route === '#/') {
      return currentHash === '#/' || currentHash === '' || currentHash === '#home';
    }
    if (route === '#/categories') {
      return currentHash.startsWith('#/categories') || currentHash.startsWith('#/category');
    }
    return currentHash.startsWith(route);
  };

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '#/',
      key: 'home',
    },
    {
      label: 'Categories',
      icon: LayoutGrid,
      href: '#/categories',
      key: 'categories',
    },
    {
      label: 'Offers',
      icon: Tag,
      href: '#/offers',
      key: 'offers',
    },
    {
      label: 'Support',
      icon: Headset,
      href: '#/support',
      key: 'support',
    },
    {
      label: 'Account',
      icon: User,
      href: '#/account',
      key: 'account',
    },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-1px_4px_rgba(0,0,0,0.04)] z-50 md:hidden pb-[env(safe-area-inset-bottom)] h-[calc(56px+env(safe-area-inset-bottom))]"
      id="bottom-navigation-bar"
    >
      <div 
        className="grid grid-cols-5 h-[56px] w-full max-w-md mx-auto items-center"
        id="bottom-nav-grid"
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.href);

          return (
            <a
              key={item.key}
              href={item.href}
              className="flex items-center justify-center h-full transition-all duration-150 cursor-pointer group"
              aria-label={item.label}
              id={`bottom-nav-item-${item.key}`}
            >
              <div 
                className={`p-2 rounded-[6px] transition-colors flex items-center justify-center ${
                  active 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-gray-400 group-hover:text-gray-600 active:bg-gray-100'
                }`}
              >
                <IconComponent 
                  className="w-5 h-5 stroke-[2.2]"
                  id={`bottom-nav-icon-${item.key}`}
                />
              </div>
            </a>
          );
        })}
      </div>
    </nav>
  );
};
