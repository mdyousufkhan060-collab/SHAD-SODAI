import React from 'react';
import { Activity, Video, BarChart3, Code, TrendingUp } from 'lucide-react';
import { AdminFacebookPixel } from './AdminFacebookPixel';
import { AdminTikTokPixel } from './AdminTikTokPixel';
import { AdminGoogleAnalytics } from './AdminGoogleAnalytics';
import { AdminWebsiteTracking } from './AdminWebsiteTracking';

interface AdminTrackingOverviewProps {
  language: 'en' | 'bn';
}

export const AdminTrackingOverview: React.FC<AdminTrackingOverviewProps> = ({ language }) => {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-emerald-950">
            {language === 'bn' ? 'ট্র্যাকিং ও অ্যানালিটিক্স সেটআপ' : 'Tracking & Analytics Setup'}
          </h1>
          <p className="text-xs text-emerald-700 font-bold mt-1">
            {language === 'bn' 
              ? 'আপনার ওয়েবসাইটের ট্র্যাকিং পিক্সেল এবং অ্যানালিটিক্স কোডগুলো এখানে ম্যানেজ করুন।' 
              : 'Manage your website tracking pixels and analytical integrations from this central hub.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminFacebookPixel language={language} />
        <AdminTikTokPixel language={language} />
        <AdminGoogleAnalytics language={language} />
        <AdminWebsiteTracking language={language} />
      </div>
    </div>
  );
};
