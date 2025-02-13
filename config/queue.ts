import env from "#start/env"
import IORedis from "ioredis"

const redisConnection = new IORedis.Redis({
    host: env.get("REDIS_HOST"),
    port: env.get("REDIS_PORT"),
    maxRetriesPerRequest: null,
})

export default redisConnection