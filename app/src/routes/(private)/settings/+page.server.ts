import { fail, redirect } from '@sveltejs/kit'
import {zfd} from 'zod-form-data'
import {z} from 'zod'
import { redis } from '$lib/server/redis'

export const load = ({locals}) => {
  if (!locals.localUser) {
    return {
      status: 302,
      redirect: '/login'
    }
  }
  if (!locals.remoteUser) {
    return {
      status: 302,
      redirect: '/login'
    }
  }
  if (locals.localUser.role as string === 'ADMIN') {
    // get boards from db
    const boards = locals.db.board.findMany()
    return {boards}
  }
  return {}
}

export const actions = {
  createBoard: async ({locals, request}) => {
    if (!locals.localUser) {
      throw redirect(302, '/login')
    }
    const formData = await request.formData()
    const createBoardSchema = zfd.formData({
      name: zfd.text(z.string().min(3).max(20)),
      description: zfd.text(z.string().min(3).max(100).optional()),
      dimx: zfd.numeric(z.number().min(16)),
      dimy: zfd.numeric(z.number().min(16)),
      bgColor: zfd.text(z.string().min(7).max(7)),
    })
    const result = createBoardSchema.safeParse(formData)
    if (!result.success) {
      const data = {
        data: Object.fromEntries(formData),
        errors: result.error.flatten().fieldErrors
      }
      return fail(400, data)
    }
    try {
      const newBoard = await locals.db.board.create({
        data: {
          name: result.data.name,
          description: result.data.description,
          dimX: result.data.dimx,
          dimY: result.data.dimy,
          color: result.data.bgColor,
        }
      })
      const {id, dimX, dimY, color} = newBoard
      const newBoardPixels = []
      for (let i = 0; i < dimX; i++) {
        for (let j = 0; j < dimY; j++) {
          newBoardPixels.push({
            boardId: id,
            x: i,
            y: j,
            color,
            userId: locals.localUser.id
          })
        }
      }
      await locals.db.pixel.createMany({
        data: newBoardPixels
      })
    } catch (e) {
      console.error(e)
      return fail(403, {error: `${e}`})
    }
    throw redirect(303, '/settings')
  },
  deleteBoard: async ({locals, request}) => {
    const formData = await request.formData()
    const deleteBoardSchema = zfd.formData({
      id: zfd.text(z.string()),
    })
    const result = deleteBoardSchema.safeParse(formData)
    if (!result.success) {
      const data = {
        data: Object.fromEntries(formData),
        errors: result.error.flatten().fieldErrors
      }
      return fail(400, data)
    }
    try {
      await locals.db.pixel.deleteMany({
        where: {
          boardId: result.data.id
        }
      })

      // delete pixels from redis
      await redis.del('pixels')

      await locals.db.board.delete({
        where: {
          id: result.data.id
        }
      })
    } catch (e) {
      console.error(e)
      return fail(403, {error: `${e}`})
    }

    throw redirect(303, '/settings')
  }
}