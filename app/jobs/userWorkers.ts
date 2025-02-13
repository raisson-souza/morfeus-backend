import { Job, Worker } from 'bullmq'
import { SendWelcomeEmailJob } from './types/userTypes.js'
import EmailSender from '../utils/EmailSender.js'
import redisConnection from '#config/queue'

class UserWorkers {
    constructor() {
        new Worker<SendWelcomeEmailJob, any, string>("sendWelcomeEmail", this.sendWelcomeMessage, { connection: redisConnection })
    }

    private async sendWelcomeMessage(job: Job<SendWelcomeEmailJob, any, string>) {
        const { userName, userEmail } = job.data
        await EmailSender.Send({
            subject: "Bem Vindo!",
            text: `Olá ${ userName }, você acabou de criar uma conta no Morfeus!\nSeja bem vindo!`,
            to: userEmail,
        })
    }
}

export default UserWorkers