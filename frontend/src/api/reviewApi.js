import api, { unwrap } from './client.js';

// { reviews: [{ name, rating, comment, date }], count, average }
export const listReviews = async () => unwrap(await api.get('/reviews')).data;

// the logged-in user's own review: { rating, comment } or null
export const getMyReview = async () => unwrap(await api.get('/reviews/mine')).data.review;
export const saveMyReview = async (rating, comment) => unwrap(await api.put('/reviews/mine', { rating, comment }));
export const removeMyReview = async () => unwrap(await api.delete('/reviews/mine'));
