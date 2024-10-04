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

  /** Data do sono */
  @column.date()
  declare date: DateTime

  /** Tempo de sono */
  @column()
  declare sleepTime: number | null

  /** Inicio do sono */
  @column.dateTime()
  declare sleepStart: DateTime | null

  /** Fim do sono */
  @column.dateTime()
  declare sleepEnd: DateTime | null

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

  /** Usuário do sono */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare userId: number

  /** Sonhos do sono */
  @hasMany(() => Dream)
  declare dreams: HasMany<typeof Dream>
}