import User from "#models/user"
import db from "@adonisjs/lucid/services/db"
import { UserServiceProps } from "./types/user_service_props.js"

const UserService : UserServiceProps = {
    Create: async (user: any) : Promise<void> => {
        await db.transaction(async (trx) => {
            await User.create(user, { client: trx })
        })
    },

    Update: async (user: any) : Promise<void> => {
        // const userFound = await UserService.Get(user.id)
        // if (!userFound) {
        //     throw new NotFoundException("Usuário não encontrado.", { status: 404, code: 'E_NOT_FOUND' })
        // }
        await db.transaction(async (trx) => {
            await User.updateOrCreate({ id: user.id }, user, { client: trx })
        })
    },

    Get: async (id: number) => {
        return await User.find(id)
    },

    List: async () => {
        return await User.all()
    }
}

export default UserService