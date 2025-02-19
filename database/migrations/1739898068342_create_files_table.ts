import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('file_name').notNullable()
      table.boolean('is_same_origin_import').notNullable()
      table.string('dreams_path').nullable()
      table.dateTime('expires_at').notNullable()
      table.boolean('finished').notNullable()
      table.boolean('file_deleted').notNullable().defaultTo(false)
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery).notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}