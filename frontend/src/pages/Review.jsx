import React, {useState} from 'react';
import Navbar from '../components/Navbar';
import { FaUser, FaCommentDots, FaStar } from 'react-icons/fa';

import { motion } from 'framer-motion';
import axios from 'axios';

const Reviews = () => {

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    const { name, rating, comment } = event.target.elements;
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/review/create-review`, {
        name: name.value,
        rating,
        comment: comment.value,
      });
      alert('Review submitted successfully');
    } catch (error) {
      console.error('There was an error submitting the review!', error);
    }
  };

  return (
    <>
      <Navbar activePage="Reviews" />
      <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-purple-100 py-12">

        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            className="text-4xl font-bold text-center text-gray-800 my-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Leave a Review
          </motion.h2>
          <motion.form
            onSubmit={handleReviewSubmit}
            className="bg-white shadow-lg rounded-lg p-8 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* Name Input */}
            <div className="flex items-center gap-3">
              <FaUser className="text-blue-600 text-xl" />
              <label htmlFor="name" className="text-gray-700 font-semibold">
                Name:
              </label>
            </div>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex items-center gap-3">
            <FaStar className="text-blue-600 text-xl" />
              <label htmlFor="rating" className="text-gray-700 font-semibold">
                Rating:
              </label>
            </div>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <FaStar
                  key={value}
                  size={30}
                  name="rating" // Added name attribute
                  id={`rating`}
                  className={`cursor-pointer ${(hover || rating) >= value ? "text-yellow-500" : "text-gray-400"
                    }`}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-700">Selected Rating: {rating}</p>

            {/* Comment Input */}
            <div className="flex items-center gap-3">
              <FaCommentDots className="text-blue-600 text-xl" />
              <label htmlFor="comment" className="text-gray-700 font-semibold">
                Comment:
              </label>
            </div>
            <textarea
              id="comment"
              name="comment"
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            ></textarea>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
            >
              Submit Review
            </button>
          </motion.form>
        </div>
      </div>
    </>
  );
};

export default Reviews;
