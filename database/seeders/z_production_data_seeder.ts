import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  static environment = ["staging", "production"]

  async run() {
    await User.create({
      fullName: 'Administrador',
      email: 'morfeus@email.com',
      password: 'morfeus',
    })
  }
}