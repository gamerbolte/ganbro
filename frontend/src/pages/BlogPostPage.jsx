import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { blogAPI } from '@/lib/api';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    blogAPI.getOne(slug)
      .then(res => setPost(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center text-white/60 hover:text-gold-500 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-12 w-3/4 skeleton rounded"></div>
              <div className="h-64 skeleton rounded-lg"></div>
            </div>
          ) : !post ? (
            <div className="text-center py-16">
              <p className="text-white/40">Post not found</p>
            </div>
          ) : (
            <article>
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover rounded-xl mb-6" />
              )}
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">{post.title}</h1>
              <div className="text-white/40 text-sm mb-8">
                {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="rich-text-content text-white/80 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}