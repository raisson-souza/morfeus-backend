import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class CustomException extends Exception {
  constructor(code: number, message: string) {
    super(message, { status: code })
  }

  public async handle(error: this, { response } : HttpContext) {
    return response.status(error.status).send(error.message )
  }
}