import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GENRES, PLATFORMS } from '../constants.js';
import Alert from '../components/Alert.jsx';

const EMPTY = {
  title: '', description: '', genre: 'Action', platforms: [], releaseYear: new Date().getFullYear(),
  developer: '', publisher: '', coverImage: '',
};

function GameForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const isEdit = Boolean(initial._id);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const togglePlatform = (p) => setForm({
    ...form,
    platforms: form.platforms.includes(p) ? form.platforms.filter((x) => x !== p) : [...form.platforms, p],
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.platforms.length) { setError('Choose at least one platform.'); return; }
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      genre: form.genre,
      platforms: form.platforms,
      releaseYear: Number(form.releaseYear),
      developer: form.developer.trim(),
      publisher: form.publisher.trim(),
      coverImage: form.coverImage.trim(),
    };
    try {
      if (isEdit) await api(`/games/${initial._id}`, { method: 'PUT', body });
      else await api('/games', { method: 'POST', body });
      onSaved(isEdit ? `Saved changes to ${body.title}.` : `Added ${body.title}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel game-form" onSubmit={onSubmit}>
      <h3>{isEdit ? `Edit ${initial.title}` : 'Add a game'}</h3>
      <div className="grid-2">
        <div>
          <label htmlFor="g-title">Title</label>
          <input id="g-title" required maxLength={120} value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label htmlFor="g-year">Release year</label>
          <input id="g-year" type="number" min={1970} max={new Date().getFullYear() + 3} required value={form.releaseYear} onChange={set('releaseYear')} />
        </div>
        <div>
          <label htmlFor="g-genre">Genre</label>
          <select id="g-genre" value={form.genre} onChange={set('genre')}>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="g-cover">Cover image URL (https, optional)</label>
          <input id="g-cover" type="url" placeholder="https://…" value={form.coverImage} onChange={set('coverImage')} />
        </div>
        <div>
          <label htmlFor="g-dev">Developer</label>
          <input id="g-dev" maxLength={100} value={form.developer} onChange={set('developer')} />
        </div>
        <div>
          <label htmlFor="g-pub">Publisher</label>
          <input id="g-pub" maxLength={100} value={form.publisher} onChange={set('publisher')} />
        </div>
      </div>
      <label htmlFor="g-desc">Description</label>
      <textarea id="g-desc" rows={3} minLength={10} maxLength={2000} required value={form.description} onChange={set('description')} />
      <fieldset>
        <legend>Platforms</legend>
        {PLATFORMS.map((p) => (
          <label key={p} className="check">
            <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} /> {p}
          </label>
        ))}
      </fieldset>
      <Alert>{error}</Alert>
      <div className="row">
        <button type="submit" className="btn">{isEdit ? 'Save changes' : 'Add game'}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('games');
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null); // null | EMPTY | game
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, u] = await Promise.all([api('/games?limit=50&sort=title'), api('/users')]);
      setGames(g.data);
      setUsers(u.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, message) => {
    setError('');
    setNotice('');
    try { await fn(); setNotice(message); load(); } catch (e) { setError(e.message); }
  };

  const onSaved = (message) => { setEditing(null); setNotice(message); load(); };

  if (!loaded) return <p className="state">Loading dashboard…</p>;

  return (
    <>
      <h1>Admin dashboard</h1>
      <dl className="stats">
        <div><dt>Games</dt><dd>{games.length}</dd></div>
        <div><dt>Users</dt><dd>{users.length}</dd></div>
        <div><dt>Admins</dt><dd>{users.filter((u) => u.role === 'admin').length}</dd></div>
      </dl>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'games'} onClick={() => setTab('games')}>Games</button>
        <button type="button" role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')}>Users</button>
      </div>

      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      {tab === 'games' && (
        <>
          {editing ? (
            <GameForm key={editing._id || 'new'} initial={{ ...EMPTY, ...editing }} onSaved={onSaved} onCancel={() => setEditing(null)} />
          ) : (
            <button type="button" className="btn" onClick={() => setEditing(EMPTY)}>Add a game</button>
          )}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Genre</th><th>Year</th><th>Rating</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g._id}>
                    <td><Link to={`/games/${g._id}`}>{g.title}</Link></td>
                    <td>{g.genre}</td>
                    <td>{g.releaseYear}</td>
                    <td>{g.reviewCount ? `${g.averageRating} (${g.reviewCount})` : '—'}</td>
                    <td className="actions">
                      <button type="button" className="btn ghost small" onClick={() => setEditing(g)}>Edit</button>
                      <button type="button" className="btn danger small" onClick={() => {
                        if (window.confirm(`Delete "${g.title}"?`)) act(() => api(`/games/${g._id}`, { method: 'DELETE' }), `Deleted ${g.title}.`);
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'users' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {users.map((u) => {
                const self = u._id === user.id;
                return (
                  <tr key={u._id}>
                    <td>{u.username}{self && ' (you)'}</td>
                    <td>{u.email}</td>
                    <td>
                      <label className="sr-only" htmlFor={`role-${u._id}`}>Role for {u.username}</label>
                      <select id={`role-${u._id}`} value={u.role} disabled={self}
                        onChange={(e) => act(() => api(`/users/${u._id}/role`, { method: 'PATCH', body: { role: e.target.value } }), `${u.username} is now ${e.target.value === 'admin' ? 'an admin' : 'a user'}.`)}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      {!self && (
                        <button type="button" className="btn danger small" onClick={() => {
                          if (window.confirm(`Delete ${u.username} and their reviews?`)) act(() => api(`/users/${u._id}`, { method: 'DELETE' }), `Deleted ${u.username}.`);
                        }}>Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
