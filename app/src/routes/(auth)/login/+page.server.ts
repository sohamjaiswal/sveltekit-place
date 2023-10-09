import { PROD } from '$env/static/private';
import { cb, createToken } from '$lib/server';
import { redirect } from '@sveltejs/kit';
export const load = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		throw redirect(302, '/');
	}

	const {access_token} = await cb.exchangeInitialToken(code);

	if (!access_token) {
		throw redirect(302, '/');
	}

	cookies.set('session', createToken(access_token), {
		path: '/',
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
		httpOnly: true,
		sameSite: PROD === 'true' ? 'none' : 'lax',
    secure: PROD === 'true',
	});

	throw redirect(302, '/');
};
