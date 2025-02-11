import { BaseModel, beforeUpdate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AccountRecovery extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare validated: boolean

  @column()
  declare expired: boolean

  @column()
  declare userReferenced: number

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare updatedAt: DateTime | null

  @beforeUpdate()
  static async update(accountRecovery: AccountRecovery) {
    accountRecovery.updatedAt = DateTime.now()
  }
}