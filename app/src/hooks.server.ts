import { JWT_SECRET } from '$env/static/private';
import { cb, prisma } from '$lib/server';
import type { Handle } from '@sveltejs/kit';
import { enhance } from '@zenstackhq/runtime';
import jwt from 'jsonwebtoken';

const auth = (async ({ event, resolve }) => {
    const token = event.cookies.get('session');
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as string;
            const user = await cb.getUserInfo(decoded);
            if (!user || !user.id || user.id == '') {
              event.cookies.set('session', '', {
                path: '/',
                expires: new Date(0)
              });
              return resolve(event);
            }
            if (user) {
                event.locals.remoteUser = user;
                let localUser = await prisma.user.findUnique({
                  where:{
                    id: user.id
                  }
                })
                if (!localUser) {
                  localUser = await prisma.user.create({
                    data:{
                      id: user.id,
                      username: user.name,
                      avatar: user.avatar,
                      banner: user.banner,
                    }
                  })
                } 
                event.locals.localUser = localUser;
            } else {
                console.warn('User not found:', decoded.sub);
                event.cookies.delete('session', { path: '/' });
            }
        } catch {
            event.cookies.delete('session', { path: '/' });
        }
    }

    // create an enhanced PrismaClient that recognizes access policies
    event.locals.db = enhance(prisma, {
        user: event.locals.localUser ? { id: event.locals.localUser.id } : undefined
    });

    return resolve(event);
}) satisfies Handle;

export const handle = auth;