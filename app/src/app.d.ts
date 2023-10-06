// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
import type { PrismaClient, User } from '@prisma/client';
import { GuildedUser } from 'cardboard.js';

declare global {
    namespace App {
        interface Locals {
						remoteUser?: GuildedUser;
            localUser?: User;
						db: PrismaClient;
        }
    }
}

export {};