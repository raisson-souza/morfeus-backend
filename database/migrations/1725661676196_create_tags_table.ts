import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}