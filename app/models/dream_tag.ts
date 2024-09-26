import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import Dream from './dream.js'
import Tag from './tag.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class DreamTag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /** Sonho */
  @belongsTo(() => Dream)
  declare dream: BelongsTo<typeof Dream>

  @column()
  declare dreamId: number

  /** Tag */
  @belongsTo(() => Tag)
  declare tag: BelongsTo<typeof Tag>

  @column()
  declare tagId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}