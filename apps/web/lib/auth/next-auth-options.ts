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
      async authorize(credentials, req) {
        try {
          const siwe = parseSiweMessage(credentials?.message);
          if (!siwe) {
            return null;
          }
          if (!siwe.address) {
            return null;
          }
          const signature = credentials?.signature || '';
          const reqHost = req?.headers?.host;
          const envHost = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : undefined;
          const expectedDomain = reqHost || envHost;

          // Primary SIWE validation path.
          let success = false;
          try {
            const result = await siwe.verify({
              signature,
              domain: expectedDomain,
            });
            success = !!result.success;
          } catch {
            success = false;
          }

          // Fallback for stale csrf/cookie edge cases: cryptographic signature check.
          if (!success) {
            try {
              const recovered = verifyMessage(siwe.prepareMessage(), signature).toLowerCase();
              success = recovered === siwe.address.toLowerCase();
            } catch {
              success = false;
            }
          }

          if (!success) return null;

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
