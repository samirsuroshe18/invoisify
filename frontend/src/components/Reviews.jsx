import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaStar } from 'react-icons/fa';
import { getMyReview, listReviews, removeMyReview, saveMyReview } from '../api/reviewApi';
import { errorMessage } from '../api/client';
import useToast from '../lib/useToast';

const COMMENT_MAX = 500;

const Stars = ({ rating }) => (
  <span className="inline-flex" role="img" aria-label={`${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <FaStar key={star} className={star <= rating ? 'text-amber-400' : 'text-gray-300'} aria-hidden="true" />
    ))}
  </span>
);

// the form of a logged-in user: one review, which can be changed or removed
const ReviewForm = ({ onChanged }) => {
  const toast = useToast();
  const [existing, setExisting] = useState(undefined);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMyReview()
      .then((review) => {
        if (cancelled) return;
        setExisting(review);
        if (review) {
          setRating(review.rating);
          setComment(review.comment);
        }
      })
      .catch(() => { if (!cancelled) setExisting(false); });

    return () => { cancelled = true; };
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError('');

    if (!comment.trim()) {
      setError('Write a few words about your experience');
      return;
    }

    setBusy(true);
    try {
      const res = await saveMyReview(rating, comment);
      setExisting(res.data.review);
      toast.success(res.message);
      onChanged();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your review?')) return;

    setBusy(true);
    try {
      const res = await removeMyReview();
      setExisting(null);
      setRating(5);
      setComment('');
      toast.success(res.message);
      onChanged();
    } catch (failure) {
      toast.error(failure);
    } finally {
      setBusy(false);
    }
  };

  if (existing === undefined) return null;
  if (existing === false) return <p className="text-sm text-gray-500">Your review could not be loaded. Reload the page to write or change it.</p>;

  return (
    <form onSubmit={save} noValidate className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto text-left space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{existing ? 'Your review' : 'Write a review'}</h3>

      <fieldset>
        <legend className="label">Rating</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} out of 5`} aria-pressed={rating === star} className="p-1">
              <FaStar className={`text-2xl ${star <= rating ? 'text-amber-400' : 'text-gray-300'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-comment" className="label">Your experience</label>
        <textarea id="review-comment" rows="3" maxLength={COMMENT_MAX} className="field" value={comment} onChange={(e) => { setComment(e.target.value); setError(''); }} />
        <p className="text-xs text-gray-500 mt-1">{comment.length} of {COMMENT_MAX} characters. Shown with your name.</p>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : (existing ? 'Update review' : 'Post review')}</button>
        {existing && <button type="button" onClick={remove} disabled={busy} className="btn-danger">Remove</button>}
      </div>
    </form>
  );
};

// what users say about Invoisify, on the landing page
const Reviews = () => {
  const { status, user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listReviews());
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canWrite = status === 'in' && user.isVerified && !user.isDemo;

  return (
    <section className="w-full bg-white" id="reviews">
      <div className="max-w-screen-xl mx-auto px-6 py-16 text-center space-y-8">
        <div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800">What Users Say</h2>
          {data && data.count > 0 && (
            <p className="mt-3 text-gray-600 inline-flex items-center gap-2">
              <Stars rating={Math.round(data.average)} /> {data.average.toFixed(1)} out of 5 from {data.count} {data.count === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>

        {failed && <p className="text-gray-500">The reviews could not be loaded.</p>}
        {data && data.count === 0 && <p className="text-gray-500">No reviews yet. Be the first to write one.</p>}

        {data && data.count > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {data.reviews.map((review, index) => (
              <figure key={index} className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
                <Stars rating={review.rating} />
                <blockquote className="mt-3 text-gray-700 whitespace-pre-line break-words">{review.comment}</blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-gray-800 break-words">{review.name}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {canWrite && <ReviewForm onChanged={load} />}
        {status === 'out' && (
          <p className="text-sm text-gray-600">
            <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to write a review.
          </p>
        )}
        {status === 'in' && user.isDemo && <p className="text-sm text-gray-600">Reviews are written from your own account, not from the demo.</p>}
        {status === 'in' && !user.isDemo && !user.isVerified && <p className="text-sm text-gray-600">Verify your email to write a review.</p>}
      </div>
    </section>
  );
};

export default Reviews;
