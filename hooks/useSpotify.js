import { useEffect } from 'react'
import SpotifyWebApi from 'spotify-web-api-node'
import { useSession, signIn } from 'next-auth/react'

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_CLIENT_SESCRET,
})

function useSpotify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session) {
      if (session.error === 'RefeshAccessTokenError') {
        signIn()
      }

      spotifyApi.setAccessToken(session.user.accessToken)
    }
  }, [session, spotifyApi])

  return spotifyApi
}

export default useSpotify
