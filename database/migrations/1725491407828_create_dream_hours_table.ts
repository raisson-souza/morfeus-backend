import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dream_hours'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string("description").notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}