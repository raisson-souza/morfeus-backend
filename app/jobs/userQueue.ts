import { Queue } from 'bullmq'
import { SendWelcomeEmailJob } from './types/userTypes.js'
import redisConnection from '#config/queue'

class UserQueue {
    private sendWelcomeEmailQueue: Queue<any, any, string, SendWelcomeEmailJob>

    constructor() {
        this.sendWelcomeEmailQueue = new Queue<any, any, string, SendWelcomeEmailJob>('sendWelcomeEmail', { connection: redisConnection })
    }

    async sendWelcomeEmail(payload: SendWelcomeEmailJob) {
        return await this.sendWelcomeEmailQueue.add(
            "sendWelcomeEmail",
            payload,
            {
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: true,
            }
        )
    }
}

export default new UserQueue()