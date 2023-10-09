import { Redis } from "ioredis";
import { REDIS_URL } from "$env/static/private";

export const redis = new Redis(REDIS_URL);