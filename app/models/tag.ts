import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import DreamTag from './dream_tag.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Tag extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /** Título da tag */
  @column()
  declare title: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /** Relações dreamTag da tag */
  @hasMany(() => DreamTag)
  declare dreamTags: HasMany<typeof DreamTag>
}