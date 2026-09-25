import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { GENRES, SORTS } from '../constants.js';
import GameCard from '../components/GameCard.jsx';
import Alert from '../components/Alert.jsx';

export default function GamesPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const genre = params.get('genre') || '';
  const sort = params.get('sort') || 'title';
  const page = Number(params.get('page')) || 1;

  const [search, setSearch] = useState(q);
  const [result, setResult] = useState({ data: [], pagination: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = new URLSearchParams({ page: String(page), limit: '12', sort });
    if (q) qs.set('q', q);
    if (genre) qs.set('genre', genre);
    let active = true;
    api(`/games?${qs}`)
      .then((d) => { if (active) { setResult(d); setError(''); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [q, genre, sort, page]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const { data: games, pagination } = result;

  return (
    <>
      <section className="hero">
        <h1>Find your next game</h1>
        <p>Browse the catalogue, read what other players think, and keep track of what you own and want.</p>
        <form
          className="filters"
          role="search"
          onSubmit={(e) => { e.preventDefault(); update({ q: search.trim() }); }}
        >
          <label className="sr-only" htmlFor="search">Search by title</label>
          <input
            id="search"
            type="search"
            placeholder="Search by title"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="sr-only" htmlFor="genre">Genre</label>
          <select id="genre" value={genre} onChange={(e) => update({ genre: e.target.value })}>
            <option value="">All genres</option>
            {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="submit" className="btn">Search</button>
        </form>
      </section>

      <Alert>{error}</Alert>
      {loading && <p className="state">Loading games…</p>}
      {!loading && !error && games.length === 0 && (
        <div className="state">
          <p>No games match those filters.</p>
          <button type="button" className="btn ghost" onClick={() => { setSearch(''); setParams({}); }}>Clear filters</button>
        </div>
      )}

      <div className="shelf">
        {games.map((g) => <GameCard key={g._id} game={g} />)}
      </div>

      {pagination && pagination.pages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button type="button" className="btn ghost small" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</button>
          <span>Page {page} of {pagination.pages}</span>
          <button type="button" className="btn ghost small" disabled={page >= pagination.pages} onClick={() => update({ page: String(page + 1) })}>Next</button>
        </nav>
      )}
    </>
  );
}
