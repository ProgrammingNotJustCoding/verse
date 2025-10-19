import type { Context } from 'hono'

import { API_ERRORS } from '../constants/errors.ts'
import { loginValidator, signUpValidator } from '../validators/auth.validators.ts'
import { hashPassword, verifyPassword } from '../../utils/hash.utils.ts'
import { generateToken } from '../../utils/jwt.utils.ts'
import { userRepository } from '../../database/repositories/users.repository.ts'

export const signUp = async (c: Context) => {
  const body = await c.req.json()

  const validate = signUpValidator(body)

  if (!validate.success) {
    return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
  }

  const { name, email, password } = validate.data

  const checkUserExists = await userRepository(c.get('db')).getOneByEmail(email)

  if (checkUserExists) {
    return c.json({ error: API_ERRORS.USER_ALREADY_EXISTS }, 409)
  }

  const hashedPassword = await hashPassword(password)

  const user = await userRepository(c.get('db')).create({
    name,
    email,
    password: hashedPassword,
  })

  const jwtSecret = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'secret'
  const token = generateToken({ userId: user.id }, jwtSecret, '7d')

  return c.json(
    {
      data: {
        token,
      },
    },
    201
  )
}

export const login = async (c: Context) => {
  const body = await c.req.json()

  const validate = loginValidator(body)

  if (!validate.success) {
    return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
  }

  const { email, password } = validate.data

  const user = await userRepository(c.get('db')).getOneByEmail(email)

  if (!user) {
    return c.json({ error: API_ERRORS.USER_NOT_FOUND }, 404)
  }

  const isPasswordValid = await verifyPassword(password, user.password)

  if (!isPasswordValid) {
    return c.json({ error: API_ERRORS.INVALID_CREDENTIALS }, 401)
  }

  const jwtSecret = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'secret'
  const token = generateToken({ userId: user.id }, jwtSecret, '7d')

  return c.json(
    {
      data: {
        token,
      },
    },
    200
  )
}
