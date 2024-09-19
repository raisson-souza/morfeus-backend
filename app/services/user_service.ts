import { AccessToken } from "@adonisjs/auth/access_tokens"
import { Pagination } from "../types/pagiation.js"
import { UserInput, UserOutput } from "../types/userTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import User from "#models/user"
import UserServiceProps from "./types/user_service_props.js"

export default class UserService implements UserServiceProps {
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

    async Get(id: number) {
        return await User.find(id)
    }

    async Delete(id: number) {
        const user = await User.find(id)
        if (!user) throw new CustomException(404, "Usuário não encontrado.")
        await user.delete()
    }

    async List({
        page,
        limit,
        orderBy,
        orderByDirection
    }: Pagination) {
        return await User.query()
            .orderBy(orderBy, orderByDirection as any)
            .paginate(page, limit)
    }

    async Login(email: string, password: string) : Promise<AccessToken> {
        const user = await User.verifyCredentials(email, password)
        const token = await User.accessTokens.create(user, ["*"], { expiresIn: "1h" })
        return token
    }
}