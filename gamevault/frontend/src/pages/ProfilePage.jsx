import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Stars from '../components/Stars.jsx';
import Alert from '../components/Alert.jsx';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/me'), api('/me/reviews')])
      .then(([p, r]) => { setProfile(p); setReviews(r.data); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <p className="state">Loading profile…</p>;

  const { user, stats } = profile;
  return (
    <>
      <section className="profile-head">
        <div className="avatar" aria-hidden="true">{user.username.slice(0, 2).toUpperCase()}</div>
        <div>
          <h1>{user.username}</h1>
          <p className="meta">{user.email}, member since {new Date(user.createdAt).toLocaleDateString()}</p>
          {user.role === 'admin' && <span className="badge">Administrator</span>}
        </div>
      </section>

      <dl className="stats">
        <div><dt>Games owned</dt><dd><Link to="/collection">{stats.collection}</Link></dd></div>
        <div><dt>On wishlist</dt><dd><Link to="/wishlist">{stats.wishlist}</Link></dd></div>
        <div><dt>Reviews written</dt><dd>{stats.reviews}</dd></div>
      </dl>

      <h2>My reviews</h2>
      {reviews.length === 0 && <p className="muted">You haven&apos;t reviewed any games yet.</p>}
      <ul className="review-list">
        {reviews.map((r) => (
          <li key={r._id} className="review">
            <div className="review-head">
              <Link to={`/games/${r.game._id}`}><strong>{r.game.title}</strong></Link>
              <Stars value={r.rating} />
            </div>
            {r.comment && <p>{r.comment}</p>}
          </li>
        ))}
      </ul>
    </>
  );
}
