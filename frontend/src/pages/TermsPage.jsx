import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { pagesAPI } from '@/lib/api';

export default function TermsPage() {
  const [pageData, setPageData] = useState({ title: 'Terms & Conditions', content: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    pagesAPI.get('terms').then(res => setPageData(res.data)).catch(() => {}).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {isLoading ? (
            <div className="space-y-6"><div className="h-12 w-1/2 skeleton rounded"></div><div className="h-96 skeleton rounded"></div></div>
          ) : (
            <>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-white uppercase tracking-tight mb-8">{pageData.title}</h1>
              <div className="rich-text-content text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: pageData.content || `
                <h2>Terms of Service</h2>
                <p>By using GameShop Nepal, you agree to the following terms:</p>
                <ul>
                  <li><strong>Digital Products:</strong> All products sold are digital and non-refundable once delivered.</li>
                  <li><strong>Delivery:</strong> Products are delivered instantly or within 24 hours depending on the product type.</li>
                  <li><strong>Account Responsibility:</strong> You are responsible for providing correct account details for product delivery.</li>
                  <li><strong>Payment:</strong> All payments must be completed before product delivery.</li>
                  <li><strong>Support:</strong> Contact us within 24 hours if you face any issues with your purchase.</li>
                </ul>
                <h2>Refund Policy</h2>
                <p>Digital products are non-refundable. However, we may offer store credits in case of delivery issues not caused by customer error.</p>
                <h2>Privacy</h2>
                <p>We collect minimal information necessary to process your orders and do not share your data with third parties.</p>
              ` }} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}