import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Dream from './dream.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { BiologicalOccurencesType } from '../types/biologicalOccurences.js'
import type { SleepHumorType } from '../types/sleepHumor.js'
import User from './user.js'

export default class Sleep extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /** Usuário do sono */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  get userId() { return this.user.id }

  /** Data do sono */
  @column.date()
  declare date: DateTime

  /** Tempo de sono */
  @column()
  declare sleepTime: number

  /** Inicio do sono */
  @column.date()
  declare sleepStart?: DateTime

  /** Fim do sono */
  @column.date()
  declare sleepEnd?: DateTime

  /** Humor ao acordar */
  @column()
  declare wakeUpHumor: SleepHumorType

  /** Humor ao dormir */
  @column()
  declare layDownHumor: SleepHumorType

  /** Ocorrências biológicas do sono */
  @column()
  declare biologicalOccurences: BiologicalOccurencesType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** Sonhos do sono */
  @hasMany(() => Dream)
  declare sleep: HasMany<typeof Dream>
}