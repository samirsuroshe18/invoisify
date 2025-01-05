import React, { useState, useEffect, memo } from 'react';
import { User, MessageCircle, Star } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const CustomAlert = memo(({ message, isVisible, onHide }) => {
  if (!isVisible) return null;

  React.useEffect(() => {
    const timer = setTimeout(onHide, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, onHide]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md bg-white border border-green-500 text-green-700 px-4 py-3 rounded shadow-lg">
      {message}
    </div>
  );
});

const ReviewsList = memo(({ reviews }) => (
  <div className="bg-white shadow-lg rounded-lg p-6 space-y-4 transition-all duration-300 ease-in-out">
    <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Reviews</h3>
    <div className="space-y-6 max-h-[600px] overflow-y-auto">
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-center">No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((review, index) => (
          <div
            key={index}
            className="border-b pb-4 last:border-b-0 transition-all duration-300 ease-in-out"
            style={{
              animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="text-blue-600 w-4 h-4" />
                <span className="font-semibold text-gray-800">{review.name}</span>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))
      )}
    </div>
  </div>
));

const Reviews = () => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [alert, setAlert] = useState({ show: false, message: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/review/get-reviews`);
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const { name, comment } = event.target.elements;
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/review/create-review`, {
        name: name.value,
        rating,
        comment: comment.value,
      },
      );
      
      if (response.ok) {
        setAlert({ show: true, message: 'Review submitted successfully' });
        fetchReviews();
        event.target.reset();
        setRating(0);
      }
    } catch (error) {
      console.error('There was an error submitting the review!', error);
      setAlert({ show: true, message: 'Error submitting review' });
    }
  };

  return (
    <>
    <Navbar activePage="Reviews" />
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-purple-100 py-12">
      
      <CustomAlert 
        message={alert.message}
        isVisible={alert.show}
        onHide={() => setAlert({ show: false, message: '' })}
      />
      
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-12 transition-all duration-300 ease-in-out">
          Customer Reviews
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ReviewsList reviews={reviews} />

          <form
            onSubmit={handleReviewSubmit}
            className="bg-white shadow-lg rounded-lg p-8 space-y-6 transition-all duration-300 ease-in-out"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Leave a Review</h3>
            
            <div className="flex items-center gap-3">
              <User className="text-blue-600 w-5 h-5" />
              <label htmlFor="name" className="text-gray-700 font-semibold">
                Name:
              </label>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white focus:ring-blue-600"
            />

            <div className="flex items-center gap-3">
              <Star className="text-blue-600 w-5 h-5" />
              <label htmlFor="rating" className="text-gray-700 font-semibold">
                Rating:
              </label>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  size={30}
                  className={`cursor-pointer transition-colors duration-200 ${
                    (hover || rating) >= value 
                      ? "text-yellow-500 fill-current" 
                      : "text-gray-400"
                  }`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-700">Selected Rating: {rating}</p>

            <div className="flex items-center gap-3">
              <MessageCircle className="text-blue-600 w-5 h-5" />
              <label htmlFor="comment" className="text-gray-700 font-semibold">
                Comment:
              </label>
            </div>
            <textarea
              id="comment"
              name="comment"
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white focus:ring-blue-600"
            ></textarea>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
            >
              Submit Review
            </button>
          </form>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
    </>
    
  );
};

export default Reviews;