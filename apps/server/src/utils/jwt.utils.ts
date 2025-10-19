import jwt from 'jsonwebtoken'

export const generateToken = (
  payload: any,
  secret: string,
  expiresIn: '1h' | '24h' | '7d'
): string => {
  return jwt.sign(payload, secret, { expiresIn })
}

export const verifyToken = (token: string, secret: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) reject(err)
      resolve(decoded)
    })
  })
}
