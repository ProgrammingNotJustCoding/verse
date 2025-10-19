import z from 'zod'

type SignUpBody = {
  name: string
  email: string
  password: string
}

type LoginBody = {
  email: string
  password: string
}

export const signUpValidator = (body: SignUpBody) => {
  const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
  })

  return schema.safeParse(body)
}

export const loginValidator = (body: LoginBody) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
  })

  return schema.safeParse(body)
}
