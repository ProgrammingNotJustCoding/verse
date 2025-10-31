import type { Context, Next } from 'hono'
import { verifyToken } from '../../utils/jwt.utils.ts'
import type { JwtPayload } from 'jsonwebtoken'

export const authMiddleware = async (c: Context, next: Next) => {
  const logger = c.get('logger')
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Missing or invalid Authorization header')
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.split(' ')[1]
  const jwtSecret = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'secret'

  try {
    const payload = await verifyToken(token, jwtSecret) as JwtPayload

    if (!payload || !payload.userId) {
      logger.warn('Invalid token payload')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('userId', payload.userId)

    await next()
  } catch (error) {
    logger.error({ error }, 'Failed to verify token')
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
