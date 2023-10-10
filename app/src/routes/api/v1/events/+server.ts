// src/routes/events/+server.js
import { events } from 'sveltekit-sse'
import { pixelUpdatesManager, userPresenceManager } from '$lib/common'
/**
 * @param {number} milliseconds
 * @returns
 */
const delay = (milliseconds: number) => new Promise(r => setTimeout(r, milliseconds))

export function GET() {
  const flyMyPretties = true
  return events(async emit => {
    while (flyMyPretties) {
      await emit('pixel-updates', JSON.stringify({pixelUpdates: pixelUpdatesManager.getPixelUpdates()}))
      await emit('user-presence', JSON.stringify({userPresence: userPresenceManager.getUserPresence()}))
      userPresenceManager.cleanupUserPresence()
      console.log("emitted", pixelUpdatesManager.getPixelUpdates().length, "pixel updates")
      await delay(50)
    }
  }).toResponse()
}