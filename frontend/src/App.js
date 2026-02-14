import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { WishlistProvider } from "@/components/Wishlist";
import { CartProvider } from "@/components/Cart";
import { LanguageProvider } from "@/components/Language";
import { CustomerProvider } from "@/components/CustomerAccount";
import HomePage from "@/pages/HomePage";
import ProductPage from "@/pages/ProductPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import InvoicePage from "@/pages/InvoicePage";
import AboutPage from "@/pages/AboutPage";
import FAQPage from "@/pages/FAQPage";
import TermsPage from "@/pages/TermsPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import DailyRewardPage from "@/pages/DailyRewardPage";
import CustomerAccountPage from "@/pages/CustomerAccountPage";
import OrderTrackingPage from "@/pages/OrderTrackingPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminFAQs from "@/pages/admin/AdminFAQs";
import AdminPages from "@/pages/admin/AdminPages";
import AdminSocialLinks from "@/pages/admin/AdminSocialLinks";
import AdminPaymentMethods from "@/pages/admin/AdminPaymentMethods";
import AdminNotificationBar from "@/pages/admin/AdminNotificationBar";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes";
import AdminPricingSettings from "@/pages/admin/AdminPricingSettings";
import AdminTrustpilot from "@/pages/admin/AdminTrustpilot";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminCreditSettings from "@/pages/admin/AdminCreditSettings";
import AdminDailyReward from "@/pages/admin/AdminDailyReward";
import AdminReferral from "@/pages/admin/AdminReferral";
import AdminMultiplier from "@/pages/admin/AdminMultiplier";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/App.css";

// Track website visits
const trackVisit = () => {
  // Generate or get visitor ID
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('visitor_id', visitorId);
  }
  
  // Track the visit
  fetch(`${process.env.REACT_APP_BACKEND_URL}/api/track-visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-ID': visitorId
    }
  }).catch(() => {}); // Silent fail
};

function App() {
  useEffect(() => {
    trackVisit();
  }, []);

  return (
    <LanguageProvider>
      <CustomerProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="App min-h-screen bg-black">
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/product/:productSlug" element={<ProductPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/payment/:orderId" element={<PaymentPage />} />
                  <Route path="/invoice/:orderId" element={<InvoicePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/blog/:slug" element={<BlogPostPage />} />
                  <Route path="/daily-reward" element={<DailyRewardPage />} />
                  <Route path="/account" element={<CustomerAccountPage />} />
                  <Route path="/track-order" element={<OrderTrackingPage />} />

                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute requiredPermission="view_analytics"><AdminAnalytics /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute requiredPermission="view_products"><AdminProducts /></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute requiredPermission="view_categories"><AdminCategories /></ProtectedRoute>} />
                  <Route path="/admin/reviews" element={<ProtectedRoute requiredPermission="view_reviews"><AdminReviews /></ProtectedRoute>} />
                  <Route path="/admin/faqs" element={<ProtectedRoute requiredPermission="view_faqs"><AdminFAQs /></ProtectedRoute>} />
                  <Route path="/admin/pages" element={<ProtectedRoute requiredPermission="view_pages"><AdminPages /></ProtectedRoute>} />
                  <Route path="/admin/social-links" element={<ProtectedRoute requiredPermission="view_settings"><AdminSocialLinks /></ProtectedRoute>} />
                  <Route path="/admin/payment-methods" element={<ProtectedRoute requiredPermission="view_settings"><AdminPaymentMethods /></ProtectedRoute>} />
                  <Route path="/admin/notification-bar" element={<ProtectedRoute requiredPermission="view_settings"><AdminNotificationBar /></ProtectedRoute>} />
                  <Route path="/admin/blog" element={<ProtectedRoute requiredPermission="view_blog"><AdminBlog /></ProtectedRoute>} />
                  <Route path="/admin/promo-codes" element={<ProtectedRoute requiredPermission="view_settings"><AdminPromoCodes /></ProtectedRoute>} />
                  <Route path="/admin/pricing" element={<ProtectedRoute requiredPermission="view_settings"><AdminPricingSettings /></ProtectedRoute>} />
                  <Route path="/admin/trustpilot" element={<ProtectedRoute requiredPermission="view_settings"><AdminTrustpilot /></ProtectedRoute>} />
                  <Route path="/admin/customers" element={<ProtectedRoute requiredPermission="view_customers"><AdminCustomers /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute requiredPermission="view_orders"><AdminOrders /></ProtectedRoute>} />
                  <Route path="/admin/staff" element={<ProtectedRoute requiredPermission="manage_admins"><AdminStaff /></ProtectedRoute>} />
                  <Route path="/admin/newsletter" element={<ProtectedRoute requiredPermission="view_settings"><AdminNewsletter /></ProtectedRoute>} />
                  <Route path="/admin/credit-settings" element={<ProtectedRoute requiredPermission="view_settings"><AdminCreditSettings /></ProtectedRoute>} />
                  <Route path="/admin/daily-reward" element={<ProtectedRoute requiredPermission="view_settings"><AdminDailyReward /></ProtectedRoute>} />
                  <Route path="/admin/referral" element={<ProtectedRoute requiredPermission="view_settings"><AdminReferral /></ProtectedRoute>} />
                  <Route path="/admin/multiplier" element={<ProtectedRoute requiredPermission="view_settings"><AdminMultiplier /></ProtectedRoute>} />
                </Routes>
              </BrowserRouter>
              <Toaster position="top-right" richColors />
            </div>
          </WishlistProvider>
        </CartProvider>
      </CustomerProvider>
    </LanguageProvider>
  );
}

export default App;
