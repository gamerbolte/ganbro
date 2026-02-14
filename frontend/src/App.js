import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/Language";
import { CustomerProvider } from "@/components/CustomerAccount";
import { CartProvider } from "@/components/Cart";
import { WishlistProvider } from "@/components/Wishlist";

// Pages
import HomePage from "@/pages/HomePage";
import ProductPage from "@/pages/ProductPage";
import AboutPage from "@/pages/AboutPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import FAQPage from "@/pages/FAQPage";
import TermsPage from "@/pages/TermsPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import InvoicePage from "@/pages/InvoicePage";

function App() {
  return (
    <LanguageProvider>
      <CustomerProvider>
        <CartProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: "#18181b",
                    border: "1px solid #27272a",
                    color: "#fff",
                  },
                }}
              />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/product/:productSlug" element={<ProductPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/:orderId" element={<PaymentPage />} />
                <Route path="/invoice/:orderId" element={<InvoicePage />} />
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </CartProvider>
      </CustomerProvider>
    </LanguageProvider>
  );
}

export default App;
