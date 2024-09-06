import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dream_tags'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('tag_id').notNullable().unsigned().references('id').inTable('tags').onDelete('CASCADE')
      table.integer('dream_id').notNullable().unsigned().references('id').inTable('dreams').onDelete('CASCADE')
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}