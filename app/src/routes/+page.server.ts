import {PUBLIC_CURRENT_BOARD} from '$env/static/public'
import { redis } from '$lib/server/redis'
import { error } from '@sveltejs/kit'

export const load = async ({locals}) => {
  if (PUBLIC_CURRENT_BOARD == '') {
    throw error(500, "No board selected")
  }
  const getPixels = async () => {
    const cachedPixels = await redis.get('pixels')
    if (cachedPixels) {
      return JSON.parse(cachedPixels)
    }
    const pixels = await locals.db.pixel.findMany({
      where: {
        board: {
          name: PUBLIC_CURRENT_BOARD
        }
      },
      select: {
        x: true,
        y: true,
        color: true
      }
    }).catch((e) => {
      console.error(e)
      throw error(500, "Error while fetching pixels")
    })
    redis.set('pixels', JSON.stringify(pixels))
    return pixels
  }
  const getBoard = async () => {
    const board = await locals.db.board.findUnique({
      where: {
        name: "main"
      }
    })
    if (!board) {
      throw error(500, "Board hasn't been set, contact admin.")
    }
    return board
  }
  return {
    board: getBoard(), 
    lazy: {
      pixels: getPixels(),
    }
  }
}