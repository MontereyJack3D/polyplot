'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import type { CodeRedeemResponse } from '@polyplot/core';

export default function AccessCodePage() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/access/code/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = (await response.json()) as CodeRedeemResponse | { error?: string };

      if (!response.ok || !('access' in data) || data.access !== 'granted') {
        setError('Invalid or expired code');
        return;
      }

      router.replace('/dashboard');
    } catch {
      setError('Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Enter Access Code</h1>
      <p className="text-muted-foreground text-sm mb-6">
        PolyPlot is currently in private alpha. Enter your access code to continue.
      </p>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="access-code" className="block text-sm mb-1.5">
            Access Code
          </label>
          <input
            id="access-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-primary w-full uppercase tracking-wider"
            placeholder="XXXX-XXXX"
            required
          />
        </div>

        {error && <p className="text-destructive text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground font-medium py-2.5 px-4 rounded-lg w-full hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground text-center">
        Need an invite?{' '}
        <Link href="mailto:access@polyplot.app" className="text-primary hover:underline text-sm">
          Request access
        </Link>
      </p>
    </div>
  );
}
