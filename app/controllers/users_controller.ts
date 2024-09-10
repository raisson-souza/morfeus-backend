import { createUserValidator, updateUserValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserService from '#services/user_service'

export default class UsersController {
    async create({ request, response }: HttpContext) : Promise<void> {
        const user = await request.validateUsing(createUserValidator)
        UserService.Create(user)
        response.status(201).json("Usuário criado com sucesso.")
    }

    async update({ request, response }: HttpContext) : Promise<void> {
        const user = await request.validateUsing(updateUserValidator)
        UserService.Update(user)
        response.status(201).json("Usuário atualizado com sucesso.")
    }

    async get({ params }: HttpContext) : Promise<User | null> {
        const { id } = params
        return await UserService.Get(Number.parseInt(id ?? 0))
    }

    async list() : Promise<User[]> {
        return await UserService.List()
    }
}