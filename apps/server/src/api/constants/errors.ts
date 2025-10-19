export type APIError = {
  code: number
  message: string
  prettyMessage: string
}

export const API_ERRORS: Record<string, APIError> = {
  BAD_REQUEST: {
    code: 400,
    message: 'Bad Request',
    prettyMessage: 'The request was malformed or invalid.',
  },
  INVALID_CREDENTIALS: {
    code: 401,
    message: 'Invalid Credentials',
    prettyMessage: 'The provided email or password is incorrect.',
  },
  USER_NOT_FOUND: {
    code: 404,
    message: 'User Not Found',
    prettyMessage: 'The requested user could not be found.',
  },
  USER_ALREADY_EXISTS: {
    code: 409,
    message: 'User Already Exists',
    prettyMessage: 'A user with the provided email already exists.',
  },
  INTERNAL_SERVER_ERROR: {
    code: 500,
    message: 'Internal Server Error',
    prettyMessage: 'An unexpected error occurred on the server.',
  },
}
