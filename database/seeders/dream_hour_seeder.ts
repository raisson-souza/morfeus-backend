import DreamHour from '#models/dream_hour'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    DreamHour.createMany([
      { description: "Amanhecer" },
      { description: "Dia" },
      { description: "Anoitecer" },
      { description: "Noite" },
      { description: "Indefinido" },
      { description: "Múltiplos" },
    ])
  }
}