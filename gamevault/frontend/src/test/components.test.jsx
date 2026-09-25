import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import GameCover from '../components/GameCover.jsx';
import Stars from '../components/Stars.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';

const json = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

const renderAt = (path, ui) => render(
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/" element={<p>Home page</p>} />
        {ui}
      </Routes>
    </AuthProvider>
  </MemoryRouter>,
);

describe('ProtectedRoute', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('redirects anonymous users to the login page', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(401, { message: 'Authentication required' })));
    renderAt('/secret', <Route path="/secret" element={<ProtectedRoute><p>Secret</p></ProtectedRoute>} />);
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret')).not.toBeInTheDocument();
  });

  it('blocks non-admins from admin pages', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(200, { user: { id: '1', username: 'p', role: 'user' } })));
    renderAt('/admin', <Route path="/admin" element={<ProtectedRoute roles={['admin']}><p>Dashboard</p></ProtectedRoute>} />);
    expect(await screen.findByText('Admins only')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('shows the page to admins', async () => {
    vi.stubGlobal('fetch', vi.fn(() => json(200, { user: { id: '1', username: 'a', role: 'admin' } })));
    renderAt('/admin', <Route path="/admin" element={<ProtectedRoute roles={['admin']}><p>Dashboard</p></ProtectedRoute>} />);
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => json(401, {}))));
  afterEach(() => vi.unstubAllGlobals());

  it('shows validation messages and does not call the API for a weak password', async () => {
    renderAt('/register', <Route path="/register" element={<RegisterPage />} />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'player_1' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'p@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText(/Password needs/)).toBeInTheDocument();
    // Only the initial /auth/me session check was made
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('Display components', () => {
  it('renders a generated cover with the title', () => {
    render(<GameCover game={{ title: 'Hades', genre: 'Action' }} />);
    expect(screen.getByRole('img', { name: 'Hades cover' })).toHaveTextContent('Hades');
  });

  it('renders user text as text, not HTML', () => {
    render(<GameCover game={{ title: '<img src=x onerror=alert(1)>', genre: 'Action' }} />);
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('labels star ratings for screen readers', () => {
    render(<Stars value={4} count={3} />);
    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
  });
});
