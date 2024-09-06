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

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  get userId() { return this.user.id }

  @column.date()
  declare date: DateTime

  @column()
  declare sleepTime: number

  @column.date()
  declare sleepStart?: DateTime

  @column.date()
  declare sleepEnd?: DateTime

  @column()
  declare wakeUpHumor: SleepHumorType

  @column()
  declare layDownHumor: SleepHumorType

  @column()
  declare biologicalOccurences: BiologicalOccurencesType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => Dream)
  declare sleep: HasMany<typeof Dream>
}