import { AccessToken } from "@adonisjs/auth/access_tokens"
import { Exception } from "@adonisjs/core/exceptions"
import { Pagination } from "../types/pagiation.js"
import { UserInput, UserOutput } from "../types/userTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import User from "#models/user"
import UserServiceProps from "./types/user_service_props.js"

export default class UserService implements UserServiceProps {
    async Create(user: UserInput, validate = true) : Promise<User> {
        return await db.transaction(async (trx) => {
            if (validate) await this.Validate(user)
            return await User.create(user, { client: trx })
        })
    }

    async Update(user: UserOutput, _ = false) : Promise<User> {
        const userFound = await this.Get(user.id)
        if (!userFound) throw new CustomException(404, "Usuário não encontrado.")
        return await db.transaction(async (trx) => {
            const emailInUse = await User.query()
                .whereNot("id", user.id)
                .andWhere("email", user.email)
                .select("id")
                .then(result => result.length >= 1)

            if (emailInUse)
                throw new CustomException(400, "Email já em uso no sistema.")

            return await User.updateOrCreate({ id: user.id }, user, { client: trx })
        })
    }

    async Validate(user: UserInput): Promise<void> {
        const sameEmailUser = await User.query()
            .where("email", user.email)
            .first()
        if (sameEmailUser)
            throw new CustomException(400, "Email já em uso no sistema.")
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
        try {
            const user = await User.verifyCredentials(email, password)
            const token = await User.accessTokens.create(user, ["*"], { expiresIn: "1h" })
            return token
        }
        catch (ex) {
            if ((ex as Error).message === "Invalid user credentials")
                throw new CustomException(401, "Credenciais inválidas.")
            else
                throw new Exception((ex as Error).message)
        }
    }

    async DataDeletion(userId: number): Promise<string> {
        const user = await this.Get(userId)
        if (!user) throw new CustomException(404, "Usuário não encontrado.")

        await user.delete()

        return `Usuário ${ user.fullName } deletado com sucesso.`
    }
}