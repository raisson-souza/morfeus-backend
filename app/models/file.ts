import { BaseModel, beforeUpdate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fileName: string

  @column()
  declare isSameOriginImport: boolean

  @column()
  declare dreamsPath: string | null

  @column.dateTime()
  declare expiresAt: DateTime

  @column()
  declare finished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare updatedAt: DateTime | null

  @beforeUpdate()
  static async update(file: File) {
    file.updatedAt = DateTime.now()
  }
}