import DreamDuration from '#models/dream_duration'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    DreamDuration.createMany([
      { description: "Instantâneo" },
      { description: "Curto" },
      { description: "Médio" },
      { description: "Longo" },
    ])
  }
}