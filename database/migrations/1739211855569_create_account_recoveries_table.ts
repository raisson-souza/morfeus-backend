import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'account_recoveries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('code').notNullable()
      table.boolean('validated').defaultTo(false).notNullable()
      table.boolean('expired').defaultTo(false).notNullable()
      table.integer('user_referenced').notNullable()
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
      table.timestamp('updated_at')
      table.timestamp('expires_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}