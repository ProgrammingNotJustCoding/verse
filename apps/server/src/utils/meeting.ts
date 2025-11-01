import { ulid } from 'ulid'

export function generateMeetingCode(): string {
  return ulid()
}

export function isValidMeetingCode(code: string): boolean {
  if (code.length !== 26) return false

  const validChars = /^[0-9A-HJKMNP-TV-Z]{26}$/i

  return validChars.test(code)
}

export function normalizeMeetingCode(code: string): string {
  return code.toUpperCase().trim()
}
