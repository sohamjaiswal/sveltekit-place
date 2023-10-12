import { error } from "@sveltejs/kit"

export const load = async ({locals}) => {
  const getTopChangers = async () => {
    // get top 10 values of totalPixelsChanged from user schema
    const topChangers = await locals.db.user.findMany({
      orderBy: {
        totalPixelsChanged: 'desc'
      },
      take: 10,
      select: {
        id: true,
        username: true,
        totalPixelsChanged: true,
        avatar: true,
        banner: true
      }
    })
    if (!topChangers) {
      throw error(500, "Error while fetching top changers")
    }
    return topChangers
  }
  return {lazy: {
    topChangers: getTopChangers()
  }}
}