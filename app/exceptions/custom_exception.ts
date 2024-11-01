import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'
import ResponseSender from '../functions/core/ResponseMessage.js'

export default class CustomException extends Exception {
  constructor(code: number, message: string) {
    super(message, { status: code })
  }

  public async handle(error: this, { response } : HttpContext) {
    ResponseSender<string>({ response, data: error })
  }
}