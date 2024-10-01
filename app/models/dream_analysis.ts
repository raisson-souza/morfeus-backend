import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class DreamAnalysis extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

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

  /** Ponto de vista de sonho de maior ocorrência */
  @column()
  declare mostPointOfViewOccurence: string

  /** Clima de sonho de maior ocorrência */
  @column()
  declare mostClimateOccurence: string

  /** Horário de sonho de maior ocorrência */
  @column()
  declare mostHourOccurence: string

  /** Duração aparente de sonho de maior ocorrência */
  @column()
  declare mostDurationOccurence: string

  /** Nível de lucidez de sonho de maior ocorrência */
  @column()
  declare mostLucidityLevelOccurence: string

  /** Tipo de sonho de maior ocorrência */
  @column()
  declare mostDreamTypeOccurence: string

  /** Nível de realidade de sonho de maior ocorrência */
  @column()
  declare mostRealityLevelOccurenceOccurence: string

  /** Média de sonho erótico */
  @column()
  declare eroticDreamsAverage: number

  /** Média de tag de sonho por sonho */
  @column()
  declare tagPerDreamAverage: number

  /** Título do sonho de maior texto (descrição) */
  @column()
  declare longestDreamTitle: string

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** Usuário */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}