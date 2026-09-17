import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, ShoppingBag, Info, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string;
  is_read: number;
  created_at: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onUnreadChange: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, customerId, onUnreadChange }) => {
  const { language, t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customerId) {
      fetchNotifications();
    }
  }, [customerId, isOpen]);

  const fetchNotifications = async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?customer_id=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n: Notification) => n.is_read === 0).length;
        onUnreadChange(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id?: number, all = false) => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, customer_id: customerId, all })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleLinkClick = (link: string, id: number) => {
    markAsRead(id);
    onClose();
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      window.location.hash = link;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'alert': return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60]"
          />
          <motion.div 
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[88%] sm:w-[380px] bg-white shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-800">
                  {language === 'bn' ? 'বিজ্ঞপ্তি কেন্দ্র' : 'Notification Center'}
                </h3>
                {notifications.filter(n => n.is_read === 0).length > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {notifications.filter(n => n.is_read === 0).length} New
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
              {!customerId ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-4xs">
                    <Bell className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-xs font-bold text-gray-500">
                    {language === 'bn' ? 'বিজ্ঞপ্তি দেখতে লগইন করুন' : 'Please login to see notifications'}
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-4xs">
                    <Bell className="w-8 h-8 text-gray-100" />
                  </div>
                  <p className="text-xs font-bold text-gray-400">
                    {language === 'bn' ? 'কোনো বিজ্ঞপ্তি নেই' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all relative ${notif.is_read === 0 ? 'bg-white border-emerald-100 shadow-xs' : 'bg-white/50 border-gray-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${notif.is_read === 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 space-y-1 pr-6">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-xs font-black ${notif.is_read === 0 ? 'text-gray-800' : 'text-gray-500'}`}>
                            {notif.title.split(' | ')[language === 'bn' ? 0 : 1] || notif.title}
                          </h4>
                          <span className="text-[9px] font-bold text-gray-400">{formatDate(notif.created_at)}</span>
                        </div>
                        <p className={`text-[11px] font-medium leading-relaxed ${notif.is_read === 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                          {notif.message.split(' \n\n ')[language === 'bn' ? 0 : 1] || notif.message}
                        </p>
                        {notif.link && (
                          <button 
                            onClick={() => handleLinkClick(notif.link, notif.id)}
                            className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-tight"
                          >
                            <span>{language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {notif.is_read === 0 && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-sm shadow-emerald-200"
                        title="Mark as read"
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && customerId && (
              <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
                <button 
                  onClick={() => markAsRead(undefined, true)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black transition-all uppercase tracking-wider"
                >
                  {language === 'bn' ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark All as Read'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
