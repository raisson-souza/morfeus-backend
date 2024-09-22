import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DreamOrigin extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare description: string
}