import type { Context } from 'hono'
import { API_ERRORS } from '../constants/errors.ts'
import { getParticipantValidator } from '../validators/participant.validators.ts'
import { participantRepository } from '../../database/repositories/participants.repository.ts'

export const getParticipant = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const participantId = c.req.param('participantId')
    const validate = getParticipantValidator({ participantId })

    if (!validate.success) {
      logger.warn({ error: validate.error }, 'Invalid get participant request')
      return c.json({ error: API_ERRORS.BAD_REQUEST }, 400)
    }

    const participant = await participantRepository(db).getById(participantId)
    if (!participant) {
      return c.json({ error: API_ERRORS.PARTICIPANT_NOT_FOUND }, 404)
    }

    return c.json({ data: { participant } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to get participant')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}

export const getUserParticipations = async (c: Context) => {
  const logger = c.get('logger')
  const db = c.get('db')

  try {
    const userId = c.get('userId')
    if (!userId) {
      return c.json({ error: API_ERRORS.UNAUTHORIZED }, 401)
    }

    const participations = await participantRepository(db).getByUserId(userId)

    return c.json({ data: { participations } }, 200)
  } catch (error) {
    logger.error({ error }, 'Failed to get user participations')
    return c.json({ error: API_ERRORS.INTERNAL_SERVER_ERROR }, 500)
  }
}
