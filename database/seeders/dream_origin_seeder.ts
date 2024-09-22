import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DreamOrigin from '#models/dream_origin'

export default class extends BaseSeeder {
  async run() {
    DreamOrigin.createMany([
      { description: "Completo" },
      { description: "Rápido" },
      { description: "Importado" },
    ])
  }
}