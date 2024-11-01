import CustomException from '#exceptions/custom_exception'
import type { Response as AdonisResponse } from '@adonisjs/core/http'

/**
 * Tipagem de resposta padrão backend
 * @param T Tipo genérico do parâmetro data
 * @param data Propriedade final de resposta da requisição
 */
type ResponseMessage<T> = {
    data: T | Error
}

/**
 * @param T Tipo genérico do parâmetro data
 * @param response Response do Adonis
 * @param data Propriedade final de resposta da requisição
 * @param isError Parâmetro que define se a respota é de erro
 */
type ResponseSenderProps<T> = {
    response: AdonisResponse,
    data: T | Error,
    status?: number
}

/**
 * Enviador da response formatada ao frontend  
 * Logger de erro
 * */
export default function ResponseSender<T>({
    response,
    data,
    status = 201,
}: ResponseSenderProps<T>): void {
    if (data instanceof CustomException) {
        response.status(data.status).json({ data: data.message } as ResponseMessage<T>)
        ErrorLogger(data.message)
    }
    else if (data instanceof Error) {
        response.status(500).json({ data: data.message } as ResponseMessage<T>)
        ErrorLogger(data.message)
    }
    else
        response.status(status).json({ data } as ResponseMessage<T>)
}

function ErrorLogger(message: string) {
    // ...
}