import { DateTime } from 'luxon'
import { Job, Worker } from 'bullmq'
import { SendWelcomeEmailJob } from './types/userTypes.js'
import EmailSender from '../utils/EmailSender.js'
import redisConnection from '#config/queue'

class UserWorkers {
    constructor() {
        new Worker<SendWelcomeEmailJob, any, string>("sendWelcomeEmail", this.sendWelcomeMessage, { connection: redisConnection })
    }

    private async sendWelcomeMessage(job: Job<SendWelcomeEmailJob, any, string>) {
        try {
            console.log(`${ DateTime.now().toISO() } - JOB sendWelcomeMessage`)
            const { userName, userEmail } = job.data
            await EmailSender.Send({
                subject: "Bem Vindo!",
                text: `Olá ${ userName }, você acabou de criar uma conta no Morfeus!\nSeja bem vindo!`,
                to: userEmail,
            })
        }
        catch (ex) {
            console.log(`Erro em sendWelcomeMessage:\m ${ ex.message }`)
        }
    }
}

export default UserWorkers