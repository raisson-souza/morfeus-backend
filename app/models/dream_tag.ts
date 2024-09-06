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

  get dreamId() { return this.dream.id }

  /** Tag */
  @belongsTo(() => Tag)
  declare tag: BelongsTo<typeof Tag>

  get tagId() { return this.tag.id }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}