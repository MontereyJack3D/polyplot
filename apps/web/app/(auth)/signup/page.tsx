'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

export default function SignupPage() {
  const router = useRouter();

  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [handleError, setHandleError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setHandleError(null);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    const normalizedHandle = handle.trim().toLowerCase();
    const trimmedEmail = email.trim();

    let hasError = false;

    if (!HANDLE_PATTERN.test(normalizedHandle)) {
      setHandleError('Handle must be 3-20 chars, lowercase letters, numbers, or underscores.');
      hasError = true;
    }

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasError = true;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      const authUser = data.user;

      if (!authUser) {
        setFormError('Signup succeeded, but no user was returned.');
        return;
      }

      const { error: userInsertError } = await supabase.from('users').insert({
        user_id: authUser.id,
        handle: normalizedHandle,
      });

      if (userInsertError) {
        setFormError(userInsertError.message);
        return;
      }

      const { error: ratingInsertError } = await supabase.from('user_rating_state').insert({
        user_id: authUser.id,
      });

      if (ratingInsertError) {
        setFormError(ratingInsertError.message);
        return;
      }

      router.replace('/access-code');
    } catch {
      setFormError('Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Create your account</h1>
      <p className="text-muted-foreground text-sm mb-6">Sign up to start tracking your forecasting edge.</p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="handle" className="block text-sm mb-1.5">
            Handle
          </label>
          <input
            id="handle"
            type="text"
            autoComplete="username"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            placeholder="your_handle"
            required
          />
          {handleError && <p className="text-destructive text-sm mt-1">{handleError}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            placeholder="you@example.com"
            required
          />
          {emailError && <p className="text-destructive text-sm mt-1">{emailError}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            placeholder="Minimum 8 characters"
            required
          />
          {passwordError && <p className="text-destructive text-sm mt-1">{passwordError}</p>}
        </div>

        {formError && <p className="text-destructive text-sm mt-1">{formError}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline text-sm">
          Log in
        </Link>
      </p>
    </div>
  );
}
