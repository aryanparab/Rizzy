import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  
  // Use JWT strategy for better performance (no database calls)
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 2 * 60 * 60, // Update session every 2 hours instead of on every request
  },
  
  // Optimize JWT settings
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // Optimize callbacks to return only necessary data
  callbacks: {
    async jwt({ token, account, user }) {
      // Only store essential user data in JWT
      if (account && user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    },
    
    async session({ session, token }) {
      // Return minimal session data
      return {
        user: {
          email: token.email,
          name: token.name,
          image: token.picture,
        },
        expires: session.expires,
      }
    },
  },
  
  // Optimize pages and events
  pages: {
    // You can customize auth pages here if needed
    // signIn: '/auth/signin',
    // error: '/auth/error',
  },
  
  // Add events for debugging (remove in production)
  events: {
    async session({ session, token }) {
      // Uncomment for debugging session calls
      // console.log('Session event triggered:', new Date().toISOString())
    }
  }
}

// For App Router: export as GET and POST handlers
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }