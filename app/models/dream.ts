import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import DreamDuration from './dream_duration.js'
import DreamHour from './dream_hour.js'
import DreamLucidityLevel from './dream_lucidity_level.js'
import DreamPointOfView from './dream_point_of_view.js'
import DreamRealityLevel from './dream_reality_level.js'
import DreamType from './dream_type.js'
import Sleep from './sleep.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DreamClimateType } from '../types/dreamClimate.js'

export default class Dream extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /** Sono referente ao sonho */
  @belongsTo(() => Sleep)
  declare sleep: BelongsTo<typeof Sleep>

  get sleepId() { return this.sleep.id }

  /** Título do sonho */
  @column()
  declare title: string

  /** Descrição do sonho */
  @column()
  declare description: string

  /** Ponto de vista do sonho */
  @belongsTo(() => DreamPointOfView)
  declare dreamPointOfView: BelongsTo<typeof DreamPointOfView>

  get dreamPointOfViewDescription() { return this.dreamPointOfView.description }

  /** Clima do sonho */
  @column()
  declare climate: DreamClimateType

  /** Hora do sonho */
  @belongsTo(() => DreamHour)
  declare dreamHour: BelongsTo<typeof DreamHour>

  get dreamHourDescription() { return this.dreamHour.description }

  /** Duração do sonho */
  @belongsTo(() => DreamDuration)
  declare dreamDuration: BelongsTo<typeof DreamDuration>

  get dreamDurationDescription() { return this.dreamDuration.description }

  /** Lucidez do sonho */
  @belongsTo(() => DreamLucidityLevel)
  declare dreamLucidityLevel: BelongsTo<typeof DreamLucidityLevel>

  get dreamLucidityLevelDescription() { return this.dreamLucidityLevel.description }

  /** Tipo de sonho */
  @belongsTo(() => DreamType)
  declare dreamType: BelongsTo<typeof DreamType>

  get dreamTypeDescription() { return this.dreamType.description }

  /** Nível de realidade do sonho */
  @belongsTo(() => DreamRealityLevel)
  declare dreamRealityLevel: BelongsTo<typeof DreamRealityLevel>

  get dreamRealityLevelDescription() { return this.dreamRealityLevel.description }

  /** É sonho erótico */
  @column()
  declare eroticDream: boolean

  /** É sonho oculto */
  @column()
  declare hiddenDream: boolean

  /** Análise pessoal do sonho */
  @column()
  declare personalAnalysis: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}