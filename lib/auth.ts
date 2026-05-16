// lib/auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const { connectDB } = await import('@/lib/db')
          const { default: User } = await import('@/models/User')
          await connectDB()
          const user = await User.findOne({ email: credentials.email })
          if (!user || !user.password) return null
          const isValid = await bcrypt.compare(credentials.password as string, user.password)
          if (!isValid) return null
          return {
            id: user._id.toString(),   // ✅ must be string
            email: user.email,
            name: user.name,
            image: user.image,
          }
        } catch (err) {
          console.error('❌ authorize error:', err)
          return null
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') return true
      if (account?.provider === 'google') {
        try {
          const { connectDB } = await import('@/lib/db')
          const { default: User } = await import('@/models/User')
          await connectDB()
          const dbUser = await User.findOneAndUpdate(
            { email: user.email },
            { $setOnInsert: { email: user.email, name: user.name ?? 'User', image: user.image ?? '', provider: 'google', password: null } },
            { upsert: true, new: true, runValidators: false }
          )
          // ✅ Set the MongoDB _id on the user object so jwt callback gets it
          user.id = dbUser._id.toString()
        } catch (err) {
          console.error('❌ Google signIn DB error:', err)
        }
        return true
      }
      return true
    },

    async jwt({ token, user, account, trigger }) {
      // On first sign in, user object is available
      if (user) {
        token.sub = user.id       // ✅ store MongoDB _id as sub
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      // For Google, fetch the DB user id if not already set
      if (account?.provider === 'google' && !token.sub) {
        try {
          const { connectDB } = await import('@/lib/db')
          const { default: User } = await import('@/models/User')
          await connectDB()
          const dbUser = await User.findOne({ email: token.email })
          if (dbUser) token.sub = dbUser._id.toString()
        } catch (err) {
          console.error('❌ jwt google lookup error:', err)
        }
      }
      return token
    },

    async session({ session, token }) {
      // ✅ Always map token.sub → session.user.id
      if (token?.sub) session.user.id = token.sub
      if (token?.name) session.user.name = token.name as string
      if (token?.email) session.user.email = token.email as string
      if (token?.picture) session.user.image = token.picture as string
      return session
    },
  },

  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  debug: process.env.NODE_ENV === 'development',
})
