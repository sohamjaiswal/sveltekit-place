import { error, json } from '@sveltejs/kit'
import { PUBLIC_CURRENT_BOARD } from '$env/static/public';
import type { Pixel } from '@prisma/client';
import {z} from 'zod'
import { pixelUpdatesManager } from '$lib/common';

export const POST = async ({locals, request}) => {
  if (PUBLIC_CURRENT_BOARD == '') {
    throw error(500, "No board selected")
  }
  if (!locals.localUser) {
    throw error(401, "Not logged in")
  }
  const {x, y, color} = await request.json() as unknown as Pick<Pixel, "x"|"y"|"color">

  if (!x || !y || !color || typeof x != "number" || typeof y != "number" || typeof color != "string") {
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
    color: z.string()
  })
  const result = reqSchema.safeParse({x, y, color})

  if (!result.success) {
    throw error(400, "Invalid x, y, or color")
  }


  const updatedPixel = await locals.db.pixel.update({
    where: {
      PixelIdentifier: {
        boardId: board.id,
        x,
        y
      }
    },
    data: {
      color,
      userId: locals.localUser.id
    }
  })

  const pushEl = {x: updatedPixel.x, y: updatedPixel.y, color: updatedPixel.color}

  pixelUpdatesManager.addPixelUpdate([pushEl])

  return json(updatedPixel)
}