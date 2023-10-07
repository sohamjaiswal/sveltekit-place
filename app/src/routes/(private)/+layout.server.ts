import { redirect } from "@sveltejs/kit"
import { PUBLIC_CARDBOARD_URL } from "$env/static/public"
export const load = async ({ locals }) => {
	// redirect user if logged in
	if (!locals.localUser) {
		throw redirect(302, PUBLIC_CARDBOARD_URL)
	}
}