import React, { useState, useEffect } from 'react';
import { 
  X, 
  Leaf, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  Lock 
} from 'lucide-react';
import { getTranslatedName, DIVISION_DISTRICTS } from '../utils/translations';
import { accountService } from '../utils/accountService';
import { tracking } from '../utils/tracking';

interface ProductCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  selectedVariant: any;
  quantity: number;
  priceDetails: {
    price: number;
    oldPrice: number;
    discountPercent: number;
  };
  mainImage: string;
  specs: any;
  language: 'en' | 'bn';
  currentUser: any;
}

export const ProductCheckoutModal: React.FC<ProductCheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant,
  quantity,
  priceDetails,
  mainImage,
  specs,
  language,
  currentUser
}) => {
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment'>('info');
  const [checkoutName, setCheckoutName] = useState<string>('');
  const [checkoutPhone, setCheckoutPhone] = useState<string>('');
  const [checkoutAddress, setCheckoutAddress] = useState<string>('');
  const [checkoutDivision, setCheckoutDivision] = useState<string>('');
  const [checkoutDistrict, setCheckoutDistrict] = useState<string>('');
  const [checkoutEmail, setCheckoutEmail] = useState<string>('');
  const [checkoutErrors, setCheckoutErrors] = useState<Record<string, string>>({});
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'visa' | 'mastercard' | 'amex'>('cod');
  const [checkoutTxnId, setCheckoutTxnId] = useState<string>('');
  const [checkoutCardType, setCheckoutCardType] = useState<'credit' | 'debit'>('credit');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState<string>('');
  const [checkoutCardHolder, setCheckoutCardHolder] = useState<string>('');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState<string>('');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState<string>('');
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<any | null>(null);

  const isUserLoggedIn = !!currentUser;

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setCheckoutName(currentUser.full_name || '');
        setCheckoutPhone(currentUser.phone || '');
        setCheckoutAddress(currentUser.address || '');
        setCheckoutDivision(currentUser.division || '');
        setCheckoutDistrict(currentUser.district || '');
        setCheckoutEmail(currentUser.email || '');
      } else {
        setCheckoutName('');
        setCheckoutPhone('');
        setCheckoutAddress('');
        setCheckoutDivision('');
        setCheckoutDistrict('');
        setCheckoutEmail('');
      }
      setCheckoutPaymentMethod('cod');
      setCheckoutTxnId('');
      setCheckoutCardType('credit');
      setCheckoutCardNumber('');
      setCheckoutCardHolder('');
      setCheckoutCardExpiry('');
      setCheckoutCardCvv('');
      setCheckoutStep('info');
      setCheckoutErrors({});
      setCheckoutSuccessOrder(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !product) return null;

  const subtotal = priceDetails ? (priceDetails.price * quantity) : 0;
  const discount = priceDetails ? ((priceDetails.oldPrice > priceDetails.price ? (priceDetails.oldPrice - priceDetails.price) : 0) * quantity) : 0;
  const deliveryCharge = checkoutDivision && checkoutDivision.includes('Dhaka') ? 60 : 120;
  const grandTotal = subtotal + deliveryCharge;

  const handleDivisionChange = (div: string) => {
    setCheckoutDivision(div);
    setCheckoutDistrict('');
  };

  const validateCheckoutForm = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmedName = checkoutName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      errors.name = language === 'bn' ? 'অনুগ্রহ করে আপনার সঠিক পূর্ণ নাম লিখুন।' : 'Please enter a valid full name.';
    }

    const trimmedPhone = checkoutPhone.trim();
    if (!trimmedPhone || !/^[0-9]{11}$/.test(trimmedPhone)) {
      errors.phone = language === 'bn' ? 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।' : 'Enter a valid 11-digit Bangladesh mobile number.';
    }

    const trimmedAddress = checkoutAddress.trim();
    if (!trimmedAddress || trimmedAddress.length < 8) {
      errors.address = language === 'bn' ? 'অনুগ্রহ করে সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।' : 'Please enter your complete delivery address.';
    }

    const trimmedEmail = checkoutEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = language === 'bn' ? 'সঠিক ইমেল ঠিকানা লিখুন।' : 'Please enter a valid email address.';
    }

    setCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePaymentStep = (): boolean => {
    const errors: Record<string, string> = {};
    if (['bkash', 'nagad', 'rocket', 'bank'].includes(checkoutPaymentMethod)) {
      if (!checkoutTxnId.trim() || checkoutTxnId.trim().length < 4) {
        errors.txnId = language === 'bn' ? 'সঠিক ট্রানজেকশন আইডি দিন।' : 'Please enter a valid Transaction ID.';
      }
    } else if (['visa', 'mastercard', 'amex'].includes(checkoutPaymentMethod)) {
      const cardNumClean = checkoutCardNumber.replace(/\s+/g, '');
      if (!cardNumClean || cardNumClean.length < 15) {
        errors.cardNumber = language === 'bn' ? 'সঠিক কার্ড নম্বর দিন।' : 'Enter a valid card number.';
      }
      if (!checkoutCardHolder.trim()) {
        errors.cardHolder = language === 'bn' ? 'কার্ডধারীর নাম লিখুন।' : 'Cardholder name is required.';
      }
      if (!checkoutCardExpiry.trim() || !/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(checkoutCardExpiry.trim())) {
        errors.cardExpiry = language === 'bn' ? 'সঠিক মেয়াদ (MM/YY) দিন।' : 'Valid expiry (MM/YY) required.';
      }
      if (!checkoutCardCvv.trim() || checkoutCardCvv.trim().length < 3) {
        errors.cardCvv = language === 'bn' ? '৩ বা ৪ ডিজিটের সিভিভি দিন।' : '3 or 4 digit CVV required.';
      }
    }
    setCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = () => {
    if (!validatePaymentStep()) return;

    const custId = currentUser ? currentUser.id : (Math.floor(Math.random() * 90000) + 10000);
    const productStr = `${quantity}x ${getTranslatedName(product.name, 'en')} (${selectedVariant ? selectedVariant.name : (specs?.unit || '')})`;
    const createdOrder = accountService.createOrder(
      custId, 
      productStr, 
      grandTotal, 
      checkoutPaymentMethod, 
      checkoutPaymentMethod === 'cod' ? 'Pending' : 'Completed', 
      checkoutTxnId || undefined
    );
    setCheckoutSuccessOrder(createdOrder);

    tracking.track('Purchase', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      contents: [{
        id: product.id,
        name: product.name,
        quantity: quantity,
        item_price: priceDetails.price
      }],
      value: grandTotal,
      currency: 'BDT',
      transaction_id: createdOrder.id
    });
  };

  return (
    <div 
      className="fixed inset-0 w-full h-[100dvh] bg-[#fcfcfb] z-[200] flex flex-col overflow-hidden animate-fade-in" 
      id="buy-now-integration-modal"
    >
      <div 
        className="bg-white w-full max-w-xl h-full flex flex-col mx-auto relative md:border-l md:border-r md:border-gray-150 md:shadow-2xl overflow-hidden" 
        id="checkout-modal-container"
      >
        {/* FIXED TOP COMPANY BANNER */}
        <div className="w-full bg-white border-b border-gray-100 py-2.5 px-4 flex items-center justify-between shrink-0 sticky top-0 z-20" id="checkout-company-banner">
          <div className="flex items-center gap-2.5" id="checkout-banner-branding">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/40 flex items-center justify-center shrink-0" id="checkout-banner-logo">
              <Leaf className="w-4.5 h-4.5 fill-emerald-600/10 text-emerald-600" />
            </div>
            <div className="flex flex-col text-left leading-tight" id="checkout-banner-text">
              <span className="text-xs font-black tracking-widest text-emerald-800 font-sans uppercase">
                SHAD GHOR
              </span>
              <span className="text-[9px] font-semibold text-gray-400">
                {language === 'bn' ? 'স্বাদ ঘর-এ আপনাকে স্বাগতম' : 'Welcome to SHAD GHOR'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            id="close-checkout-modal-btn"
            aria-label="Close Checkout"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SCROLLABLE ORDER CONTENT */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-left pb-28 scrollbar-thin" id="checkout-modal-body">
          {checkoutSuccessOrder ? (
            <div className="py-8 text-center space-y-6 animate-fade-in" id="checkout-success-view">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100/50 shadow-inner animate-bounce" id="success-checkmark-container">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-black text-gray-800 text-lg" id="success-main-title">
                  {language === 'bn' ? 'অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!' : 'Order Placed Successfully!'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto" id="success-desc-text">
                  {language === 'bn' 
                    ? 'অভিনন্দন! স্বাদ ঘর থেকে আপনার অর্ডারটি সফলভাবে নথিভুক্ত করা হয়েছে। আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।' 
                    : 'Congratulations! Your order has been successfully recorded in Shad Ghor. Our representative will contact you shortly.'}
                </p>
              </div>

              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-xs space-y-3 max-w-sm mx-auto" id="success-invoice-box">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="font-bold text-gray-400">{language === 'bn' ? 'অর্ডার আইডি:' : 'Order ID:'}</span>
                  <span className="font-black text-emerald-600 tracking-wider text-sm">{checkoutSuccessOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="font-bold text-gray-400">{language === 'bn' ? 'তারিখ:' : 'Date:'}</span>
                  <span className="font-bold text-gray-700">{checkoutSuccessOrder.date}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="font-bold text-gray-400">{language === 'bn' ? 'পণ্যসমূহ:' : 'Products:'}</span>
                  <span className="font-extrabold text-gray-700 text-right max-w-[200px] truncate">{checkoutSuccessOrder.products}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="font-bold text-gray-400">{language === 'bn' ? 'মোট মূল্য:' : 'Total Amount:'}</span>
                  <span className="font-black text-emerald-600">৳{checkoutSuccessOrder.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-gray-400">{language === 'bn' ? 'ডেলিভারি ঠিকানা:' : 'Delivery Address:'}</span>
                  <span className="font-bold text-gray-700 text-right line-clamp-1 max-w-[180px]">{checkoutAddress}</span>
                </div>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                  id="success-continue-shopping-btn"
                >
                  {language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step indicator & title */}
              <div className="flex flex-col gap-1 border-b border-gray-100 pb-3" id="checkout-step-indicator">
                <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase">
                  {checkoutStep === 'info' 
                    ? (language === 'bn' ? 'ধাপ ১/২' : 'Step 1 of 2')
                    : (language === 'bn' ? 'ধাপ ২/২' : 'Step 2 of 2')}
                </span>
                <h3 className="text-sm font-black text-emerald-800">
                  {checkoutStep === 'info' 
                    ? (language === 'bn' ? 'কাস্টমার তথ্য' : 'Customer Information')
                    : (language === 'bn' ? 'পেমেন্ট নির্ধারণ ও পর্যালোচনা' : 'Payment & Review')}
                </h3>
              </div>

              {/* Product details display card */}
              <div className="bg-emerald-50/20 border border-emerald-100/40 rounded-2xl p-4 flex gap-4 items-center" id="checkout-selected-product-card">
                <img 
                  src={mainImage || product.imageUrl} 
                  alt={product.name} 
                  className="w-14 h-14 object-cover rounded-xl border border-gray-150 shrink-0 bg-white"
                  id="checkout-product-img"
                />
                <div className="flex-1 min-w-0" id="checkout-product-text">
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {language === 'bn' ? 'নির্বাচিত পণ্য' : 'Selected Product'}
                  </span>
                  <h5 className="font-extrabold text-gray-800 text-xs truncate mt-1" id="checkout-product-title">
                    {getTranslatedName(product.name, language)}
                  </h5>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 font-bold">
                    <span>{language === 'bn' ? 'ওজন/সাইজ:' : 'Weight/Size:'} <strong className="text-gray-700">{selectedVariant ? selectedVariant.name : (specs?.unit || '')}</strong></span>
                    <span className="text-gray-300">•</span>
                    <span>{language === 'bn' ? 'পরিমাণ:' : 'Qty:'} <strong className="text-gray-700">{quantity}</strong></span>
                  </div>
                </div>
                <div className="text-right shrink-0" id="checkout-product-pricing">
                  <p className="text-[10px] text-gray-400 font-bold">
                    ৳{priceDetails.price} {language === 'bn' ? 'প্রতিটি' : 'each'}
                  </p>
                  <p className="text-xs font-black text-emerald-600 mt-0.5">
                    ৳{priceDetails.price * quantity}
                  </p>
                </div>
              </div>

              {priceDetails.oldPrice > priceDetails.price && (
                <div className="bg-rose-50 border border-rose-100/50 rounded-xl px-3 py-2 flex items-center justify-between text-[10px] text-rose-700" id="checkout-discount-badge">
                  <span className="font-bold flex items-center gap-1">
                    🎉 {language === 'bn' ? 'বিশেষ ছাড় প্রযোজ্য হয়েছে' : 'Special Discount Applied'}
                  </span>
                  <span className="bg-rose-100 text-rose-800 font-black px-1.5 py-0.5 rounded">
                    {language === 'bn' ? `${priceDetails.discountPercent}% ছাড়` : `${priceDetails.discountPercent}% OFF`}
                  </span>
                </div>
              )}

              {checkoutStep === 'info' ? (
                <div className="space-y-4" id="checkout-info-step">
                  {isUserLoggedIn && (
                    <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[10px] text-emerald-800" id="checkout-saved-info-badge">
                      <span className="font-bold">
                        {language === 'bn' ? 'প্রোফাইল থেকে তথ্য লোড হয়েছে' : 'Loaded saved info from profile'}
                      </span>
                      <span className="bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase">
                        {language === 'bn' ? 'সম্পাদনাযোগ্য' : 'Editable'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1" id="checkout-name-group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={checkoutName}
                      onChange={(e) => {
                        setCheckoutName(e.target.value);
                        if (checkoutErrors.name) setCheckoutErrors(prev => ({ ...prev, name: '' }));
                      }}
                      placeholder={language === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                      className={`w-full h-10 px-3 border bg-white text-xs font-bold rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none ${
                        checkoutErrors.name ? 'border-red-400' : 'border-gray-200'
                      }`}
                      id="checkout-name-input"
                    />
                    {checkoutErrors.name && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{checkoutErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1" id="checkout-phone-group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20 transition-all bg-white" id="checkout-phone-input-wrapper">
                      <div className="bg-gray-50 border-r border-gray-150 px-3 flex items-center gap-1.5 shrink-0 text-xs font-bold text-gray-500 select-none">
                        <span className="text-base">🇧🇩</span>
                        <span>+880</span>
                      </div>
                      <input
                        type="tel"
                        value={checkoutPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setCheckoutPhone(digits);
                          if (checkoutErrors.phone) setCheckoutErrors(prev => ({ ...prev, phone: '' }));
                        }}
                        placeholder="01712345678"
                        className="flex-1 h-10 px-3 bg-transparent text-xs font-bold text-gray-700 outline-none"
                        id="checkout-phone-input"
                      />
                    </div>
                    {checkoutErrors.phone && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{checkoutErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1" id="checkout-address-group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {language === 'bn' ? 'সম্পূর্ণ ঠিকানা' : 'Full Address'} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={checkoutAddress}
                      onChange={(e) => {
                        setCheckoutAddress(e.target.value);
                        if (checkoutErrors.address) setCheckoutErrors(prev => ({ ...prev, address: '' }));
                      }}
                      placeholder={language === 'bn' ? 'বাসা/ফ্ল্যাট নং, রোড নং, এলাকা এবং থানার নাম লিখুন' : 'House/Flat, Road, Area, Thana, nearby landmark'}
                      className={`w-full p-3 border bg-white text-xs font-bold rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none resize-none ${
                        checkoutErrors.address ? 'border-red-400' : 'border-gray-200'
                      }`}
                      id="checkout-address-textarea"
                    />
                    {checkoutErrors.address && (
                      <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{checkoutErrors.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5" id="checkout-division-district-group">
                    <div className="space-y-1" id="checkout-division-group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        {language === 'bn' ? 'বিভাগ (ঐচ্ছিক)' : 'Division (Optional)'}
                      </label>
                      <select
                        value={checkoutDivision}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full h-10 px-2 border border-gray-200 bg-white text-xs font-bold rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none"
                        id="checkout-division-select"
                      >
                        <option value="">{language === 'bn' ? '-- নির্বাচন করুন --' : '-- Select --'}</option>
                        {Object.keys(DIVISION_DISTRICTS).map((div) => (
                          <option key={div} value={div}>
                            {div}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1" id="checkout-district-group">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                        {language === 'bn' ? 'জেলা (ঐচ্ছিক)' : 'District (Optional)'}
                      </label>
                      <select
                        value={checkoutDistrict}
                        onChange={(e) => setCheckoutDistrict(e.target.value)}
                        disabled={!checkoutDivision}
                        className="w-full h-10 px-2 border border-gray-200 bg-white text-xs font-bold rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none disabled:bg-gray-50 disabled:opacity-50"
                        id="checkout-district-select"
                      >
                        <option value="">{language === 'bn' ? '-- জেলা --' : '-- District --'}</option>
                        {(checkoutDivision ? (DIVISION_DISTRICTS[checkoutDivision] || []) : []).map((dist) => (
                          <option key={dist} value={dist}>
                            {dist}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1" id="checkout-email-group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                      {language === 'bn' ? 'ইমেল (ঐচ্ছিক)' : 'Email (Optional)'}
                    </label>
                    <input
                      type="email"
                      value={checkoutEmail}
                      onChange={(e) => {
                        setCheckoutEmail(e.target.value);
                        if (checkoutErrors.email) setCheckoutErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="customer@gmail.com"
                      className={`w-full h-10 px-3 border bg-white text-xs font-bold rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all outline-none ${
                        checkoutErrors.email ? 'border-red-400' : 'border-gray-200'
                      }`}
                      id="checkout-email-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in" id="checkout-payment-step">
                  <div className="bg-emerald-50/10 border border-emerald-500/10 rounded-2xl p-4 text-xs space-y-2" id="checkout-billing-review">
                    <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
                      {language === 'bn' ? 'ডেলিভারি ও কাস্টমার তথ্য' : 'Delivery & Customer Info'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 font-bold text-gray-600">
                      <p><span className="text-gray-400">{language === 'bn' ? 'নাম:' : 'Name:'}</span> <span className="text-gray-800">{checkoutName}</span></p>
                      <p><span className="text-gray-400">{language === 'bn' ? 'ফোন নম্বর:' : 'Phone:'}</span> <span className="text-gray-800">+880 {checkoutPhone}</span></p>
                      <p className="sm:col-span-2"><span className="text-gray-400">{language === 'bn' ? 'ঠিকানা:' : 'Address:'}</span> <span className="text-gray-800">{checkoutAddress}{checkoutDistrict ? `, ${checkoutDistrict}` : ''}{checkoutDivision ? `, ${checkoutDivision}` : ''}</span></p>
                      {checkoutEmail && <p className="sm:col-span-2"><span className="text-gray-400">{language === 'bn' ? 'ইমেল:' : 'Email:'}</span> <span className="text-gray-800">{checkoutEmail}</span></p>}
                    </div>
                  </div>

                  <div className="space-y-3" id="checkout-payment-methods">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-left">
                      {language === 'bn' ? 'পেমেন্ট পদ্ধতি নির্ধারণ করুন' : 'Select Payment Method'} <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" id="payment-methods-grid">
                      {[
                        { slug: 'cod', name: 'COD', icon: <span className="text-[9px] font-black text-emerald-800">COD</span> },
                        { slug: 'bkash', name: 'bKash', icon: <div className="h-6 px-2 bg-[#E2136E] text-white font-black text-[9px] rounded flex items-center justify-center">bKash</div> },
                        { slug: 'nagad', name: 'Nagad', icon: <div className="h-6 px-2 bg-[#F7941D] text-white font-black text-[9px] rounded flex items-center justify-center">Nagad</div> },
                        { slug: 'rocket', name: 'Rocket', icon: <div className="h-6 px-2 bg-[#8C3494] text-white font-black text-[9px] rounded flex items-center justify-center">Rocket</div> },
                        { slug: 'bank', name: 'Bank', icon: <span className="text-[10px] font-black text-blue-800">Bank</span> },
                        { slug: 'visa', name: 'VISA', icon: <span className="text-[12px] font-black italic text-[#1A1F71]">VISA</span> },
                        { slug: 'mastercard', name: 'Mastercard', icon: <span className="text-[9px] font-black text-gray-800">MC</span> },
                        { slug: 'amex', name: 'AMEX', icon: <span className="text-[9px] font-black text-[#016FD0]">AMEX</span> }
                      ].map((method) => {
                        const isSelected = checkoutPaymentMethod === method.slug;
                        return (
                          <button
                            key={method.slug}
                            type="button"
                            onClick={() => {
                              setCheckoutPaymentMethod(method.slug as any);
                              setCheckoutTxnId('');
                              setCheckoutErrors({});
                            }}
                            className={`relative flex flex-col items-center justify-center p-1.5 h-[52px] rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-emerald-600 bg-emerald-50/15 ring-1.5 ring-emerald-500/15 text-emerald-900 font-extrabold' 
                                : 'border-gray-150 bg-white hover:bg-gray-50/50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {method.icon}
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full flex items-center justify-center shadow-3xs">
                                <Check className="w-1.5 h-1.5 text-white stroke-[4]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 text-left" id="payment-conditional-container">
                      {checkoutPaymentMethod === 'cod' && (
                        <div className="text-center py-2 text-[10px] font-extrabold text-emerald-700 bg-emerald-50/20 border border-emerald-100 rounded-lg animate-fade-in">
                          {language === 'bn' ? 'পণ্য হাতে পাওয়ার সময় ক্যাশ পেমেন্ট করুন।' : 'Pay in cash upon receiving the product.'}
                        </div>
                      )}

                      {['bkash', 'nagad', 'rocket'].includes(checkoutPaymentMethod) && (
                        <div className="border border-gray-150 bg-gray-50/40 rounded-xl p-3 text-xs space-y-2.5 animate-fade-in">
                          <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                            {language === 'bn' 
                              ? `আমাদের ${checkoutPaymentMethod.toUpperCase()} নম্বরে ৳${grandTotal} টাকা পরিশোধ করে ট্রানজেকশন আইডিটি দিন:`
                              : `Please send ৳${grandTotal} to our official ${checkoutPaymentMethod.toUpperCase()} number and enter Transaction ID below:`}
                          </p>
                          <input
                            type="text"
                            value={checkoutTxnId}
                            onChange={(e) => {
                              setCheckoutTxnId(e.target.value.toUpperCase());
                              if (checkoutErrors.txnId) setCheckoutErrors(prev => ({ ...prev, txnId: '' }));
                            }}
                            placeholder={language === 'bn' ? 'ট্রানজেকশন আইডি লিখুন (যেমন: 8X3N9K2L)' : 'Enter Transaction ID (e.g. 8X3N9K2L)'}
                            className={`w-full h-9 px-3 border bg-white text-xs font-bold rounded-lg outline-none focus:border-emerald-500 transition-all ${
                              checkoutErrors.txnId ? 'border-red-400' : 'border-gray-200'
                            }`}
                          />
                          {checkoutErrors.txnId && (
                            <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                              <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                              <span>{checkoutErrors.txnId}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary bill */}
                  <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3.5 space-y-2">
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="text-gray-500">
                          <td className="py-1">{language === 'bn' ? 'সাবটোটাল:' : 'Subtotal:'}</td>
                          <td className="py-1 text-right font-bold text-gray-700">৳{subtotal}</td>
                        </tr>
                        {discount > 0 && (
                          <tr className="text-emerald-600">
                            <td className="py-1">{language === 'bn' ? 'ছাড়:' : 'Discount:'}</td>
                            <td className="py-1 text-right font-bold">-৳{discount}</td>
                          </tr>
                        )}
                        <tr className="text-gray-500">
                          <td className="py-1">
                            {language === 'bn' ? 'ডেলিভারি চার্জ:' : 'Delivery Charge:'} ({checkoutDivision?.includes('Dhaka') ? (language === 'bn' ? 'ঢাকা' : 'Dhaka') : (language === 'bn' ? 'ঢাকার বাইরে' : 'Outside')})
                          </td>
                          <td className="py-1 text-right font-bold text-gray-700">৳{deliveryCharge}</td>
                        </tr>
                        <tr className="border-t border-gray-200 text-gray-900 font-extrabold text-sm">
                          <td className="pt-2">{language === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Total Amount:'}</td>
                          <td className="pt-2 text-right text-emerald-600 font-black">৳{grandTotal}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        {!checkoutSuccessOrder && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/40 flex gap-2.5 shrink-0 pb-safe pb-4" id="checkout-modal-footer">
            {checkoutStep === 'info' ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  id="checkout-cancel-btn"
                >
                  {language === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateCheckoutForm()) {
                      tracking.track('AddPaymentInfo', {
                        content_ids: [product.id],
                        content_name: product.name,
                        content_type: 'product',
                        value: grandTotal,
                        currency: 'BDT',
                        contents: [{
                          id: product.id,
                          name: product.name,
                          quantity: quantity,
                          item_price: priceDetails.price
                        }]
                      });
                      setCheckoutStep('payment');
                    }
                  }}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                  id="checkout-next-btn"
                >
                  {language === 'bn' ? 'পরবর্তী পদক্ষেপে যান' : 'Next Step'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('info')}
                  className="flex-1 h-10 border border-gray-200 hover:bg-gray-50 text-gray-500 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  id="checkout-back-to-info-btn"
                >
                  {language === 'bn' ? 'তথ্য পরিবর্তন করুন' : 'Back to Info'}
                </button>
                <button
                  type="button"
                  onClick={handleOrderSubmit}
                  className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-xs"
                  id="checkout-confirm-order-btn"
                >
                  {language === 'bn' ? 'অর্ডার নিশ্চিত করুন' : 'Confirm Order'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
