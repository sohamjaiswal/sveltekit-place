export const load = async ({locals}) => {
  // get pixels
  const getPixels = async () => {
    return await locals.db.pixel.findMany({
      where: {
        board: {
          name: "main"
        }
      },
      select: {
        x: true,
        y: true,
        color: true
      }
    })
  }
  const getBoard = async () => {
    return await locals.db.board.findUnique({
      where: {
        name: "main"
      }
    })
  }
  return {lazy: {
    pixels: getPixels(),
    board: getBoard()
  }}
}