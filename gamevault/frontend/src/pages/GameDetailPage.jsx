import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { STATUSES } from '../constants.js';
import GameCover from '../components/GameCover.jsx';
import Stars from '../components/Stars.jsx';
import Alert from '../components/Alert.jsx';

export default function GameDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [owned, setOwned] = useState(null); // collection item or null
  const [wished, setWished] = useState(false);
  const [status, setStatus] = useState('backlog');
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [g, r] = await Promise.all([api(`/games/${id}`), api(`/games/${id}/reviews`)]);
      setGame(g.data);
      setReviews(r.data);
      if (user) {
        const me = await api('/me');
        setOwned(me.library.find((i) => i.game === id) || null);
        setWished(me.wishlist.includes(id));
      }
    } catch (e) {
      setError(e.status === 404 || e.status === 400 ? 'This game does not exist.' : e.message);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const run = async (action, message) => {
    setError('');
    setNotice('');
    try {
      await action();
      setNotice(message);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const myReview = user && reviews.find((r) => r.user?._id === user.id);

  const submitReview = (e) => {
    e.preventDefault();
    const body = { rating: Number(form.rating), comment: form.comment.trim() };
    if (myReview) {
      run(() => api(`/reviews/${myReview._id}`, { method: 'PUT', body }), 'Review updated.');
    } else {
      run(() => api(`/games/${id}/reviews`, { method: 'POST', body }), 'Review posted.');
    }
    setEditing(false);
  };

  const startEdit = () => {
    setForm({ rating: myReview.rating, comment: myReview.comment });
    setEditing(true);
  };

  const deleteGame = async () => {
    if (!window.confirm(`Delete "${game.title}" and all of its reviews?`)) return;
    try {
      await api(`/games/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  };

  if (error && !game) {
    return <div className="state"><p>{error}</p><Link to="/" className="btn ghost">Back to games</Link></div>;
  }
  if (!game) return <p className="state">Loading…</p>;

  return (
    <>
      <section className="detail">
        <GameCover game={game} size="lg" />
        <div className="detail-body">
          <h1>{game.title}</h1>
          <p className="meta">
            {game.genre}, {game.releaseYear}
            {game.developer && <> — developed by {game.developer}</>}
            {game.publisher && game.publisher !== game.developer && <>, published by {game.publisher}</>}
          </p>
          <Stars value={game.averageRating} count={game.reviewCount} />
          <p className="description">{game.description}</p>
          <ul className="platforms" aria-label="Platforms">
            {game.platforms.map((p) => <li key={p}>{p}</li>)}
          </ul>

          <Alert>{error}</Alert>
          <Alert type="success">{notice}</Alert>

          {user ? (
            <div className="detail-actions">
              {owned ? (
                <p className="owned">
                  In your collection as <strong>{STATUSES.find((s) => s.value === owned.status)?.label}</strong>.{' '}
                  <Link to="/collection">Manage collection</Link>
                </p>
              ) : (
                <>
                  <label className="sr-only" htmlFor="status">Status</label>
                  <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button type="button" className="btn" onClick={() => run(() => api('/me/collection', { method: 'POST', body: { gameId: id, status } }), 'Added to your collection.')}>
                    Add to collection
                  </button>
                  {wished ? (
                    <button type="button" className="btn ghost" onClick={() => run(() => api(`/me/wishlist/${id}`, { method: 'DELETE' }), 'Removed from your wishlist.')}>
                      Remove from wishlist
                    </button>
                  ) : (
                    <button type="button" className="btn ghost" onClick={() => run(() => api(`/me/wishlist/${id}`, { method: 'POST' }), 'Added to your wishlist.')}>
                      Add to wishlist
                    </button>
                  )}
                </>
              )}
              {user.role === 'admin' && (
                <button type="button" className="btn danger" onClick={deleteGame}>Delete game</button>
              )}
            </div>
          ) : (
            <p className="muted"><Link to="/login">Log in</Link> to add this game to your collection or write a review.</p>
          )}
        </div>
      </section>

      <section className="reviews">
        <h2>Player reviews</h2>

        {user && (!myReview || editing) && (
          <form className="review-form" onSubmit={submitReview}>
            <h3>{myReview ? 'Edit your review' : 'Write a review'}</h3>
            <label htmlFor="rating">Rating</label>
            <select id="rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
            </select>
            <label htmlFor="comment">Comment (optional)</label>
            <textarea
              id="comment"
              rows={4}
              maxLength={1000}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
            <span className="hint">{form.comment.length}/1000</span>
            <div className="row">
              <button type="submit" className="btn">{myReview ? 'Save review' : 'Post review'}</button>
              {editing && <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </form>
        )}

        {reviews.length === 0 && <p className="muted">No reviews yet. Be the first to share what you think.</p>}

        <ul className="review-list">
          {reviews.map((r) => {
            const mine = user && r.user?._id === user.id;
            return (
              <li key={r._id} className={mine ? 'review mine' : 'review'}>
                <div className="review-head">
                  <strong>{r.user?.username || 'Deleted user'}</strong>
                  <Stars value={r.rating} />
                  <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleDateString()}</time>
                </div>
                {/* React escapes this text automatically, so user comments can't inject HTML/scripts */}
                {r.comment && <p>{r.comment}</p>}
                {(mine || user?.role === 'admin') && (
                  <div className="row">
                    {mine && !editing && <button type="button" className="btn ghost small" onClick={startEdit}>Edit</button>}
                    <button type="button" className="btn ghost small" onClick={() => run(() => api(`/reviews/${r._id}`, { method: 'DELETE' }), 'Review deleted.')}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
