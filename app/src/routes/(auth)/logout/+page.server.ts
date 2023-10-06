import {redirect} from "@sveltejs/kit"
import {cb} from "$lib/server"

export const load = () => {
  throw redirect( 302, '/') 
}

export const actions = {
  default: async({cookies}) => {
    const code = cookies.get('session')
    if (!code) {
      throw redirect( 302, '/')
    }
    cb.revokeToken(code)
    cookies.set('session', '', {
			path: '/',
			expires: new Date(0),
		})
    throw redirect( 302, '/')
  }
}