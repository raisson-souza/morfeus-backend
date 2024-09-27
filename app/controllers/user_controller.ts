import { createUserValidator, loginValidator, updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { paginationValidator } from '#validators/system'
import CustomException from '#exceptions/custom_exception'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserService from '#services/user_service'

@inject()
export default class UserController {
    constructor(protected userService : UserService) { }

    async create({ request, response }: HttpContext) : Promise<void> {
        const user = await request.validateUsing(createUserValidator)
        await this.userService.Create(user)
        response.status(201).json("Usuário criado com sucesso.")
    }

    async update({ request, response, auth }: HttpContext) : Promise<void> {
        const user = await request.validateUsing(updateUserValidator)
        await this.userService.Update({
            fullName: user.fullName,
            email: user.email,
            password: user.password,
            id: auth.user!.id
        })
        response.status(201).json("Usuário atualizado com sucesso.")
    }

    async get({ params }: HttpContext) : Promise<User | null> {
        const { id } = params
        const user = await this.userService.Get(Number.parseInt(id ?? 0))
        if (!user) throw new CustomException(404, "Usuário não encontrado.")
        return user!
    }

    async list({ request }: HttpContext) : Promise<ModelPaginatorContract<User>> {
        const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
        return await this.userService.List({ page, limit, orderBy, orderByDirection: orderByDirection as any })
    }

    async delete({ params }: HttpContext) : Promise<void> {
        const { id } = params
        await this.userService.Delete(id)
    }

    async login({ request }: HttpContext) : Promise<string | undefined> {
        const { email, password } = await request.validateUsing(loginValidator)
        const token = await this.userService.Login(email, password)
        return token.value?.release()
    }
}