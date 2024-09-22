import { Pagination } from "../types/pagiation.js"
import { SleepInput, SleepOutput } from "../types/sleepTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Sleep from "#models/sleep"
import SleepServiceProps from "./types/sleep_service_props.js"
import User from "#models/user"

export default class SleepService implements SleepServiceProps {
    async Create(sleep: SleepInput) : Promise<void> {
        await db.transaction(async (trx) => {
            const userExists = await User.find(sleep.userId, { client: trx })
            if (!userExists) throw new CustomException(404, "Usuário inexistente para a criação do sono.")

            const sameDateSleep = await Sleep.findBy('date', sleep.date, { client: trx })
            if (sameDateSleep) throw new CustomException(400, "Sono de mesma data já cadastrado.")

            if (
                (sleep.wakeUpHumor.undefinedHumor && sleep.wakeUpHumor.other) ||
                (sleep.layDownHumor.undefinedHumor && sleep.layDownHumor.other) ||
                (
                    (sleep.wakeUpHumor.undefinedHumor || sleep.wakeUpHumor.other) &&
                    (
                        sleep.wakeUpHumor.calm ||
                        sleep.wakeUpHumor.drowsiness ||
                        sleep.wakeUpHumor.tiredness ||
                        sleep.wakeUpHumor.anxiety ||
                        sleep.wakeUpHumor.happiness ||
                        sleep.wakeUpHumor.fear ||
                        sleep.wakeUpHumor.sadness
                    )
                ) ||
                (
                    (sleep.layDownHumor.undefinedHumor || sleep.layDownHumor.other) &&
                    (
                        sleep.layDownHumor.calm ||
                        sleep.layDownHumor.drowsiness ||
                        sleep.layDownHumor.tiredness ||
                        sleep.layDownHumor.anxiety ||
                        sleep.layDownHumor.happiness ||
                        sleep.layDownHumor.fear ||
                        sleep.layDownHumor.sadness
                    )
                )
            ) throw new CustomException(400, "Humor ao acordar ou ao dormir inválido.")

            await Sleep.create(sleep, { client: trx })
        })
    }

    async Update(sleep: SleepOutput) : Promise<void> {
        const foundUser = await this.Get(sleep.id)
        if (!foundUser) throw new CustomException(404, "Sono não encontrado.")

        await db.transaction(async (trx) => {
            const userExists = await User.find(sleep.userId, { client: trx })
            if (!userExists) throw new CustomException(404, "Usuário inexistente para a criação do sono.")

            const sameDateSleep = await Sleep.findBy('date', sleep.date, { client: trx })
            if (sameDateSleep) throw new CustomException(400, "Sono de mesma data já cadastrado.")

            if (
                (sleep.wakeUpHumor.undefinedHumor && sleep.wakeUpHumor.other) ||
                (sleep.layDownHumor.undefinedHumor && sleep.layDownHumor.other) ||
                (
                    (sleep.wakeUpHumor.undefinedHumor || sleep.wakeUpHumor.other) &&
                    (
                        sleep.wakeUpHumor.calm ||
                        sleep.wakeUpHumor.drowsiness ||
                        sleep.wakeUpHumor.tiredness ||
                        sleep.wakeUpHumor.anxiety ||
                        sleep.wakeUpHumor.happiness ||
                        sleep.wakeUpHumor.fear ||
                        sleep.wakeUpHumor.sadness
                    )
                ) ||
                (
                    (sleep.layDownHumor.undefinedHumor || sleep.layDownHumor.other) &&
                    (
                        sleep.layDownHumor.calm ||
                        sleep.layDownHumor.drowsiness ||
                        sleep.layDownHumor.tiredness ||
                        sleep.layDownHumor.anxiety ||
                        sleep.layDownHumor.happiness ||
                        sleep.layDownHumor.fear ||
                        sleep.layDownHumor.sadness
                    )
                )
            ) throw new CustomException(400, "Humor ao acordar ou ao dormir inválido.")

            await Sleep.updateOrCreate({ id: sleep.id }, sleep, { client: trx })
        })
    }

    async Get(id: number) {
        return await Sleep.find(id)
    }

    async Delete(id: number) {
        const sleep = await Sleep.find(id)
        if (!sleep) throw new CustomException(404, "Sono não encontrado.")
        await sleep.delete()
    }

    async List({
        page,
        limit,
        orderBy,
        orderByDirection
    }: Pagination) {
        return await Sleep.query()
            .orderBy(orderBy, orderByDirection as any)
            .paginate(page, limit)
    }

    async ListByUser(pagination: Pagination, userId: number) {
        const { page, limit, orderBy, orderByDirection } = pagination

        const userExists = await User.find(userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente para a criação do sono.")

        return await Sleep.query()
            .where('user_id', userId)
            .orderBy(orderBy, orderByDirection as any)
            .paginate(page, limit)
    }
}