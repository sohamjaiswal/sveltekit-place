// src/routes/events/+server.js
import { events } from 'sveltekit-sse'
import { pixelUpdates } from '$lib/server/globals'
/**
 * @param {number} milliseconds
 * @returns
 */
const delay = (milliseconds: number) => new Promise(r => setTimeout(r, milliseconds))

export function GET() {
  const lol = true
  return events(async emit => {
    while (lol) {
      emit('pixel-updates', JSON.stringify({pixelUpdates}))
      await delay(1000)
    }
  }).toResponse()
}