import { BaseModel, beforeUpdate, column, hasMany } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import DreamAnalysis from './dream_analysis.js'
import hash from '@adonisjs/core/services/hash'
import Sleep from './sleep.js'
import SleepAnalysis from './sleep_analysis.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  /** Nome do usuário */
  @column()
  declare fullName: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime()
  declare updatedAt: DateTime | null

  /** Sonos */
  @hasMany(() => Sleep)
  declare sleeps: HasMany<typeof Sleep>

  /** Análises de sono */
  @hasMany(() => SleepAnalysis)
  declare sleepsAnalysis: HasMany<typeof SleepAnalysis>

  /** Análises de sonho */
  @hasMany(() => DreamAnalysis)
  declare dreamsAnalysis: HasMany<typeof DreamAnalysis>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @beforeUpdate()
  static async update(user: User) {
    user.updatedAt = DateTime.now()
  }
}