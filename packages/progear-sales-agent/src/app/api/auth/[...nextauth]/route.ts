import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';

const oktaDomain = process.env.NEXT_PUBLIC_OKTA_DOMAIN || '';
const oktaIssuer = process.env.NEXT_PUBLIC_OKTA_ISSUER || `${oktaDomain}/oauth2/default`;

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'okta',
      name: 'Okta',
      type: 'oauth',
      wellKnown: `${oktaIssuer}/.well-known/openid-configuration`,
      clientId: process.env.NEXT_PUBLIC_OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET || 'not-used-for-pkce',
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
      checks: ['pkce', 'state'],
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and id_token to the token right after sign in
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
      }
      if (profile) {
        token.sub = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.user = {
        ...session.user,
        id: token.sub as string,
      };
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
