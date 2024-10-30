import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class SleepAnalysis extends BaseModel {
  public static table = 'sleep_analysis'

  @column({ isPrimary: true })
  declare id: number

  /** Mês */
  @column()
  declare month: number

  /** Ano */
  @column()
  declare year: number

  /** Contagem de sonhos */
  @column()
  declare dreamsCount: number

  /** Porcentagem de bom humor ao acordar */
  @column()
  declare goodWakeUpHumorPercentage: number

  /** Porcentagem de mau humor ao acordar */
  @column()
  declare badWakeUpHumorPercentage: number

  /** Porcentagem de bom humor ao dormir */
  @column()
  declare goodLayDownHumorPercentage: number

  /** Porcentagem de mau humor ao dormir */
  @column()
  declare badLayDownHumorPercentage: number

  /** Humor mais frequente ao acordar */
  @column()
  declare mostFrequentWakeUpHumor: string | null

  /** Humor menos frequente ao acordar */
  @column()
  declare leastFrequentWakeUpHumor: string | null

  /** Humor mais frequente ao dormir */
  @column()
  declare mostFrequentLayDownHumor: string | null

  /** Humor menos frequente ao dormir */
  @column()
  declare leastFrequentLayDownHumor: string | null

  /** Ocorrência biológica mais frequente */
  @column()
  declare mostFrequentBiologicalOccurence: string | null

  @column()
  declare leastFrequentBiologicalOccurence: string | null

  /** Maior noite de sono */
  @column()
  declare mostSleepDuration: number

  /** Menor noite de sono  */
  @column()
  declare leastSleepDuration: number

  /** Média de sonho por sono */
  @column()
  declare averageDreamPerSleep: number

  /** Média de duração de sono */
  @column()
  declare sleepDurationAverage: number

  /** Data de maior quantidade de sonho por noite */
  @column.date()
  declare mostDreamsPerSleepDate: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** Usuário */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare userId: number
}