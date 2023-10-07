import { CARDBOARD_SECRET, CARDBOARD_TOKEN, JWT_SECRET } from '$env/static/private';
import { Cardboard } from 'cardboard.js';
import jwt from 'jsonwebtoken';

if (!CARDBOARD_TOKEN) {
	throw new Error('Missing Cardboard Token');
}

if (!CARDBOARD_SECRET) {
	throw new Error('Missing Cardboard Secret');
}

export const cb = new Cardboard(CARDBOARD_TOKEN, CARDBOARD_SECRET);

export function createToken(session: string) {
  return jwt.sign(
      session,
      JWT_SECRET
  );
}