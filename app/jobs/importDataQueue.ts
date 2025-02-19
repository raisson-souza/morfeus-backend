import { ImportDataJob } from './types/importDataTypes.js'
import { Queue } from 'bullmq'
import redisConnection from '#config/queue'

class ImportDataQueue {
    private importDataQueue: Queue<any, any, string, ImportDataJob>

    constructor() {
        this.importDataQueue = new Queue<any, any, string, ImportDataJob>('importData', { connection: redisConnection })
    }

    async importData(payload: ImportDataJob) {
        return await this.importDataQueue.add(
            "importData",
            payload,
            {
                attempts: 1,
                removeOnComplete: true,
                removeOnFail: true,
            }
        )
    }
}

export default new ImportDataQueue()