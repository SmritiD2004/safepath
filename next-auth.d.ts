import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: string
    isAnonymous?: boolean
  }

  interface Session {
    user: {
      id: string
      role?: string
      isAnonymous?: boolean
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    isAnonymous?: boolean
  }
}
