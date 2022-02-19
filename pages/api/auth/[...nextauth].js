import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { LOGIN_URL } from '../../../lib/spotify'
import { spotifyApi } from '../../../hooks/useSpotify'

async function refeshAccessToken(token) {
  try {
    spotifyApi.setAccessToken(token.accessToken)
    spotifyApi.setRefreshToken(token.refeshToken)
    const { body: refeshedToken } = await spotifyApi.refreshAccessToken()

    const newData = {
      ...token,
      accessToken: refeshedToken.access_token,
      accessTokenExpires: Date.now() + refeshedToken.expires_in * 1000,
      refeshtoken: refeshedToken.refresh_token ?? token.refeshToken,
    }

    return newData
  } catch (error) {
    console.error(error)
    return {
      ...token,
      error: 'RefeshAccessTokenError',
    }
  }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_CLIENT_SESCRET,
      authorization: LOGIN_URL,
    }),
  ],
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: '/login',
  },
  session: { jwt: true },
  callbacks: {
    async session({ session, token }) {
      session.user.accessToken = token.accessToken
      session.user.refeshToken = token.refeshToken
      session.user.username = token.username

      return session
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refeshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000,
        }
      }

      // Refesh Token
      if (Date.now() < token.accessTokenExpires) {
        console.log('Existing access token')

        return token
      }

      // Access token has expired, so we need to refesh it...
      console.log('Access token has expired, refeshing')
      return await refeshAccessToken(token)
    },
  },
})
