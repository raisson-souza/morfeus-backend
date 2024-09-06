import DreamType from '#models/dream_type'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    DreamType.createMany([
      { description: "Sonho" },
      { description: "Pesadelo" },
      { description: "Indefinido" },
    ])
  }
}