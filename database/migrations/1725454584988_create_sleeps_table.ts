import { BaseSchema } from '@adonisjs/lucid/schema'
import { BiologicalOccurencesType } from '../../app/types/biologicalOccurences.js'
import { SleepHumorType } from '../../app/types/sleepHumor.js'

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
  movimentosPeriodicosDosMembros: false,
  despertaresParciais: false,
  refluxoGastroesofagico: false,
  sialorreia: false,
  arritmias: false,
  mioclonia: false,
  parassonia: false,
  epistaxe: false,
  miccaoInvoluntaria: false,
  evacuacaoInvoluntaria: false,
  polucao: false
}

export default class extends BaseSchema {
  protected tableName = 'sleeps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.date('date').notNullable()
      table.integer('sleep_time')
      table.timestamp('sleep_start')
      table.timestamp('sleep_end')
      table.jsonb('wake_up_humor').defaultTo(JSON.stringify(defaultHumor))
      table.jsonb('lay_down_humor').defaultTo(JSON.stringify(defaultHumor))
      table.jsonb('biological_occurences').defaultTo(JSON.stringify(defaultBiologicalOccurences))
      table.timestamp('created_at').defaultTo(this.db.rawQuery('now()').knexQuery)
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}