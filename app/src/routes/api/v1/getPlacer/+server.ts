import { error, json } from '@sveltejs/kit'
import { PUBLIC_CURRENT_BOARD } from '$env/static/public';

export const GET = async ({locals, url}) => {
  if (PUBLIC_CURRENT_BOARD == '') {
    throw error(500, "No board selected")
  }
  const urlX = url.searchParams.get("x")
  const urlY = url.searchParams.get("y")
  if (!urlX || !urlY) {
    throw error(400, "Missing x or y")
  }
  const x = parseInt(urlX)
  const y = parseInt(urlY)
  const board = await locals.db.board.findUnique({
    where: {
      name: PUBLIC_CURRENT_BOARD
    }
  })
  if (!board) {
    throw error(500, "Board hasn't been set, contact admin.")
  }
  const pixel = await locals.db.pixel.findUnique({
    where: {
      PixelIdentifier: {
        boardId: board.id,
        x,
        y
      }
    },
    select: {
      user: true
    }
  })
  if (!pixel) {
    throw error(404, "Pixel not found")
  }
  if (!pixel.user) {
    throw error(404, "User not found")
  }
  const user = pixel.user
  return json(user)
}