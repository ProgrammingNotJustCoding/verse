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
  UNAUTHORIZED: {
    code: 401,
    message: 'Unauthorized',
    prettyMessage: 'You must be authenticated to access this resource.',
  },
  INVALID_CREDENTIALS: {
    code: 401,
    message: 'Invalid Credentials',
    prettyMessage: 'The provided email or password is incorrect.',
  },
  FORBIDDEN: {
    code: 403,
    message: 'Forbidden',
    prettyMessage: 'You do not have permission to access this resource.',
  },
  USER_NOT_FOUND: {
    code: 404,
    message: 'User Not Found',
    prettyMessage: 'The requested user could not be found.',
  },
  ROOM_NOT_FOUND: {
    code: 404,
    message: 'Room Not Found',
    prettyMessage: 'The requested room could not be found.',
  },
  PARTICIPANT_NOT_FOUND: {
    code: 404,
    message: 'Participant Not Found',
    prettyMessage: 'The requested participant could not be found.',
  },
  USER_ALREADY_EXISTS: {
    code: 409,
    message: 'User Already Exists',
    prettyMessage: 'A user with the provided email already exists.',
  },
  ALREADY_IN_ROOM: {
    code: 409,
    message: 'Already In Room',
    prettyMessage: 'You are already a participant in this room.',
  },
  ROOM_FULL: {
    code: 409,
    message: 'Room Full',
    prettyMessage: 'The room has reached its maximum participant capacity.',
  },
  ROOM_INACTIVE: {
    code: 410,
    message: 'Room Inactive',
    prettyMessage: 'The room is no longer active.',
  },
  NOT_ROOM_ADMIN: {
    code: 403,
    message: 'Not Room Admin',
    prettyMessage: 'Only the room admin can perform this action.',
  },
  INTERNAL_SERVER_ERROR: {
    code: 500,
    message: 'Internal Server Error',
    prettyMessage: 'An unexpected error occurred on the server.',
  },
}
