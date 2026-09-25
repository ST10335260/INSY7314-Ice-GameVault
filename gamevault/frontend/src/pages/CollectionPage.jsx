import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { STATUSES } from '../constants.js';
import GameCover from '../components/GameCover.jsx';
import Alert from '../components/Alert.jsx';

export default function CollectionPage() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/me/collection').then((d) => setItems(d.data)).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => {
    setError('');
    try { await fn(); load(); } catch (e) { setError(e.message); }
  };

  if (!items) return <p className="state">Loading your collection…</p>;

  const counts = Object.fromEntries(STATUSES.map((s) => [s.value, items.filter((i) => i.status === s.value).length]));
  const shown = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <>
      <h1>My collection</h1>
      <div className="tabs" role="tablist" aria-label="Filter by status">
        <button type="button" role="tab" aria-selected={filter === 'all'} onClick={() => setFilter('all')}>All ({items.length})</button>
        {STATUSES.map((s) => (
          <button key={s.value} type="button" role="tab" aria-selected={filter === s.value} onClick={() => setFilter(s.value)}>
            {s.label} ({counts[s.value]})
          </button>
        ))}
      </div>
      <Alert>{error}</Alert>

      {items.length === 0 && (
        <div className="state">
          <p>Your collection is empty. Add games you own from their game page.</p>
          <Link to="/" className="btn">Browse games</Link>
        </div>
      )}

      <ul className="list">
        {shown.map(({ game, status }) => (
          <li key={game._id} className="list-row">
            <GameCover game={game} size="sm" />
            <div className="list-main">
              <Link to={`/games/${game._id}`}><strong>{game.title}</strong></Link>
              <span className="meta">{game.genre}, {game.releaseYear}</span>
            </div>
            <label className="sr-only" htmlFor={`status-${game._id}`}>Status for {game.title}</label>
            <select id={`status-${game._id}`} value={status}
              onChange={(e) => act(() => api(`/me/collection/${game._id}`, { method: 'PATCH', body: { status: e.target.value } }))}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button type="button" className="btn ghost small" onClick={() => act(() => api(`/me/collection/${game._id}`, { method: 'DELETE' }))}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
