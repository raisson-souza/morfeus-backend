import { BaseSchema } from '@adonisjs/lucid/schema'
import { SleepHumorType } from '../../app/types/sleepHumor.js'
import { BiologicalOccurencesType } from '../../app/types/biologicalOccurences.js'

const defaultHumor : SleepHumorType = {
  undefinedHumor: true,
  calm: false,
  drowsiness: false,
  tiredness: false,
  anxiety: false,
  happiness: false,
  fear: false,
  sadness: false,
  other: false
}

const defaultBiologicalOccurences : BiologicalOccurencesType = {
  sudorese: false,
  bruxismo: false,
  apneiaDoSono: false,
  ronco: false,
  movimentosPeriódicosDosMembros: false,
  despertaresParciais: false,
  refluxoGastroesofágico: false,
  sialorréia: false,
  arritmias: false,
  mioclonia: false,
  parassonia: false,
  epistaxe: false,
  micçãoInvoluntária: false,
  evacuaçãoInvoluntária: false,
  polução: false
}

export default class extends BaseSchema {
  protected tableName = 'sleeps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.date('date').notNullable()
      table.integer('sleep_time').notNullable()
      table.date('sleep_start').notNullable()
      table.date('sleep_end').notNullable()
      table.jsonb('wake_up_humor').notNullable().defaultTo(JSON.stringify(defaultHumor))
      table.jsonb('lay_down_humor').notNullable().defaultTo(JSON.stringify(defaultHumor))
      table.jsonb('biological_occurences').notNullable().defaultTo(JSON.stringify(defaultBiologicalOccurences))
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}