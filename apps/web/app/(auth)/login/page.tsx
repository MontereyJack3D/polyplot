'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      const authUser = data.user;
      if (!authUser) {
        setFormError('Login succeeded, but no user was returned.');
        return;
      }

      const nowIso = new Date().toISOString();
      const { data: grants, error: grantsError } = await supabase
        .from('access_grants')
        .select('grant_id')
        .eq('user_id', authUser.id)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .limit(1);

      if (grantsError) {
        setFormError(grantsError.message);
        return;
      }

      if (grants && grants.length > 0) {
        router.replace('/dashboard');
      } else {
        router.replace('/access-code');
      }
    } catch {
      setFormError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h1>
      <p className="text-muted-foreground text-sm mb-6">Log in to continue to PolyPlot.</p>

      <form className="space-y-4" onSubmit={onSubmit}>
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
        </div>

        <div>
          <label htmlFor="password" className="block text-sm mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full"
            required
          />
        </div>

        {formError && <p className="text-destructive text-sm mt-1">{formError}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground text-center">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline text-sm">
          Sign up
        </Link>
      </p>
    </div>
  );
}
