import { CreateSimpleSleepProps, GetSimpleSleepProps, ListSleepsByUserProps, SleepCreationInput, SleepInput, sleepInputModel, SleepOutput } from "../types/sleepTypes.js"
import { DateTime } from "luxon"
import { DreamTagInput } from "../types/DreamTagTypes.js"
import { Pagination } from "../types/pagiation.js"
import { TagInput } from "../types/TagTypes.js"
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import DreamTag from "#models/dream_tag"
import Sleep from "#models/sleep"
import SleepServiceProps from "./types/sleep_service_props.js"
import Tag from "#models/tag"
import User from "#models/user"

export default class SleepService implements SleepServiceProps {
    async Create(sleep: SleepCreationInput, validate = true) : Promise<Sleep> {
        const userExists = await User.find(sleep.userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente para a criação do sono.")

        if (sleep.dreams.length > 3) throw new CustomException(400, "Apenas 3 sonhos podem ser cadastrados durante o cadastro de um sono.")

        return await db.transaction(async (trx) => {
            if (validate) await this.Validate(sleep)
            const sleepModel: SleepInput = {
                userId: sleep.userId,
                date: sleep.date,
                sleepTime: sleep.sleepTime,
                sleepStart: sleep.sleepStart,
                sleepEnd: sleep.sleepEnd,
                wakeUpHumor: sleep.wakeUpHumor,
                layDownHumor: sleep.layDownHumor,
                biologicalOccurences: sleep.biologicalOccurences,
            }
            const newSleep = await Sleep.create(sleepModel, { client: trx })

            // Se há sonhos no sono criado, serão criados também
            if (sleep.dreams.length > 0) {
                // ID do sono é atribuido a todos os sonhos a serem criados
                sleep.dreams.map((_, i) => { sleep.dreams[i].sleepId = newSleep.id })

                for (const dream of sleep.dreams) {
                    // Tags do sonho são extraidas do modelo para a criação correta do sonho
                    const { ["tags"]: dreamTags, ...newDreamModel } = dream
                    const newDream = await Dream.create(newDreamModel, { client: trx })

                    // Se existem tags nesse sonho, serão criadas
                    if (dreamTags.length > 0) await this.CreateTags(dreamTags, newDream.id, trx)
                }
            }

            return newSleep
        })
    }

    async Update(sleep: SleepOutput, validate = true) : Promise<Sleep> {
        const foundUser = await this.Get(sleep.id)
        if (!foundUser) throw new CustomException(404, "Sono não encontrado.")

        return await db.transaction(async (trx) => {
            if (validate) await this.Validate(sleep)
            return await Sleep.updateOrCreate({ id: sleep.id }, sleep, { client: trx })
        })
    }

    async Validate(sleep: SleepInput): Promise<void> {
        const sameDateSleep = await Sleep.findBy('date', sleep.date)
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

    async ListByUser(date: DateTime, userId: number): Promise<ListSleepsByUserProps[]> {
        const userExists = await User.find(userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente.")

        if (DateTime.now().month < date.month)
            throw new CustomException(400, "A data de listagem não pode ser maior que a data atual.")

        const listSleepsByUserProps: ListSleepsByUserProps[] = await db.query()
            .from('sleeps')
            .innerJoin('users', 'users.id', 'sleeps.user_id')
            .innerJoin('dreams', 'dreams.sleep_id', 'sleeps.id')
            .where(query => {
                query.where('users.id', userId)
                query.whereRaw('EXTRACT(YEAR FROM sleeps.date) = ?', [ date.year ])
                query.andWhereRaw('EXTRACT(MONTH FROM sleeps.date) = ?', [ date.month ])
            })
            .select('sleeps.id', 'sleeps.date', 'sleeps.sleep_time', 'sleeps.wake_up_humor', 'sleeps.lay_down_humor', 'sleeps.biological_occurences')
            .count('dreams.sleep_id', 'dreams_quantity')
            .groupBy('sleeps.id')
            .then(result => {
                return result.map(sleep => {
                    return {
                        date: sleep["date"],
                        hoursSlept: sleep["sleep_time"],
                        wakeUpHumor: sleep["wake_up_humor"],
                        layDownHumor: sleep["lay_down_humor"],
                        biologicalOccurrences: sleep["biological_occurences"],
                        dreamsQuantity: Number.parseInt(sleep["dreams_quantity"]),
                    } as ListSleepsByUserProps
                })
            })

        return listSleepsByUserProps
    }

    async CreateSimpleSleep(simpleSleep: CreateSimpleSleepProps): Promise<void> {
        const {
            sleepStart,
            sleepEnd,
            date,
            userId
        } = simpleSleep

        if (!await this.AskSimpleSleep(userId, date.toJSDate()))
            throw new CustomException(500, "Este sono simples não pode ser criado ou editado pois um sono real já foi cadastrado na mesma data.")

        let sleepTime: number | undefined = undefined
        const dateYesterday = date.minus(86400000)
        const sleep = await Sleep.findBy("date", dateYesterday.toJSDate())

        if (sleepStart && sleepEnd) {
            if (sleepStart > sleepEnd)
                throw new CustomException(400, "O horário de acordar não pode ser anterior ao horário de dormir.")
            sleepTime = sleepEnd.diff(sleepStart, "hours").hours
        }
        else if (sleepStart && sleep) {
            if (sleep.sleepEnd) sleepTime = sleep.sleepEnd.diff(sleepStart, "hours").hours
        }
        else if (sleepEnd && sleep) {
            if (sleep.sleepStart) sleepTime = sleepEnd.diff(sleep.sleepStart, "hours").hours
        }

        const sleepModel: SleepInput = {
            ...sleepInputModel,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
            sleepTime: sleepTime,
            userId: userId,
            date: dateYesterday,
        }

        if (sleep) { await Sleep.updateOrCreate({ id: sleep.id }, sleepModel) }
        else { await Sleep.create(sleepModel) }
    }

    async AskSimpleSleep(userId: number, date?: Date): Promise<boolean> {
        const dateYesterday = DateTime.fromJSDate(date ?? new Date()).minus(86400000)
        const sleep = await Sleep.query()
            .where("date", dateYesterday.toJSDate())
            .andWhere("user_id", userId)
            .first()

        if (!sleep) return true
        if (sleep.sleepStart && sleep.sleepEnd) return false
        else return true
    }

    async GetSimpleSleep(userId: number, date?: Date): Promise<GetSimpleSleepProps> {
        const dateYesterday = DateTime.fromJSDate(date ?? new Date()).minus(86400000)
        const sleep = await Sleep.query()
            .where("date", dateYesterday.toJSDate())
            .andWhere("user_id", userId)
            .first()

        if (!sleep) throw new CustomException(404, "Sono simples não encontrado.")

        return {
            sleepEnd: sleep.sleepEnd,
            sleepStart: sleep.sleepStart,
        }
    }

    /**
     * Método replicado de DreamService para evitar recursão de injeção de dependência.
     */
    private async CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
        if (tags.length === 0) return

        for (const tag of tags) {
            let tagId: null | number = null
            await Tag.findBy('title', tag.toLowerCase(), { client: trx })
                .then(result => { if (result) tagId = result.id})

            if (!tagId) {
                const tagModel: TagInput = { title: tag.toLowerCase() }
                const newTag = await Tag.create(tagModel, { client: trx })
                tagId = newTag.id
            }

            const isTagAttached = await DreamTag
                .query({ client: trx })
                .where('tag_id', tagId)
                .andWhere('dream_id', dreamId)
                .select('id')
                .then(tagsAttached => tagsAttached.length > 0)

            if (!isTagAttached) {
                const dreamTagModel: DreamTagInput = {
                    dreamId: dreamId,
                    tagId: tagId
                }
                await DreamTag.create(dreamTagModel, { client: trx })
            }
        }
    }
}