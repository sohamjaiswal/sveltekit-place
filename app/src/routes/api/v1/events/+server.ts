// src/routes/events/+server.js
import { events } from 'sveltekit-sse'
import { pixelUpdatesManager, userPresenceManager } from '$lib/common'
/**
 * @param {number} milliseconds
 * @returns
 */
const delay = (milliseconds: number) => new Promise(r => setTimeout(r, milliseconds))

export function GET() {
  const lol = true
  return events(async emit => {
    while (lol) {
      emit('pixel-updates', JSON.stringify({pixelUpdates: pixelUpdatesManager.getPixelUpdates()}))
      emit('user-presence', JSON.stringify({userPresence: userPresenceManager.getUserPresence()}))
      userPresenceManager.cleanupUserPresence()
      await delay(1000)
    }
  }).toResponse()
}