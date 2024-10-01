import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import DreamDuration from './dream_duration.js'
import DreamHour from './dream_hour.js'
import DreamLucidityLevel from './dream_lucidity_level.js'
import DreamOrigin from './dream_origin.js'
import DreamPointOfView from './dream_point_of_view.js'
import DreamRealityLevel from './dream_reality_level.js'
import DreamTag from './dream_tag.js'
import DreamType from './dream_type.js'
import Sleep from './sleep.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DreamClimateType } from '../types/dreamClimate.js'

export default class Dream extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /** Título do sonho */
  @column()
  declare title: string

  /** Descrição do sonho */
  @column()
  declare description: string

  /** Clima do sonho */
  @column()
  declare climate: DreamClimateType

  /** É sonho erótico */
  @column()
  declare eroticDream: boolean

  /** É sonho oculto */
  @column()
  declare hiddenDream: boolean

  /** Análise pessoal do sonho */
  @column()
  declare personalAnalysis: string

  /** É sonho completo */
  @column()
  declare isComplete: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /** Origem do sonho */
  @belongsTo(() => DreamOrigin)
  declare dreamOrigin: BelongsTo<typeof DreamOrigin>

  @column()
  declare dreamOriginId: number

  /** Ponto de vista do sonho */
  @belongsTo(() => DreamPointOfView)
  declare dreamPointOfView: BelongsTo<typeof DreamPointOfView>

  @column()
  declare dreamPointOfViewId: number

  /** Hora do sonho */
  @belongsTo(() => DreamHour)
  declare dreamHour: BelongsTo<typeof DreamHour>

  @column()
  declare dreamHourId: number

  /** Duração do sonho */
  @belongsTo(() => DreamDuration)
  declare dreamDuration: BelongsTo<typeof DreamDuration>

  @column()
  declare dreamDurationId: number

  /** Lucidez do sonho */
  @belongsTo(() => DreamLucidityLevel)
  declare dreamLucidityLevel: BelongsTo<typeof DreamLucidityLevel>

  @column()
  declare dreamLucidityLevelId: number

  /** Tipo de sonho */
  @belongsTo(() => DreamType)
  declare dreamType: BelongsTo<typeof DreamType>

  @column()
  declare dreamTypeId: number

  /** Nível de realidade do sonho */
  @belongsTo(() => DreamRealityLevel)
  declare dreamRealityLevel: BelongsTo<typeof DreamRealityLevel>

  @column()
  declare dreamRealityLevelId: number

  /** Sono referente ao sonho */
  @belongsTo(() => Sleep)
  declare sleep: BelongsTo<typeof Sleep>

  @column()
  declare sleepId: number

  /** Relações dreamTag do sonho */
  @hasMany(() => DreamTag)
  declare dreamTags: HasMany<typeof DreamTag>
}