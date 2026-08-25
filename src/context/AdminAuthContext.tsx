import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { checkAdminAccess } from '../firebase/firestore';

interface AdminAuthContextType {
  /** Firestore granted this session admin access — not a client-side password guess. */
  isAuthenticated: boolean;
  checking: boolean;
  /** Diagnostic string from the access probe, shown on the login card when it fails. */
  detail: string;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [checked, setChecked] = useState<{ uid: string; isAdmin: boolean; detail: string } | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    checkAdminAccess().then((result) => {
      if (!cancelled) setChecked({ uid: user.uid, isAdmin: result.status === 'ok', detail: result.detail });
    });
    return () => { cancelled = true; };
  }, [user, loading]);

  // Derived rather than stored, so a sign-out or account switch can't leave a stale yes.
  const current = user && checked?.uid === user.uid ? checked : null;

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: Boolean(current?.isAdmin),
        checking: loading || (Boolean(user) && current === null),
        detail: current?.detail ?? '',
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
