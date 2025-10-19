import { Hono } from 'hono'
import { login, signUp } from './controllers/auth.controller.ts'

const authRouter = new Hono()

authRouter.post('/signup', signUp)
authRouter.post('/login', login)

export { authRouter }
