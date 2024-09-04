import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { SleepHumorType } from '../types/sleepHumor.js'
import type { BiologicalOccurencesType } from '../types/biologicalOccurences.js'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

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
}