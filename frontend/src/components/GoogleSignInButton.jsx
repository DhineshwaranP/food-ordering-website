import { useEffect, useRef, useState } from 'react';
import { googleLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const scriptId = 'google-identity-services';

export default function GoogleSignInButton({ role = 'user', label = 'Continue with Google', onSuccess }) {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const handleLoad = () => setReady(true);
    const existing = document.getElementById(scriptId);
    if (existing) {
      if (window.google?.accounts?.id) setReady(true);
      else existing.addEventListener('load', handleLoad, { once: true });
      return () => existing.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', handleLoad, { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener('load', handleLoad);
  }, [clientId]);

  useEffect(() => {
    if (!ready || !buttonRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        setBusy(true);
        try {
          const { data } = await googleLogin({ credential, role });
          login(data.user, data.token);
          toast.success(`Welcome, ${data.user.name}!`);
          onSuccess?.(data.user);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google sign in failed');
        } finally {
          setBusy(false);
        }
      },
    });

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: buttonRef.current.offsetWidth || 320,
      text: 'continue_with',
    });
  }, [ready, clientId, role, login, onSuccess, toast]);

  if (!clientId) {
    return (
      <button type="button" className="btn btn-secondary w-full" disabled title="Add VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID to enable Google sign in">
        {label}
      </button>
    );
  }

  return (
    <div className="google-auth-wrap">
      <div ref={buttonRef} />
      {busy && <div className="text-xs text-gray mt-1">Signing in with Google...</div>}
    </div>
  );
}