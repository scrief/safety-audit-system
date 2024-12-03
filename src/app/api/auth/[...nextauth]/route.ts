import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" }
      },
      async authorize(credentials) {
        console.log('Authorize called with credentials:', credentials);

        if (!credentials?.email) {
          console.log('No email provided');
          return null;
        }

        try {
          console.log('Looking up user:', credentials.email);
          
          // For testing, create a test user if it doesn't exist
          let user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          console.log('Existing user found:', user);

          if (!user) {
            console.log('Creating new user');
            // Create a test user
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split('@')[0],
                role: 'USER'
              }
            });
            console.log('New user created:', user);
          }

          const userToReturn = {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            role: user.role || 'USER'
          };

          console.log('Returning user:', userToReturn);
          return userToReturn;

        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback - Token:', token, 'User:', user);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Session:', session, 'Token:', token);
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin'
  },
  debug: true
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
