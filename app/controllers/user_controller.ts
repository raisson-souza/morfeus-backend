import { createUserValidator, updateUserValidator } from '#validators/user'
import { inject } from '@adonisjs/core'
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

    async update({ request, response }: HttpContext) : Promise<void> {
        const user = await request.validateUsing(updateUserValidator)
        await this.userService.Update(user)
        response.status(201).json("Usuário atualizado com sucesso.")
    }

    async get({ params }: HttpContext) : Promise<User | null> {
        const { id } = params
        const user = await this.userService.Get(Number.parseInt(id ?? 0))
        if (!user) throw new CustomException(404, "Usuário não encontrado.")
        return user!
    }

    async list() : Promise<User[]> {
        return await this.userService.List()
    }
}