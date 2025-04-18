import { CreateSimpleSleepProps, GetSimpleSleepProps, ListSleepsByUserProps, SleepCreationInput, SleepInput, sleepInputModel, SleepOutput, SleepUpdateProps } from "../types/sleepTypes.js"
import { DateTime } from "luxon"
import { DreamTagInput } from "../types/DreamTagTypes.js"
import { Pagination } from "../types/pagiation.js"
import { SleepHumorType } from "../types/sleepHumor.js"
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
    async Create(sleep: SleepCreationInput, _ = true) : Promise<Sleep> {
        const userExists = await User.find(sleep.userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente para a criação do sono.")

        if (sleep.dreams.length > 3) throw new CustomException(400, "Apenas 3 sonhos podem ser cadastrados durante o cadastro de um sono.")

        return await db.transaction(async (trx) => {
            this.ValidateSleepTime(sleep.sleepTime)
            this.ValidateSleepPeriod(sleep.sleepStart, sleep.sleepEnd)
            this.ValidateSleepHumor(sleep.wakeUpHumor, sleep.layDownHumor)
            const isNightSleep = this.IsNightSleep(sleep.sleepStart, sleep.sleepEnd)
            const sleepDate = this.DefineSleepDate(sleep.sleepEnd, isNightSleep)
            await this.ValidateSleepCreation(sleep.userId, sleepDate, sleep.sleepStart, sleep.sleepEnd)

            const sleepModel: SleepInput = {
                userId: sleep.userId,
                date: sleepDate,
                sleepTime: sleep.sleepTime,
                sleepStart: sleep.sleepStart,
                sleepEnd: sleep.sleepEnd,
                isNightSleep: isNightSleep,
                wakeUpHumor: sleep.wakeUpHumor,
                layDownHumor: sleep.layDownHumor,
                biologicalOccurences: sleep.biologicalOccurences,
            }
            const newSleep = await Sleep.create(sleepModel, { client: trx })

            // Se há sonhos no sono criado, serão criados também
            if (sleep.dreams.length > 0) {
                if (sleep.dreams.length >= 30)
                    throw new CustomException(400, "Limite de sonhos por ciclo de sono excedido.")

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

    async Update(sleep: SleepUpdateProps, _ = false) : Promise<Sleep> {
        const foundUser = await this.Get(sleep.id)
        if (!foundUser) throw new CustomException(404, "Sono não encontrado.")

        this.ValidateSleepTime(sleep.sleepTime)
        this.ValidateSleepPeriod(sleep.sleepStart, sleep.sleepEnd)
        this.ValidateSleepHumor(sleep.wakeUpHumor, sleep.layDownHumor)
        const isNightSleep = this.IsNightSleep(sleep.sleepStart, sleep.sleepEnd)
        const sleepDate = this.DefineSleepDate(sleep.sleepEnd, isNightSleep)
        await this.ValidateSleepUpdate(sleep.userId, sleepDate, sleep.id, sleep.sleepStart, sleep.sleepEnd)

        const sleepModel: SleepOutput = {
            id: sleep.id,
            userId: sleep.userId,
            date: sleepDate,
            sleepTime: sleep.sleepTime,
            sleepStart: sleep.sleepStart,
            sleepEnd: sleep.sleepEnd,
            isNightSleep: isNightSleep,
            wakeUpHumor: sleep.wakeUpHumor,
            layDownHumor: sleep.layDownHumor,
            biologicalOccurences: sleep.biologicalOccurences,
        }

        return await db.transaction(async (trx) => {
            return await Sleep.updateOrCreate({ id: sleep.id }, sleepModel, { client: trx })
        })
    }

    async Validate(_: SleepCreationInput): Promise<void> {
        // Regra de negócio removida devido a nova regra de sono noturno e diurno
        // const sameDateSleep = await Sleep.findBy('date', sleep.date)
        // if (sameDateSleep) throw new CustomException(400, "Sono de mesma data já cadastrado.")
    }

    private ValidateSleepHumor(wakeUpHumor: SleepHumorType, layDownHumor: SleepHumorType) {
        if (
            (wakeUpHumor.undefinedHumor && wakeUpHumor.other) ||
            (layDownHumor.undefinedHumor && layDownHumor.other) ||
            (
                (wakeUpHumor.undefinedHumor || wakeUpHumor.other) &&
                (
                    wakeUpHumor.calm ||
                    wakeUpHumor.drowsiness ||
                    wakeUpHumor.tiredness ||
                    wakeUpHumor.anxiety ||
                    wakeUpHumor.happiness ||
                    wakeUpHumor.fear ||
                    wakeUpHumor.sadness
                )
            ) ||
            (
                (layDownHumor.undefinedHumor || layDownHumor.other) &&
                (
                    layDownHumor.calm ||
                    layDownHumor.drowsiness ||
                    layDownHumor.tiredness ||
                    layDownHumor.anxiety ||
                    layDownHumor.happiness ||
                    layDownHumor.fear ||
                    layDownHumor.sadness
                )
            )
        ) throw new CustomException(400, "Humor ao acordar ou ao dormir inválido.")
    }

    private ValidateSleepTime(sleepTime: number): void {
        if (sleepTime > 24) throw new CustomException(400, "Tempo de sono inválido.")
    }

    private ValidateSleepPeriod(sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>) {
        if (sleepStart.toMillis() > sleepEnd.toMillis())
            throw new CustomException(400, "O horário de dormir não pode ser depois de acordar.")
    }

    IsNightSleep(sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>): boolean {
        let isNightSleep = false
        const isSameDay = sleepStart.day === sleepEnd.day
        if (isSameDay) {
            if (sleepStart.hour >= 0 && sleepEnd.hour <= 12) {
                // Periodo da madrugada e matutino
                isNightSleep = true
            }
        }
        else {
            isNightSleep = true
        }
        return isNightSleep
    }

    DefineSleepDate(sleepEnd: DateTime<boolean>, isNightSleep: boolean): DateTime<boolean> {
        return isNightSleep
            ? sleepEnd.minus({ day: 1 })
            : sleepEnd
    }

    async ValidateSleepCreation(userId: number, sleepDate: DateTime<boolean>, sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>) {
        const now = DateTime.now()
        if (sleepEnd.toMillis() > now.toMillis())
            throw new CustomException(400, "Não é possível cadastrar um sono futuro.")
        const samePeriodSleeps = await this.GetConflictingSleepIntervals(userId, sleepDate, sleepStart, sleepEnd)
        if (samePeriodSleeps.length > 0)
            throw new CustomException(400, "Sono de mesmo período já cadastrado.")
    }

    private async ValidateSleepUpdate(userId: number, sleepDate: DateTime<boolean>, sleepId: number, sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>) {
        const now = DateTime.now()
        if (sleepEnd.toMillis() > now.toMillis())
            throw new CustomException(400, "Não é possível cadastrar um sono futuro.")
        const samePeriodSleeps = await this.GetConflictingSleepIntervals(userId, sleepDate, sleepStart, sleepEnd)
        const sleepPeriodConflict = samePeriodSleeps.filter(sleep => sleep.id != sleepId).length > 0
        if (sleepPeriodConflict)
            throw new CustomException(400, "Sono de mesmo período já cadastrado.")
    }

    private async GetConflictingSleepIntervals(userId: number, newSleepDate: DateTime<boolean>, newSleepStart: DateTime<boolean>, newSleepEnd: DateTime<boolean>) {
        const yesterday = newSleepDate.minus({ day: 1 })
        const tomorrow = newSleepDate.plus({ day: 1 })

        const sameDateSleeps = await Sleep.query()
            .where("user_id", userId)
            .andWhereRaw(`EXTRACT(YEAR FROM sleeps.date) = ${ newSleepDate.year }`)
            .andWhereRaw(`EXTRACT(MONTH FROM sleeps.date) = ${ newSleepDate.month }`)
            .andWhere(query => {
                query
                    .whereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ newSleepDate.day }`)
                    .orWhereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ yesterday.day }`)
                    .orWhereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ tomorrow.day }`)
            })

        const sleepPeriodsConflicts: Sleep[] = []

        sameDateSleeps.map(sameDateSleep => {
            if (this.CheckSleepPeriod(sameDateSleep, newSleepStart.toMillis(), newSleepEnd.toMillis()))
                sleepPeriodsConflicts.push(sameDateSleep)
        })

        return sleepPeriodsConflicts
    }

    CheckSleepPeriod(sleep: Sleep, sleepStartEpoch: number, sleepEndEpoch: number): boolean {
        const dbSleepStartEpoch = sleep.sleepStart.toMillis()
        const dbSleepEndEpoch = sleep.sleepEnd.toMillis()

        return (
            // o novo sono inicia antes do inicio sono e termina antes do fim
            (
                dbSleepStartEpoch >= sleepStartEpoch &&
                dbSleepStartEpoch <= sleepEndEpoch &&
                dbSleepEndEpoch >= sleepEndEpoch
            ) ||
            // o novo sono inicia após o inicio do sono e termina antes do fim
            (
                dbSleepStartEpoch >= sleepStartEpoch &&
                dbSleepEndEpoch <= sleepEndEpoch
            ) ||
            // o novo sono inicia antes do inicio do sono e termina após o fim
            (
                dbSleepStartEpoch <= sleepStartEpoch &&
                dbSleepEndEpoch >= sleepEndEpoch
            ) ||
            // o novo sono inicia após o inicio do sono e termina após o fim
            (
                dbSleepStartEpoch <= sleepStartEpoch &&
                dbSleepEndEpoch >= sleepStartEpoch &&
                dbSleepEndEpoch <= sleepEndEpoch
            )
        )
    }
    async Get(id: number) {
        return await Sleep.find(id)
    }

    async Delete(id: number) {
        const sleep = await Sleep.query()
            .preload("dreams")
            .where("id", id)
            .first()
        if (!sleep)
            throw new CustomException(404, "Sono não encontrado.")
        if (sleep.dreams.length > 0)
            throw new CustomException(500, "Existem sonhos cadastrados nesta noite de sono, para excluir este sono edite a data dos sonhos ou os exclua individualmente.")
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

        const listSleepsByUserProps: ListSleepsByUserProps[] = await db.query()
            .from('sleeps')
            .fullOuterJoin('users', 'users.id', 'sleeps.user_id')
            .fullOuterJoin('dreams', 'dreams.sleep_id', 'sleeps.id')
            .where(query => {
                query.where('users.id', userId)
                query.whereRaw('EXTRACT(YEAR FROM sleeps.date) = ?', [ date.year ])
                query.andWhereRaw('EXTRACT(MONTH FROM sleeps.date) = ?', [ date.month ])
            })
            .select('sleeps.id', 'sleeps.date', 'sleeps.sleep_time', 'sleeps.sleep_start', 'sleeps.sleep_end', 'sleeps.is_night_sleep')
            .groupBy('sleeps.id')
            .orderBy('sleeps.id', "asc")
            .then(result => {
                return result.map(sleep => {
                    return {
                        id: sleep["id"],
                        date: sleep["date"],
                        sleepTime: sleep["sleep_time"],
                        sleepStart: sleep["sleep_start"],
                        sleepEnd: sleep["sleep_end"],
                        isNightSleep: sleep["is_night_sleep"],
                    } as ListSleepsByUserProps
                })
            })

        return listSleepsByUserProps
    }

    async CreateSimpleSleep(simpleSleep: CreateSimpleSleepProps): Promise<void> {
        const {
            sleepStart,
            sleepEnd,
            userId,
            sleepTime,
            sleepId,
        } = simpleSleep

        this.ValidateSleepTime(sleepTime)
        this.ValidateSleepPeriod(sleepStart, sleepEnd)
        const isNightSleep = this.IsNightSleep(sleepStart, sleepEnd)
        const sleepDate = this.DefineSleepDate(sleepEnd, isNightSleep)

        const sleepModel: SleepInput = {
            ...sleepInputModel,
            userId: userId,
            date: sleepDate,
            sleepTime: sleepTime,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
            isNightSleep: isNightSleep,
        }

        let isEditing = false

        if (sleepId != undefined) {
            if (await Sleep.find(sleepId)) {
                isEditing = true
            }
        }

        if (isEditing) {
            await this.ValidateSleepUpdate(userId, sleepDate, sleepId!, sleepStart, sleepEnd)
            await Sleep.updateOrCreate({ id: sleepId! }, sleepModel)
        }
        else {
            await this.ValidateSleepCreation(userId, sleepDate, sleepStart, sleepEnd)
            await Sleep.create(sleepModel)
        }
    }

    async GetSimpleSleep(userId: number): Promise<GetSimpleSleepProps> {
        const lastSleep = await Sleep.query()
            .andWhere("user_id", userId)
            .orderBy("id", "desc")
            .first()

        if (!lastSleep) throw new CustomException(404, "Sono simples não encontrado.")

        return {
            sleepEnd: lastSleep.sleepEnd,
            sleepStart: lastSleep.sleepStart,
            sleepId: lastSleep.id,
        }
    }

    async GetUserSleep(sleepId: number, userId: number): Promise<Sleep | null> {
        const sleep = await this.Get(sleepId)
        if (sleep) {
            if (sleep.userId != userId)
                throw new CustomException(403, "Você não pode visualizar este ciclo de sono pois ele não pertence a você.")
        }
        return sleep
    }

    /**
     * Método replicado de DreamService para evitar recursão de injeção de dependência.
     */
    private async CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
        if (tags.length === 0) return

        for (const tag of tags) {
            let tagId: null | number = null
            await Tag.findBy('title', tag.toUpperCase(), { client: trx })
                .then(result => { if (result) tagId = result.id})

            if (!tagId) {
                const tagModel: TagInput = { title: tag.toUpperCase() }
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

    async ListSleepsForDreamCreation(userId: number, pageNumber: number) {
        return await Sleep.query()
            .where("user_id", userId)
            .select("id", "date", "sleep_start", "sleep_end")
            .orderBy("id", "desc")
            .paginate(pageNumber, 5)
    }
}