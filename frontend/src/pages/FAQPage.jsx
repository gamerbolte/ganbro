import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { faqsAPI } from '@/lib/api';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    faqsAPI.getAll()
      .then(res => setFaqs(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-heading text-4xl font-bold text-white uppercase tracking-tight mb-8 text-center">
            Frequently Asked <span className="text-gold-500">Questions</span>
          </h1>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton rounded-lg"></div>)}
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-16 bg-card border border-white/10 rounded-lg">
              <p className="text-white/40">No FAQs available yet.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.id} value={faq.id} className="bg-card border border-white/10 rounded-lg px-4">
                  <AccordionTrigger className="text-white hover:text-gold-500 text-left py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}