import DreamRealityLevel from '#models/dream_reality_level'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    DreamRealityLevel.createMany([
      { description: "Irreal" },
      { description: "Parcialmente real" },
      { description: "Real" },
    ])
  }
}