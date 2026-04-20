import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';
import { Link } from 'react-router-dom';

interface Review {
  id: number;
  merchant_id: number;
  rating: number;
  content: string | null;
  created_at: string;
  merchant: {
    shop_name: string;
    cover_image: string | null;
  };
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          merchant_id,
          rating,
          content,
          created_at,
          merchant:merchants(shop_name, cover_image)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`fas fa-star text-xs ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-800">我的评价</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-comment-alt text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">暂无评价</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <Link
                  to={`/merchants/${review.merchant_id}`}
                  className="flex items-center space-x-3 mb-3"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                    {review.merchant?.cover_image ? (
                      <img
                        src={review.merchant.cover_image}
                        alt={review.merchant.shop_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-store text-gray-400"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {review.merchant?.shop_name || '商家'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>

                <div className="mb-2">{renderStars(review.rating)}</div>

                {review.content && (
                  <p className="text-gray-600 text-sm">{review.content}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
