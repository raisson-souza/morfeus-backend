import DreamPointOfView from '#models/dream_point_of_view'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    await DreamPointOfView.createMany([
      { description: "1" },
      { description: "2" },
      { description: "3" },
    ])
  }
}