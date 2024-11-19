import { BaseModel, beforeUpdate, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class DreamAnalysis extends BaseModel {
  public static table = 'dream_analysis'

  @column({ isPrimary: true })
  declare id: number

  /** Mês */
  @column()
  declare month: number

  /** Mês */
  @column()
  declare year: number

  /** Ponto de vista de sonho de maior ocorrência */
  @column()
  declare mostPointOfViewOccurence: string | null

  /** Clima de sonho de maior ocorrência */
  @column()
  declare mostClimateOccurence: string | null

  /** Horário de sonho de maior ocorrência */
  @column()
  declare mostHourOccurence: string | null

  /** Duração aparente de sonho de maior ocorrência */
  @column()
  declare mostDurationOccurence: string | null

  /** Nível de lucidez de sonho de maior ocorrência */
  @column()
  declare mostLucidityLevelOccurence: string | null

  /** Tipo de sonho de maior ocorrência */
  @column()
  declare mostDreamTypeOccurence: string | null

  /** Nível de realidade de sonho de maior ocorrência */
  @column()
  declare mostRealityLevelOccurenceOccurence: string | null

  /** Média de sonho erótico */
  @column()
  declare eroticDreamsAverage: number

  /** Média de tag de sonho por sonho */
  @column()
  declare tagPerDreamAverage: number

  /** Título do sonho de maior texto (descrição) */
  @column()
  declare longestDreamTitle: string

  @column.dateTime()
  declare updatedAt: DateTime

  /** Usuário */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare userId: number

  @beforeUpdate()
  static async update(dreamAnalysis: DreamAnalysis) {
    dreamAnalysis.updatedAt = DateTime.now()
  }
}