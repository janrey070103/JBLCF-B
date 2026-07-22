// Form-facing auth controller — bridges the Login view to useAuth's
// loginWithCredentials. Owns the form-level state the view needs:
//   - field values (email, password)
//   - submission lifecycle (submitting)
//   - validation / auth errors (specific messages, never generic)
//
// This is the "C" in MVC for the auth flow — the view stays pure presentation.
import { useCallback, useState } from 'react';
import { useAuth } from './authHooks.js';

export function useAuthController() {
  const { loginWithCredentials } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Form-level error shown in the alert banner above the form.
  const [formError, setFormError] = useState(null);
  // Per-field validation errors for inline hints.
  const [fieldErrors, setFieldErrors] = useState({ email: null, password: null });

  const validate = useCallback((next) => {
    const errs = { email: null, password: null };
    const e = (next?.email ?? email).trim();
    const p = next?.password ?? password;
    if (!e) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
      errs.email = 'Enter a valid email address.';
    if (!p) errs.password = 'Password is required.';
    setFieldErrors(errs);
    return errs;
  }, [email, password]);

  const submit = useCallback(
    async (onSuccess) => {
      setFormError(null);
      const errs = validate();
      if (errs.email || errs.password) return { ok: false };

      setSubmitting(true);
      const res = await loginWithCredentials(email.trim(), password);
      setSubmitting(false);

      if (!res.ok) {
        setFormError(res.error);
        return { ok: false };
      }
      onSuccess?.(res.user);
      return { ok: true, user: res.user };
    },
    [email, password, loginWithCredentials, validate],
  );

  const reset = useCallback(() => {
    setEmail('');
    setPassword('');
    setFormError(null);
    setFieldErrors({ email: null, password: null });
    setSubmitting(false);
  }, []);

  return {
    email,
    password,
    submitting,
    formError,
    fieldErrors,
    setEmail,
    setPassword,
    submit,
    validate,
    reset,
  };
}
