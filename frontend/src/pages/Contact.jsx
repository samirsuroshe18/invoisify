import React from 'react'
import Navbar from '../components/Navbar'
import { useState } from 'react'
import axios from 'axios'

const Contact = () => {
  const handleSubmit = async (event) => {
    event.preventDefault()
    const { name, email, message } = event.target.elements
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/review/create-review`, {
        name: name.value,
        email: email.value,
        message: message.value,
      })
      alert('Message sent successfully')
    } catch (error) {
      console.error('There was an error sending the message!', error)
    }
  }

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    const {name, rating, comment } = event.target.elements
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/review/create-review`, {
        name: name.value,
        rating: rating.value,
        comment: comment.value,
      })
      alert('Review submitted successfully')
    } catch (error) {
      console.error('There was an error submitting the review!', error)
    }
  }

  return (
    <div>
      <Navbar />
      <h1>Contact Us</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="message">Message:</label>
          <textarea id="message" name="message" required></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
      <h2>Leave a Review</h2>
      <form onSubmit={handleReviewSubmit}>

        <div>
          <label htmlFor="productId">name</label>
          <input type="text" id="name" name="productId" required />
        </div>
        <div>
          <label htmlFor="rating">Rating:</label>
          <input type="number" id="rating" name="rating" min="1" max="5" required />
        </div>
        <div>
          <label htmlFor="comment">Comment:</label>
          <textarea id="comment" name="comment" required></textarea>
        </div>
        <button type="submit" onSubmit={handleReviewSubmit}>Submit Review</button>
      </form>
    </div>
  )
}

export default Contact