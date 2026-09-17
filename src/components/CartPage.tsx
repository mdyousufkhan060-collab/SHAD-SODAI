import React, { useState, useEffect } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cartService } from '../utils/cartService';
import { getTranslatedName } from '../utils/translations';
import { PRODUCTS } from '../data';
import { Breadcrumbs } from './Breadcrumbs';

export const CartPage = () => {
  const { language, t } = useLanguage();
  const [cartItems, setCartItems] = useState(cartService.getCartItems());
  const [cartCount, setCartCount] = useState(cartService.getCartCount());

  useEffect(() => {
    const handleCartSync = () => {
      setCartCount(cartService.getCartCount());
      setCartItems(cartService.getCartItems());
    };
    window.addEventListener('cart-updated', handleCartSync);
    return () => window.removeEventListener('cart-updated', handleCartSync);
  }, []);

  const handleIncreaseQty = (productId: string, variantId?: number) => {
    const item = cartItems.find(i => i.productId === productId && i.variantId === variantId);
    if (item) {
      cartService.updateCartQuantity(productId, item.quantity + 1, variantId);
    }
  };

  const handleDecreaseQty = (productId: string, variantId?: number) => {
    const item = cartItems.find(i => i.productId === productId && i.variantId === variantId);
    if (item && item.quantity > 1) {
      cartService.updateCartQuantity(productId, item.quantity - 1, variantId);
    } else {
      cartService.removeFromCart(productId, variantId);
    }
  };

  const handleRemoveItem = (productId: string, variantId?: number) => {
    cartService.removeFromCart(productId, variantId);
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 min-h-screen" id="cart-page">
      <Breadcrumbs 
        items={[
          { 
            label: language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart', 
            active: true 
          }
        ]} 
      />

      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-emerald-600" />
          {language === 'bn' ? 'আপনার শপিং কার্ট' : 'Your Shopping Cart'}
          <span className="text-sm font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full ml-2">
            {cartCount} {language === 'bn' ? 'টি পণ্য' : 'Items'}
          </span>
        </h1>
      </header>

      {cartItems.length === 0 ? (
        <section className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm max-w-2xl mx-auto mt-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {language === 'bn' ? 'আপনার কার্টটি খালি!' : 'Your cart is empty!'}
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {language === 'bn' ? 'আপনি এখনো কোনো পণ্য যোগ করেননি। আমাদের সেরা পণ্যগুলো দেখে নিন।' : "You haven't added any products yet. Explore our wide range of organic products."}
          </p>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            {language === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Items List */}
          <section className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="col-span-6">{language === 'bn' ? 'পণ্য' : 'Product'}</div>
                <div className="col-span-2 text-center">{language === 'bn' ? 'মূল্য' : 'Price'}</div>
                <div className="col-span-2 text-center">{language === 'bn' ? 'পরিমাণ' : 'Quantity'}</div>
                <div className="col-span-2 text-right">{language === 'bn' ? 'মোট' : 'Total'}</div>
              </div>

              <div className="divide-y divide-gray-50">
                {cartItems.map((item, idx) => {
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  if (!product) return null;

                  return (
                    <article key={`${item.productId}-${item.variantId || idx}`} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      <div className="col-span-6 flex gap-4">
                        <img src={product.imageUrl} alt={product.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-gray-100" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-1 truncate">
                            {getTranslatedName(product.name, language)}
                          </h3>
                          {item.variantName && (
                            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-md mb-2">
                              {language === 'bn' ? 'ওজন:' : 'Size:'} {item.variantName}
                            </p>
                          )}
                          <button 
                            onClick={() => handleRemoveItem(item.productId, item.variantId)}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {language === 'bn' ? 'সরিয়ে ফেলুন' : 'Remove'}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-center hidden md:block">
                        <span className="text-sm font-bold text-gray-600">৳{item.price}</span>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center justify-center gap-3 border border-gray-100 bg-gray-50 rounded-xl p-1 w-28 mx-auto md:w-full">
                          <button 
                            onClick={() => handleDecreaseQty(item.productId, item.variantId)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-emerald-600 shadow-sm transition-all"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-sm font-black text-gray-800">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleIncreaseQty(item.productId, item.variantId)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-emerald-600 shadow-sm transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="text-base font-black text-emerald-600">৳{item.price * item.quantity}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Cart Summary Card */}
          <section className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-gray-800 border-b border-gray-50 pb-4">
                {language === 'bn' ? 'অর্ডার সামারি' : 'Order Summary'}
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">{language === 'bn' ? 'মোট পণ্যের দাম' : 'Subtotal'}</span>
                  <span className="text-gray-800 font-black">৳{cartTotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">{language === 'bn' ? 'ডেলিভারি চার্জ' : 'Delivery Fee'}</span>
                  <span className="text-emerald-600 font-black">{language === 'bn' ? 'অর্ডারের সময় যোগ করা হবে' : 'Calculated at checkout'}</span>
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-base font-black text-gray-800">{language === 'bn' ? 'সর্বমোট' : 'Total'}</span>
                  <span className="text-xl font-black text-emerald-600">৳{cartTotal}</span>
                </div>
              </div>

              <button 
                onClick={() => window.location.hash = '#/checkout'}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-600/20 group"
              >
                <span>{language === 'bn' ? 'অর্ডার সম্পন্ন করুন' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="bg-emerald-50 rounded-xl p-4 flex gap-3 items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed">
                  {language === 'bn' ? 'খাঁটি ও প্রাকৃতিক পণ্য সরাসরি আপনার দোরগোড়ায়। ৫০০০ টাকার বেশি অর্ডারে ফ্রি ডেলিভারি!' : 'Pure and organic products delivered to your doorstep. Free delivery on orders over ৳5000!'}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
