import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import GameCard from '../components/GameCard.jsx';
import Alert from '../components/Alert.jsx';

export default function WishlistPage() {
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    api('/me/wishlist').then((d) => setGames(d.data)).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, message) => {
    setError('');
    setNotice('');
    try { await fn(); setNotice(message); load(); } catch (e) { setError(e.message); }
  };

  if (!games) return <p className="state">Loading your wishlist…</p>;

  return (
    <>
      <h1>My wishlist</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>
      {games.length === 0 && (
        <div className="state">
          <p>Nothing on your wishlist yet. Save games you want to play later from their game page.</p>
          <Link to="/" className="btn">Browse games</Link>
        </div>
      )}
      <div className="shelf">
        {games.map((g) => (
          <GameCard key={g._id} game={g}>
            <button type="button" className="btn small"
              onClick={() => act(() => api('/me/collection', { method: 'POST', body: { gameId: g._id } }), `${g.title} moved to your collection.`)}>
              I own this
            </button>
            <button type="button" className="btn ghost small"
              onClick={() => act(() => api(`/me/wishlist/${g._id}`, { method: 'DELETE' }), `${g.title} removed.`)}>
              Remove
            </button>
          </GameCard>
        ))}
      </div>
    </>
  );
}
