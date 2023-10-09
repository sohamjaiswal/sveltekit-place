import { error, json } from '@sveltejs/kit'
import { PUBLIC_CURRENT_BOARD } from '$env/static/public';
import {z} from 'zod'
import { userPresenceManager } from '$lib/common';

export const POST = async ({locals, request}) => {
  if (PUBLIC_CURRENT_BOARD == '') {
    throw error(500, "No board selected")
  }
  if (!locals.localUser) {
    throw error(401, "Not logged in")
  }

  const {x, y} = await request.json() as unknown as {x: number, y: number}

  if ((!x && x !== 0) || (!y && y !== 0) || typeof x != "number" || typeof y != "number") {
    throw error(400, "Missing x, y, or color")
  }
  
  const board = await locals.db.board.findUnique({
    where: {
      name: PUBLIC_CURRENT_BOARD
    }
  })

  if (!board) {
    throw error(500, "Board hasn't been set, contact admin.")
  }

  const reqSchema = z.object({
    x: z.number().min(0).max(board.dimX - 1),
    y: z.number().min(0).max(board.dimY - 1),
  })
  const result = reqSchema.safeParse({x, y})

  if (!result.success) {
    throw error(404, "Invalid user position!")
  }


  userPresenceManager.updateUserPosition({user: locals.localUser, x, y, last_seen: Date.now()})

  const presence = userPresenceManager.getUserPresence()

  return json(presence)
}