import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class SleepAnalysis extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** É análise mensal */
  @column()
  declare isMonthAnalysis: boolean

  /** Mês */
  @column.date()
  declare month: DateTime

  /** Início da semana */
  @column.date()
  declare weekStart: DateTime

  /** Fim da semana */
  @column.date()
  declare weekEnd: DateTime

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
  declare mostFrequentWakeUpHumor: string

  /** Humor menos frequente ao acordar */
  @column()
  declare leastFrequentWakeUpHumor: string

  /** Humor mais frequente ao dormir */
  @column()
  declare mostFrequentLayDownHumor: string

  /** Humor menos frequente ao dormir */
  @column()
  declare leastFrequentLayDownHumor: string

  /** Ocorrência biológica mais frequente */
  @column()
  declare mostFrequentBiologicalOccurence: string

  /** Média de duração de sono */
  @column()
  declare sleepDurationAverage: number

  /** Maior noite de sono */
  @column()
  declare mostSleepDuration: number

  /** Menor noite de sono  */
  @column()
  declare leastSleepDuration: number

  /** Média de sonho por sono */
  @column()
  declare averageDreamPerSleep: number

  /** Data de maior quantidade de sonho por noite */
  @column.date()
  declare mostDreamsPerSleepDate: DateTime

  /** Usuário */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}