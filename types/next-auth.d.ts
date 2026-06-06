import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    // X (Twitter)
    xAccessToken?: string
    twitterId?: string
    // Reddit
    redditAccessToken?: string
    redditUsername?: string
    redditId?: string
    // Which providers are currently linked in this session
    providers: ("twitter" | "reddit")[]
    error?: "RefreshAccessTokenError"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // X (Twitter)
    xAccessToken?: string
    xRefreshToken?: string
    xExpiresAt?: number
    twitterId?: string
    // Reddit
    redditAccessToken?: string
    redditRefreshToken?: string
    redditExpiresAt?: number
    redditUsername?: string
    redditId?: string
    // Which providers are active in this token
    providers: ("twitter" | "reddit")[]
    error?: "RefreshAccessTokenError"
  }
}
