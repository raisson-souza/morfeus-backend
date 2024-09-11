import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class NotFoundException extends Exception {
  constructor(message: string) {
    super(message, { status: 404 });
  }

  // TODO: experimentar CurstomException e agrupar todos os tipos de erros e status junto
  public async handle(error: this, { response } : HttpContext) {
    return response.status(error.status).send(error.message )
  }
}