import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyMessage } from 'ethers';
import { SiweMessage } from 'siwe';

function decodeSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildMessageCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  return [trimmed, decodeSafe(trimmed), decodeSafe(decodeSafe(trimmed))];
}

function parseSiweMessage(raw: unknown): SiweMessage | null {
  if (!raw) return null;

  if (typeof raw === 'string') {
    const candidates = buildMessageCandidates(raw);

    for (const candidate of candidates) {
      const text = candidate.trim();
      if (!text) continue;

      try {
        if (text.startsWith('{')) {
          return new SiweMessage(JSON.parse(text));
        }
        if (text.startsWith('"')) {
          const parsed = JSON.parse(text);
          if (typeof parsed === 'string') {
            if (parsed.trim().startsWith('{')) {
              return new SiweMessage(JSON.parse(parsed));
            }
            return new SiweMessage(parsed);
          }
        }
        return new SiweMessage(text);
      } catch {
        continue;
      }
    }

    return null;
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
          const signature = (credentials?.signature || '').trim();
          if (!signature) {
            console.error('SIWE auth: missing signature');
            return null;
          }

          // Path A: strict SIWE payload.
          if (siwe?.address) {
            let recovered = '';
            try {
              recovered = verifyMessage(siwe.prepareMessage(), signature).toLowerCase();
            } catch (error) {
              console.error('SIWE auth: SIWE signature recovery failed', error);
            }

            if (recovered === siwe.address.toLowerCase()) {
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
            }
          }

          // Path B: plain signed message fallback (some wallet kits send non-SIWE text).
          if (typeof credentials?.message === 'string') {
            const candidates = buildMessageCandidates(credentials.message);
            for (const candidate of candidates) {
              const addressInMessage = candidate.match(/0x[a-fA-F0-9]{40}/)?.[0]?.toLowerCase();
              if (!addressInMessage) continue;

              try {
                const recovered = verifyMessage(candidate, signature).toLowerCase();
                if (recovered === addressInMessage) {
                  return { id: recovered };
                }
              } catch {
                continue;
              }
            }
          }

          console.error('SIWE auth: invalid message payload', {
            messageType: typeof credentials?.message,
            preview:
              typeof credentials?.message === 'string'
                ? credentials.message.slice(0, 120)
                : null,
          });
          return null;
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
