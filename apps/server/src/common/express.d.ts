import 'express'

import type { SessionUser } from './interfaces/session-user.interface.js'

declare module 'express' {
  interface Request {
    user?: SessionUser
    sessionId?: string
  }
}
