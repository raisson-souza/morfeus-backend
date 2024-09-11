import { UserInput, UserOutput } from "../types/userTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import User from "#models/user"
import UserServiceProps from "./types/user_service_props.js"

export default class UserService implements UserServiceProps {
    async Get(id: number) {
        return await User.find(id)
    }

    async Create(user: UserInput) : Promise<void> {
        await db.transaction(async (trx) => {
            await User.create(user, { client: trx })
        })
    }

    async Update(user: UserOutput) : Promise<void> {
        const userFound = await this.Get(user.id)
        if (!userFound) throw new CustomException(404, "Usuário não encontrado.")
        await db.transaction(async (trx) => {
            await User.updateOrCreate({ id: user.id }, user, { client: trx })
        })
    }

    async List() {
        // TODO: retornar ordenado por ID
        return await User.all()
    }
}