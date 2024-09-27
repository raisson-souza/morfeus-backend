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
      table.integer('sleep_id').unsigned().references('id').inTable('sleeps').onDelete('CASCADE').notNullable()
      table.string('title').notNullable()
      table.string('description').notNullable()
      table.integer('dream_point_of_view_id').unsigned().references('id').inTable('dream_point_of_views').onDelete('CASCADE').notNullable()
      table.jsonb('climate').defaultTo(JSON.stringify(defaultDreamClimate)).notNullable()
      table.integer('dream_hour_id').unsigned().references('id').inTable('dream_hours').onDelete('CASCADE').notNullable()
      table.integer('dream_duration_id').unsigned().references('id').inTable('dream_durations').onDelete('CASCADE').notNullable()
      table.integer('dream_lucidity_level_id').unsigned().references('id').inTable('dream_lucidity_levels').onDelete('CASCADE').notNullable()
      table.integer('dream_type_id').unsigned().references('id').inTable('dream_types').onDelete('CASCADE').notNullable()
      table.integer('dream_reality_level_id').unsigned().references('id').inTable('dream_reality_levels').onDelete('CASCADE').notNullable()
      table.boolean('erotic_dream').defaultTo(false)
      table.boolean('hidden_dream').defaultTo(false)
      table.string('personal_analysis')
      table.integer('dream_origin_id').unsigned().references('id').inTable('dream_origins').onDelete('CASCADE').notNullable()
      table.boolean('is_complete').defaultTo(false)
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}