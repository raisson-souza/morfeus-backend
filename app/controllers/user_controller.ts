import { createUserValidator, loginValidator, updateUserValidator } from '#validators/user'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { LoginResponse } from '../types/loginTypes.js'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { paginationValidator } from '#validators/system'
import CustomException from '#exceptions/custom_exception'
import ResponseSender from '../functions/core/ResponseMessage.js'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserService from '#services/user_service'

@inject()
export default class UserController {
    constructor(protected userService : UserService) { }

    async create({ request, response }: HttpContext) : Promise<void> {
        try {
            const user = await request.validateUsing(createUserValidator)
            await this.userService.Create(user)
            ResponseSender<string>({ response, data: "Usuário criado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async update({ request, response, auth }: HttpContext) : Promise<void> {
        try {
            const user = await request.validateUsing(updateUserValidator)
            await this.userService.Update({
                fullName: user.fullName,
                email: user.email,
                password: user.password,
                id: auth.user!.id
            })
            ResponseSender<string>({ response, data: "Usuário atualizado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async get({ params, response }: HttpContext) : Promise<void> {
        try {
            const { id } = params
            const user = await this.userService.Get(Number.parseInt(id ?? 0))
            if (!user) throw new CustomException(404, "Usuário não encontrado.")
            ResponseSender<User>({ response, data: user })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async list({ request, response }: HttpContext) : Promise<void> {
        try {
            const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
            const usersList = await this.userService.List({ page, limit, orderBy, orderByDirection: orderByDirection as any })
            ResponseSender<ModelPaginatorContract<User>>({ response, data: usersList })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async delete({ params, response }: HttpContext) : Promise<void> {
        try {
            const { id } = params
            await this.userService.Delete(id)
            ResponseSender<string>({ response, data: "Usuário deletado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async login({ request, response }: HttpContext) : Promise<void> {
        try {
            const { email, password } = await request.validateUsing(loginValidator)
            const token = await this.userService.Login(email, password)
            const loginResponse: LoginResponse = {
                token: token.value?.release() ?? "",
                expirationDateMilis: DateTime.fromJSDate(token.expiresAt ?? new Date()).toUnixInteger()
            }
            ResponseSender<LoginResponse>({ response, data: loginResponse })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }
}