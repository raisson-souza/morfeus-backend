import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DreamPointOfView extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare description: string
}