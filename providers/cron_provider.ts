import type { ApplicationService } from '@adonisjs/core/types'
import importDataQueue from '../app/jobs/importDataQueue.js'

export default class CronProvider {
  constructor(protected app: ApplicationService) {}

  register() {}

  async boot() {}

  async start() {
    setInterval(async () => {
      await importDataQueue.clearImportFiles({})
    }, 1000 * 60 * 60 * 24 * 3) // 3 dias
  }

  async ready() {}

  async shutdown() {}
}