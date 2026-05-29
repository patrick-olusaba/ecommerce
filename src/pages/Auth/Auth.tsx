import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import './Auth.css';

export default function Auth() {
  const { user, loading, signup, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  useDocumentTitle(mode === 'signup' ? 'Create Account' : 'Sign In');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setSubmitting(false);
          return;
        }
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate('/');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found'
        ? 'Invalid email or password.'
        : err?.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : err?.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : err?.code === 'auth/operation-not-allowed'
        ? 'Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method and enable it.'
        : err?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result) {
        navigate('/');
      }
      // If result is null, user closed the popup — stay on page, no error
    } catch (err: any) {
      const msg = err?.code === 'auth/popup-blocked'
        ? 'Pop-up was blocked. Please allow pop-ups for this site.'
        : err?.code === 'auth/unauthorized-domain'
        ? 'This domain is not authorized for Google sign-in. Check Firebase console.'
        : err?.code === 'auth/operation-not-allowed'
        ? 'Google sign-in is not enabled in Firebase. Go to Authentication → Sign-in method and enable Google.'
        : err?.code === 'auth/account-exists-with-different-credential'
        ? 'An account already exists with this email using a different sign-in method.'
        : err?.message || 'Google sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-page__card" style={{ textAlign: 'center', padding: '64px' }}>
          <div className="auth-page__spinner" />
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="auth-page">
      <div className="auth-page__card">
        <div className="auth-page__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>

        {/* Tabs */}
        <div className="auth-page__tabs">
          <button
            className={`auth-page__tab ${mode === 'login' ? 'auth-page__tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-page__tab ${mode === 'signup' ? 'auth-page__tab--active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {error && <div className="auth-page__error">{error}</div>}

        <form className="auth-page__form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-page__field">
              <label className="auth-page__label">Full Name</label>
              <input
                type="text"
                className="auth-page__input"
                placeholder="Jane Wanjiku"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-page__field">
            <label className="auth-page__label">Email</label>
            <input
              type="email"
              className="auth-page__input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-page__field">
            <label className="auth-page__label">Password</label>
            <input
              type="password"
              className="auth-page__input"
              placeholder="········"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button type="submit" className="auth-page__btn" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-page__divider">
          <span>or</span>
        </div>

        <button className="auth-page__google-btn" onClick={handleGoogle} type="button" disabled={googleSubmitting}>
          {googleSubmitting ? (
            'Connecting to Google...'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="auth-page__footer-text">
          {mode === 'login' ? (
            <>Don't have an account? <button onClick={() => { setMode('signup'); setError(''); }}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
