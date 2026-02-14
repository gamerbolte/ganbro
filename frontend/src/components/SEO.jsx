import { useEffect } from 'react';

/**
 * SEO Component - Updates document head with meta tags
 * Usage: <SEO title="Page Title" description="..." image="..." />
 */
export default function SEO({ 
  title = 'GameShop Nepal - Digital Products at Best Prices',
  description = 'Buy Netflix, Spotify, YouTube Premium, PUBG UC and more at the best prices in Nepal. Instant delivery, 100% genuine products.',
  keywords = 'digital products Nepal, Netflix Nepal, Spotify Nepal, gaming topup Nepal',
  image = 'https://customer-assets.emergentagent.com/job_8ec93a6a-4f80-4dde-b760-4bc71482fa44/artifacts/4uqt5osn_Staff.zip%20-%201.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  schema = null
}) {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', 'GameShop Nepal', 'property');
    
    // Twitter
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);

    // Schema.org JSON-LD
    if (schema) {
      let schemaScript = document.querySelector('script[data-schema="page"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.setAttribute('data-schema', 'page');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    }

    // Cleanup
    return () => {
      const schemaScript = document.querySelector('script[data-schema="page"]');
      if (schemaScript) {
        schemaScript.remove();
      }
    };
  }, [title, description, keywords, image, url, type, schema]);

  return null;
}

function updateMetaTag(name, content, attribute = 'name') {
  let tag = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

// Pre-built SEO configs for common pages
export const SEOConfigs = {
  home: {
    title: 'GameShop Nepal - Digital Products at Best Prices in Nepal',
    description: 'Buy Netflix, Spotify, YouTube Premium, PUBG UC, Free Fire diamonds and more digital products at the best prices in Nepal. Instant delivery guaranteed!',
    keywords: 'digital products Nepal, Netflix Nepal price, Spotify Nepal, PUBG UC Nepal, gaming topup, streaming subscription Nepal',
  },
  about: {
    title: 'About Us | GameShop Nepal',
    description: 'Learn about GameShop Nepal - Your trusted source for digital products since 2021. 100% genuine products with instant delivery.',
    keywords: 'GameShop Nepal about, digital products store Nepal, trusted online store Nepal',
  },
  faq: {
    title: 'FAQ - Frequently Asked Questions | GameShop Nepal',
    description: 'Find answers to common questions about ordering, payment, and delivery at GameShop Nepal.',
    keywords: 'GameShop Nepal FAQ, how to order digital products, payment methods Nepal',
  },
  blog: {
    title: 'Blog & Guides | GameShop Nepal',
    description: 'Gaming tips, streaming guides, and digital product tutorials from GameShop Nepal.',
    keywords: 'gaming guides Nepal, Netflix tips, streaming guide, digital products blog',
  },
  terms: {
    title: 'Terms of Service | GameShop Nepal',
    description: 'Terms and conditions for using GameShop Nepal services.',
    keywords: 'GameShop Nepal terms, terms of service, legal',
  },
  track: {
    title: 'Track Your Order | GameShop Nepal',
    description: 'Track your order status in real-time. Enter your order ID to see the latest updates.',
    keywords: 'track order Nepal, order status, delivery tracking',
  },
};

// Product SEO helper
export function getProductSEO(product) {
  if (!product) return SEOConfigs.home;
  
  const minPrice = product.variations?.length 
    ? Math.min(...product.variations.map(v => v.price))
    : 0;
  
  const cleanDescription = product.description
    ?.replace(/<[^>]*>/g, '')
    ?.slice(0, 160) || '';

  return {
    title: `${product.name} - Buy Online | GameShop Nepal`,
    description: `Buy ${product.name} at the best price in Nepal. Starting from Rs ${minPrice}. ${cleanDescription}`,
    keywords: `${product.name}, buy ${product.name} Nepal, ${product.name} price, digital products Nepal`,
    image: product.image_url,
    type: 'product',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: cleanDescription,
      image: product.image_url,
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: minPrice,
        priceCurrency: 'NPR',
        availability: product.is_sold_out 
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      },
    },
  };
}

// Blog post SEO helper
export function getBlogSEO(post) {
  if (!post) return SEOConfigs.blog;

  return {
    title: `${post.title} | GameShop Nepal Blog`,
    description: post.excerpt || post.content?.replace(/<[^>]*>/g, '').slice(0, 160),
    image: post.image_url,
    type: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      image: post.image_url,
      datePublished: post.created_at,
      author: {
        '@type': 'Organization',
        name: 'GameShop Nepal',
      },
    },
  };
}
