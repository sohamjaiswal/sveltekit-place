import {PUBLIC_CURRENT_BOARD} from '$env/static/public'
import { error } from '@sveltejs/kit'

export const load = async ({locals}) => {
  if (PUBLIC_CURRENT_BOARD == '') {
    throw error(500, "No board selected")
  }
  // get pixels
  const getPixels = async () => {
    return await locals.db.pixel.findMany({
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
  }
  const getBoard = async () => {
    return await locals.db.board.findUnique({
      where: {
        name: "main"
      }
    }).catch(() => {
      throw error(500, "Board hasn't been set, contact admin.")
    })
  }
  return {lazy: {
    pixels: getPixels(),
    board: getBoard()
  }}
}