import { API } from '../utils/api'

export async function signUp(data: { name: string; email: string; password: string }) {
  const res = await fetch(`${API.BASE_URL}${API.AUTH.BASE_URL()}${API.AUTH.SIGN_UP()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${API.BASE_URL}${API.AUTH.BASE_URL()}${API.AUTH.LOGIN()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}
