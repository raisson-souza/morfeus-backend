import { createUserValidator, exportUserDataValidator, finishAccountRecoveryValidator, loginValidator, updateUserValidator } from '#validators/user'
import { DateTime } from 'luxon'
import { ExportUserData } from '../types/userTypes.js'
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
                expirationDateMilis: DateTime.fromJSDate(token.expiresAt ?? new Date()).toUnixInteger(),
                userId: Number.parseInt(token.tokenableId.toString()),
            }
            ResponseSender<LoginResponse>({ response, data: loginResponse })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async dataDeletion({ response, auth }: HttpContext) : Promise<void> {
        try {
            const msg = await this.userService.DataDeletion(auth.user!.id)
            ResponseSender<string>({ response, data: msg })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async createAccountRecovery({ response, params }: HttpContext) : Promise<void> {
        try {
            const { email } = params
            await this.userService.CreateAccountRecovery(email)
            ResponseSender<string>({ response, data: "Recuperação de conta criada com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async checkAccountRecovery({ response, params }: HttpContext) : Promise<void> {
        try {
            const { code } = params
            const msg = await this.userService.CheckAccountRecovery(code)
            ResponseSender<string>({ response, data: msg })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async finishAccountRecovery({ request, response }: HttpContext) : Promise<void> {
        try {
            const { code, email, password } = await request.validateUsing(finishAccountRecoveryValidator)
            const msg = await this.userService.FinishAccountRecovery({
                email: email,
                password: password,
                code: code,
            })
            ResponseSender<string>({ response, data: msg })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async exportUserData({ request, response, auth }: HttpContext) : Promise<void> {
        try {
            const { startDate, endDate } = await request.validateUsing(exportUserDataValidator)
            const data = await this.userService.ExportUserData(auth.user!.id, DateTime.fromJSDate(startDate) as DateTime<true>, DateTime.fromJSDate(endDate) as DateTime<true>)
            ResponseSender<ExportUserData>({ response, data: data })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }
}