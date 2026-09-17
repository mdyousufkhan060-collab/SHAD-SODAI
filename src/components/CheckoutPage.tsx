import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, CreditCard, ArrowLeft, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cartService } from '../utils/cartService';
import { Breadcrumbs } from './Breadcrumbs';

export const CheckoutPage = () => {
  const { language, t } = useLanguage();
  const [cartItems, setCartItems] = useState(cartService.getCartItems());
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    house_number: '',
    road_area: '',
    ward_number: '',
    thana: '',
    district: 'Dhaka',
    post_code: '',
    payment_method: 'cod',
    payment_details: {
      transaction_id: '',
      sender_number: ''
    }
  });

  useEffect(() => {
    if (cartService.getCartCount() === 0 && !orderSuccess) {
      window.location.hash = '#/cart';
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/checkout/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('payment_')) {
      const field = name.replace('payment_', '');
      setFormData(prev => ({
        ...prev,
        payment_details: { ...prev.payment_details, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = formData.district === 'Dhaka' 
    ? Number(settings.delivery_charge_inside_dhaka || 60) 
    : Number(settings.delivery_charge_outside_dhaka || 120);
  const finalTotal = cartTotal + deliveryCharge;

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.customer_phone || !formData.district || !formData.thana) {
      setError(language === 'bn' ? 'দয়া করে সব বাধ্যতামূলক তথ্য দিন' : 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subtotal: cartTotal,
          delivery_charge: deliveryCharge,
          total_amount: finalTotal,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setOrderSuccess(data.orderId);
        cartService.clearCart();
      } else {
        throw new Error(data.error || 'Checkout failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">
          {language === 'bn' ? 'অর্ডার সফল হয়েছে!' : 'Order Successful!'}
        </h1>
        <p className="text-gray-500 font-bold max-w-md mx-auto">
          {language === 'bn' 
            ? `আপনার অর্ডার #${orderSuccess} সফলভাবে গ্রহণ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।` 
            : `Your order #${orderSuccess} has been placed successfully. We will contact you soon.`}
        </p>
        <button 
          onClick={() => window.location.hash = '#/'}
          className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
        >
          {language === 'bn' ? 'হোমপেজে ফিরে যান' : 'Back to Home'}
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen" id="checkout-page">
      <Breadcrumbs 
        items={[
          { label: language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart', link: '#/cart' },
          { label: language === 'bn' ? 'চেকআউট' : 'Checkout', active: true }
        ]} 
      />

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {language === 'bn' ? 'অর্ডার রিভিউ ও পেমেন্ট' : 'Order Review & Payment'}
          </h1>
          <p className="text-sm text-gray-500 font-bold mt-1">
            {language === 'bn' ? 'আপনার অর্ডারের তথ্যগুলো যাচাই করে নিন।' : 'Please review your order details before completing.'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 self-start md:self-auto">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-wider">{language === 'bn' ? 'নিরাপদ পেমেন্ট' : 'Secure Checkout'}</span>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-bold animate-shake text-left">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        {/* Checkout Forms */}
        <section className="lg:col-span-8 space-y-6">
          {/* Shipping Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-black text-gray-800">{language === 'bn' ? 'ডেলিভারি ঠিকানা' : 'Shipping Address'}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'পুরো নাম' : 'Full Name'} *</label>
                <input 
                  type="text" 
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  placeholder={language === 'bn' ? 'আপনার নাম লিখুন' : 'Enter your full name'} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} *</label>
                <input 
                  type="tel" 
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  placeholder="01XXXXXXXXX" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'বাসা নম্বর' : 'House Number'}</label>
                  <input 
                    type="text" 
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    placeholder="31/2" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'রোড / এলাকা' : 'Road / Area'}</label>
                  <input 
                    type="text" 
                    name="road_area"
                    value={formData.road_area}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    placeholder="দক্ষিণ জনতা বাগ" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'ওয়ার্ড নম্বর' : 'Ward Number'}</label>
                  <input 
                    type="text" 
                    name="ward_number"
                    value={formData.ward_number}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    placeholder="60" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'থানা' : 'Thana'} *</label>
                  <input 
                    type="text" 
                    name="thana"
                    value={formData.thana}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    placeholder="Kadamtali" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'জেলা' : 'District'} *</label>
                  <select 
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="Dhaka">Dhaka</option>
                    <option value="Outside Dhaka">Outside Dhaka</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 ml-1">{language === 'bn' ? 'পোস্ট কোড' : 'Post Code'}</label>
                  <input 
                    type="text" 
                    name="post_code"
                    value={formData.post_code}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    placeholder="1236" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-black text-gray-800">{language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === 'cod' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-emerald-200'}`}>
                <input 
                  type="radio" 
                  name="payment_method" 
                  value="cod"
                  checked={formData.payment_method === 'cod'}
                  onChange={handleInputChange}
                  className="accent-emerald-600" 
                />
                <div className="flex flex-col">
                  <span className={`text-xs font-black ${formData.payment_method === 'cod' ? 'text-emerald-800' : 'text-gray-700'}`}>{language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}</span>
                  <span className={`text-[10px] font-bold ${formData.payment_method === 'cod' ? 'text-emerald-600' : 'text-gray-400'}`}>{language === 'bn' ? 'হাতে পণ্য পেয়ে টাকা দিন' : 'Pay when you receive'}</span>
                </div>
              </label>
              
              {['bkash', 'nagad', 'rocket'].map(method => (
                <label key={method} className={`relative flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${formData.payment_method === method ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-emerald-200'}`}>
                  <input 
                    type="radio" 
                    name="payment_method" 
                    value={method}
                    checked={formData.payment_method === method}
                    onChange={handleInputChange}
                    className="accent-emerald-600" 
                  />
                  <div className="flex flex-col">
                    <span className={`text-xs font-black uppercase ${formData.payment_method === method ? 'text-emerald-800' : 'text-gray-700'}`}>{method}</span>
                    <span className={`text-[10px] font-bold ${formData.payment_method === method ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {settings[`payment_${method}_number`] ? settings[`payment_${method}_number`] : (language === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'Payment Gateway')}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {formData.payment_method !== 'cod' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4 animate-fade-in">
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  {language === 'bn' ? `দয়া করে ${formData.payment_method.toUpperCase()} নম্বরে টাকা পাঠিয়ে নিচের তথ্যগুলো দিন:` : `Please send money to the ${formData.payment_method.toUpperCase()} number and provide details:`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500">{language === 'bn' ? 'ট্রানজ্যাকশন আইডি' : 'Transaction ID'}</label>
                    <input 
                      type="text" 
                      name="payment_transaction_id"
                      value={formData.payment_details.transaction_id}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500" 
                      placeholder="TRX123456" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500">{language === 'bn' ? 'যে নম্বর থেকে পাঠিয়েছেন' : 'Sender Number'}</label>
                    <input 
                      type="tel" 
                      name="payment_sender_number"
                      value={formData.payment_details.sender_number}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500" 
                      placeholder="01XXXXXXXXX" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              {language === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
            </h2>

            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">৳{item.price} x {item.quantity}</p>
                  </div>
                  <span className="text-xs font-black text-gray-700">৳{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold">{language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</span>
                <span className="text-gray-800 font-black">৳{cartTotal}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-bold">{language === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Charge'}</span>
                <span className="text-gray-800 font-black">৳{deliveryCharge}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100">
                <span className="text-base font-black text-gray-900">{language === 'bn' ? 'মোট দেয় মূল্য' : 'Total Payable'}</span>
                <span className="text-xl font-black text-emerald-600">৳{finalTotal}</span>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                language === 'bn' ? 'অর্ডার কনফার্ম করুন' : 'Confirm Order'
              )}
            </button>
            
            <p className="text-[10px] text-center text-gray-400 font-bold mt-4">
              {language === 'bn' ? 'অর্ডার কনফার্ম করার মাধ্যমে আপনি আমাদের শর্তাবলীতে রাজি হচ্ছেন।' : 'By confirming, you agree to our Terms & Conditions.'}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};
