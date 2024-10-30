import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sleep_analysis'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('month').notNullable()
      table.integer('year').notNullable()
      table.integer('dreams_count').notNullable()
      table.integer('good_wake_up_humor_percentage').notNullable()
      table.integer('bad_wake_up_humor_percentage').notNullable()
      table.integer('good_lay_down_humor_percentage').notNullable()
      table.integer('bad_lay_down_humor_percentage').notNullable()
      table.string('most_frequent_wake_up_humor')
      table.string('least_frequent_wake_up_humor')
      table.string('most_frequent_lay_down_humor')
      table.string('least_frequent_lay_down_humor')
      table.string('most_frequent_biological_occurence')
      table.string('least_frequent_biological_occurence')
      table.integer('most_sleep_duration')
      table.integer('least_sleep_duration')
      table.integer('average_dream_per_sleep').notNullable()
      table.integer('sleep_duration_average').notNullable()
      table.date('most_dreams_per_sleep_date').notNullable()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('updated_at').defaultTo(this.db.rawQuery('now()').knexQuery)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}