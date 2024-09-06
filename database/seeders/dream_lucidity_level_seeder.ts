import DreamLucidityLevel from '#models/dream_lucidity_level'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    DreamLucidityLevel.createMany([
      { description: "Não lúcido" },
      { description: "Parcialmente lúcido" },
      { description: "Lúcido" },
      { description: "Indefinido" },
    ])
  }
}