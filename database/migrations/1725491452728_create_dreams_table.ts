import { BaseSchema } from '@adonisjs/lucid/schema'
import { DreamClimateType } from '../../app/types/dreamClimate.js'

const defaultDreamClimate : DreamClimateType = {
  ameno: false,
  calor: false,
  garoa: false,
  chuva: false,
  tempestade: false,
  nevoa: false,
  neve: false,
  multiplos: false,
  outro: false,
  indefinido: true
}

export default class extends BaseSchema {
  protected tableName = 'dreams'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('sleep_id').notNullable().unsigned().references('id').inTable('sleeps').onDelete('CASCADE')
      table.string('title').notNullable()
      table.string('description').notNullable()
      table.integer('point_of_view_id').notNullable().unsigned().references('id').inTable('dream_point_of_views').onDelete('CASCADE')
      table.jsonb('climate').notNullable().defaultTo(JSON.stringify(defaultDreamClimate))
      table.integer('hour_id').notNullable().unsigned().references('id').inTable('dream_hours').onDelete('CASCADE')
      table.integer('duration_id').notNullable().unsigned().references('id').inTable('dream_durations').onDelete('CASCADE')
      table.integer('lucidity_level_id').notNullable().unsigned().references('id').inTable('dream_lucidity_levels').onDelete('CASCADE')
      table.integer('dream_type_id').notNullable().unsigned().references('id').inTable('dream_types').onDelete('CASCADE')
      table.integer('reality_level_id').notNullable().unsigned().references('id').inTable('dream_reality_levels').onDelete('CASCADE')
      table.boolean('erotic_dream').notNullable().defaultTo(false)
      table.boolean('hidden_dream').notNullable().defaultTo(false)
      table.string('personal_analysis')
      table.boolean('is_imported').defaultTo(false)
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}