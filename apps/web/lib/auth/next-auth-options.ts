import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyMessage } from 'ethers';
import { SiweMessage } from 'siwe';

function parseSiweMessage(raw: unknown): SiweMessage | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    try {
      if (trimmed.startsWith('{')) {
        return new SiweMessage(JSON.parse(trimmed));
      }
      return new SiweMessage(trimmed);
    } catch {
      return null;
    }
  }

  if (typeof raw === 'object') {
    try {
      return new SiweMessage(raw as ConstructorParameters<typeof SiweMessage>[0]);
    } catch {
      return null;
    }
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: { label: 'Message', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const siwe = parseSiweMessage(credentials?.message);
          if (!siwe) {
            console.error('SIWE auth: invalid message payload');
            return null;
          }
          if (!siwe.address) {
            console.error('SIWE auth: missing address in message');
            return null;
          }
          const signature = (credentials?.signature || '').trim();
          if (!signature) {
            console.error('SIWE auth: missing signature');
            return null;
          }

          // Accept SIWE by validating the signed message cryptographically.
          // This avoids callback-domain/csrf nonce drift issues that can happen in hosted envs.
          let recovered = '';
          try {
            recovered = verifyMessage(siwe.prepareMessage(), signature).toLowerCase();
          } catch (error) {
            console.error('SIWE auth: signature recovery failed', error);
            return null;
          }

          if (recovered !== siwe.address.toLowerCase()) {
            console.error('SIWE auth: recovered address mismatch', {
              recovered,
              expected: siwe.address.toLowerCase(),
            });
            return null;
          }

          // Optional freshness check (issuedAt within 24h) to reduce replay window.
          if (siwe.issuedAt) {
            const issuedAt = new Date(siwe.issuedAt).getTime();
            if (Number.isFinite(issuedAt)) {
              const ageMs = Date.now() - issuedAt;
              if (ageMs > 24 * 60 * 60 * 1000) {
                console.error('SIWE auth: message too old');
                return null;
              }
            }
          }

          return { id: siwe.address.toLowerCase() };
        } catch (error) {
          console.error('SIWE auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user = {
          ...session.user,
          address: token.sub,
        } as typeof session.user;
      }
      return session;
    },
    async jwt({ token }) {
      return token;
    },
  },
};
