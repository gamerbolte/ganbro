import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronRight, Star, ExternalLink, Search, X, Flame, Sparkles, TrendingUp, Package } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import ReviewCard from '@/components/ReviewCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { productsAPI, categoriesAPI, reviewsAPI, notificationBarAPI, recentPurchasesAPI, bundlesAPI } from '@/lib/api';
import { useLanguage } from '@/components/Language';

export default function HomePage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationBar, setNotificationBar] = useState(null);
  const [notificationBarHeight, setNotificationBarHeight] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [activeSearchQuery, setActiveSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, reviewsRes, notificationRes, bundlesRes] = await Promise.all([
          productsAPI.getAll(null, true),
          categoriesAPI.getAll(),
          reviewsAPI.getAll(),
          notificationBarAPI.get().catch(() => ({ data: null })),
          bundlesAPI.getAll().catch(() => ({ data: [] }))
        ]);
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
        setReviews(reviewsRes.data);
        setNotificationBar(notificationRes.data);
        setBundles(bundlesRes.data || []);

        recentPurchasesAPI.get(10).then(res => setRecentPurchases(res.data || [])).catch(() => {});
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
    setActiveSearchQuery(urlSearch);
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setActiveSearchQuery(query);
    if (query) {
      setSearchParams({ search: query });
    } else {
      setSearchParams({});
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setSearchParams({});
  };

  const filteredProducts = useMemo(() => {
    let result = products;
    if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory);
    }
    if (activeSearchQuery) {
      const query = activeSearchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return result;
  }, [products, selectedCategory, activeSearchQuery]);

  const flashSaleProducts = useMemo(() => {
    return products.filter(p => p.flash_sale_end && new Date(p.flash_sale_end) > new Date());
  }, [products]);

  const newArrivals = useMemo(() => {
    return products.filter(p => p.tags?.includes('new')).slice(0, 8);
  }, [products]);

  const bestSellers = useMemo(() => {
    return products.filter(p => p.tags?.includes('hot') || p.tags?.includes('best-seller')).slice(0, 8);
  }, [products]);

  const duplicatedReviews = useMemo(() => {
    return reviews.length >= 3 ? [...reviews, ...reviews] : reviews;
  }, [reviews]);

  return (
    <div className="min-h-screen bg-black">
      {notificationBar?.is_active && notificationBar?.text && (
        <div
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black py-2 text-center text-sm font-medium fixed top-0 left-0 right-0 z-[60]"
          ref={(el) => {
            if (el) setNotificationBarHeight(el.offsetHeight);
          }}
        >
          {notificationBar.link_url ? (
            <a href={notificationBar.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {notificationBar.text}
            </a>
          ) : notificationBar.text}
        </div>
      )}

      <Navbar notificationBarHeight={notificationBarHeight} />

      <main className="pt-16" style={{ paddingTop: notificationBarHeight + 56 }}>
        {/* Hero Section */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="font-heading text-4xl md:text-6xl font-bold text-white uppercase tracking-tight mb-4">
                <span className="text-amber-500">GameShop</span> Nepal
              </h1>
              <p className="text-white/60 text-lg mb-8">
                Your trusted source for digital products in Nepal since 2021. Gaming, streaming, software & more.
              </p>
              <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchProducts')}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    data-testid="hero-search-input"
                  />
                  {searchQuery && (
                    <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Trustpilot Section */}
        <section className="py-6 border-y border-white/10 bg-zinc-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href="https://www.trustpilot.com/review/gameshopnepal.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 group" data-testid="trustpilot-link">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-green-500 fill-green-500" />
                ))}
              </div>
              <span className="font-heading text-white uppercase tracking-wider text-sm">{t('excellentOnTrustpilot')}</span>
              <span className="text-amber-500 text-sm group-hover:underline flex items-center gap-1">
                {t('checkAllReviews')} <ExternalLink className="h-3 w-3" />
              </span>
            </a>
          </div>
        </section>

        {/* Flash Sale Section */}
        {flashSaleProducts.length > 0 && (
          <section className="py-8 lg:py-12 bg-gradient-to-r from-red-900/20 via-black to-red-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-6">
                <Flame className="h-6 w-6 text-red-500 animate-pulse" />
                <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider">Flash Sale</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {flashSaleProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <section className="py-6 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(null)}
                  className={selectedCategory === null ? 'bg-amber-500 text-black' : 'border-white/20 text-white hover:bg-white/10'}
                  size="sm"
                >
                  All
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={selectedCategory === cat.id ? 'bg-amber-500 text-black' : 'border-white/20 text-white hover:bg-white/10'}
                    size="sm"
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Best Sellers */}
        {bestSellers.length > 0 && !activeSearchQuery && !selectedCategory && (
          <section className="py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                  <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider">{t('bestSellers')}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {bestSellers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* New Arrivals */}
        {newArrivals.length > 0 && !activeSearchQuery && !selectedCategory && (
          <section className="py-8 lg:py-12 bg-zinc-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="h-6 w-6 text-amber-500" />
                <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider">{t('newArrivals')}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {newArrivals.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Products */}
        <section className="py-8 lg:py-12" data-testid="products-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-amber-500" />
                <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider">
                  {activeSearchQuery ? `Results for "${activeSearchQuery}"` : t('allProducts')}
                </h2>
              </div>
              {activeSearchQuery && (
                <Button variant="ghost" onClick={clearSearch} className="text-white/60 hover:text-white">
                  Clear Search
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-square skeleton rounded-xl"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-xl border border-white/10">
                <Package className="h-16 w-16 mx-auto text-white/20 mb-4" />
                <p className="text-white/40 text-lg">{t('noProductsFound')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <section className="py-8 lg:py-12 bg-zinc-900/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider text-center">
                {t('whatOurCustomersSay')}
              </h2>
            </div>
            <div className="reviews-marquee-container">
              <div className="reviews-marquee">
                {duplicatedReviews.map((review, index) => (
                  <div key={`${review.id}-${index}`} className="review-slide">
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recent Purchases */}
        {recentPurchases.length > 0 && (
          <section className="py-6 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-white/40 text-sm">
                <span className="text-green-500">●</span> Recent: {recentPurchases.slice(0, 3).map((p, i) => (
                  <span key={i}>{p.customer_name?.split(' ')[0] || 'Someone'} bought {p.product_name}{i < 2 ? ', ' : ''}</span>
                ))}
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}