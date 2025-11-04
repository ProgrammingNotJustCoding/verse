import type { Database } from '../database/db.ts'
import { captionRepository } from '../database/repositories/captions.repository.ts'
import { meetingRepository } from '../database/repositories/meetings.repository.ts'

export class SummaryService {
  private captionRepo: ReturnType<typeof captionRepository>
  private meetingRepo: ReturnType<typeof meetingRepository>

  constructor(private db: Database) {
    this.captionRepo = captionRepository(db)
    this.meetingRepo = meetingRepository(db)
  }

  async generateMeetingSummary(meetingId: string): Promise<void> {
    const meeting = await this.meetingRepo.getById(meetingId)
    if (!meeting || !meeting.endedAt) {
      throw new Error('Meeting not found or not ended')
    }

    const captions = await this.captionRepo.getMeetingCaptions(meetingId)

    if (captions.length === 0) {
      console.log(`No captions found for meeting ${meetingId}`)
      return
    }

    const transcript = captions.map(c => `[${c.participantIdentity}]: ${c.text}`).join('\n')

    const summary = await this.generateSimpleSummary(transcript, captions.length)

    await this.captionRepo.createSummary({
      meetingId,
      summary,
    })

    console.log(`✓ Generated summary for meeting ${meetingId}`)
  }

  private async generateSimpleSummary(transcript: string, captionCount: number): Promise<string> {
    const words = transcript.split(' ').length
    const duration = Math.ceil(words / 150)

    return `Meeting Summary:
- Duration: ~${duration} minutes
- Total messages: ${captionCount}
- Word count: ${words}

Transcript Preview:
${transcript.substring(0, 500)}...

[Full transcript available separately]`
  }

  // TODO: Add OpenAI integration
  private async generateAISummary(transcript: string): Promise<string> {
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a meeting summarizer. Create a concise summary of the meeting transcript.'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    return data.choices[0].message.content
    */

    return this.generateSimpleSummary(transcript, 0)
  }
}

export const createSummaryService = (db: Database) => new SummaryService(db)
