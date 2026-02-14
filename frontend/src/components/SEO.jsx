import { useEffect } from 'react';

export default function SEO({ title, description, image, type = 'website' }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    
    const setMeta = (name, content) => {
      if (!content) return;
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:')) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:image', image);
    setMeta('og:type', type);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
  }, [title, description, image, type]);

  return null;
}