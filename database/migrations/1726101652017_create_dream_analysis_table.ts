import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'dream_analysis'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('month').notNullable()
      table.integer('year').notNullable()
      table.string('most_point_of_view_occurence')
      table.string('most_climate_occurence')
      table.string('most_hour_occurence')
      table.string('most_duration_occurence')
      table.string('most_lucidity_level_occurence')
      table.string('most_dream_type_occurence')
      table.string('most_reality_level_occurence_occurence')
      table.decimal('erotic_dreams_average').notNullable()
      table.decimal('tag_per_dream_average').notNullable()
      table.string('longest_dream_title').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}