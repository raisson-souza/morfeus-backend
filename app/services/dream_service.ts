import { DateTime } from "luxon"
import { DreamCompleteInput, DreamInput, DreamOutput, DreamUncompleteInput } from "../types/dreamTypes.js"
import { inject } from "@adonisjs/core"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../types/pagiation.js"
import { SleepInput, sleepInputModel } from "../types/sleepTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import DreamServiceProps from "./types/dream_service_props.js"
import Sleep from "#models/sleep"
import SleepService from "./sleep_service.js"
import User from "#models/user"

@inject()
export default class DreamService implements DreamServiceProps {
    constructor(protected sleepService: SleepService) { }

    async Create(dream: DreamCompleteInput, validate = true) : Promise<Dream> {
        return await db.transaction(async (trx) => {
            if (dream.sleepId) {
                const sleepExists = await Sleep.find(dream.sleepId, { client: trx })
                if (!sleepExists) throw new CustomException(404, "Sono referente não encontrado.")

                if (validate) await this.Validate(dream)
                const dreamModel: DreamInput = {
                    sleepId: dream.sleepId,
                    title: dream.title,
                    description: dream.description,
                    dreamPointOfViewId: dream.dreamPointOfViewId,
                    climate: dream.climate,
                    dreamHourId: dream.dreamHourId,
                    dreamDurationId: dream.dreamDurationId,
                    dreamLucidityLevelId: dream.dreamLucidityLevelId,
                    dreamTypeId: dream.dreamTypeId,
                    dreamRealityLevelId: dream.dreamRealityLevelId,
                    eroticDream: dream.eroticDream,
                    hiddenDream: dream.hiddenDream,
                    personalAnalysis: dream.personalAnalysis,
                    dreamOriginId: dream.dreamOriginId,
                }
                return await Dream.create(dreamModel, { client: trx })
            }

            const userExists = await User.find(dream.userId, { client: trx })
            if (!userExists) throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")
            
            const _sleepInputModel: SleepInput = {
                ...sleepInputModel,
                userId: dream.userId ?? 0,
                date: dream.date ?? DateTime.now(),
            }
            await this.sleepService.Validate(_sleepInputModel)
            const sleepCreated = await Sleep.create(_sleepInputModel, { client: trx })
            dream.sleepId = sleepCreated.id

            if (validate) await this.Validate(dream)
            const dreamModel: DreamInput = {
                sleepId: dream.sleepId,
                title: dream.title,
                description: dream.description,
                dreamPointOfViewId: dream.dreamPointOfViewId,
                climate: dream.climate,
                dreamHourId: dream.dreamHourId,
                dreamDurationId: dream.dreamDurationId,
                dreamLucidityLevelId: dream.dreamLucidityLevelId,
                dreamTypeId: dream.dreamTypeId,
                dreamRealityLevelId: dream.dreamRealityLevelId,
                eroticDream: dream.eroticDream,
                hiddenDream: dream.hiddenDream,
                personalAnalysis: dream.personalAnalysis,
                dreamOriginId: dream.dreamOriginId,
            }
            return await Dream.create(dreamModel, { client: trx })
        })
    }

    async CreateUncomplete(dream: DreamUncompleteInput, validate = true) : Promise<Dream> {
        return await db.transaction(async (trx) => {
            if (dream.sleepId) {
                const sleepExists = await Sleep.find(dream.sleepId, { client: trx })
                if (!sleepExists) throw new CustomException(404, "Sono referente não encontrado.")

                if (validate) await this.Validate(dream)
                const dreamModel: DreamInput = {
                    sleepId: dream.sleepId,
                    title: dream.title,
                    description: dream.description,
                    dreamPointOfViewId: dream.dreamPointOfViewId,
                    climate: dream.climate,
                    dreamHourId: dream.dreamHourId,
                    dreamDurationId: dream.dreamDurationId,
                    dreamLucidityLevelId: dream.dreamLucidityLevelId,
                    dreamTypeId: dream.dreamTypeId,
                    dreamRealityLevelId: dream.dreamRealityLevelId,
                    eroticDream: dream.eroticDream,
                    hiddenDream: dream.hiddenDream,
                    personalAnalysis: dream.personalAnalysis,
                    dreamOriginId: dream.dreamOriginId,
                }
                return await Dream.create(dreamModel, { client: trx })
            }

            const userExists = await User.find(dream.userId, { client: trx })
            if (!userExists) throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")
            
            const _sleepInputModel : SleepInput = {
                ...sleepInputModel,
                userId: dream.userId ?? 0,
                date: dream.date ?? DateTime.now(),
            }
            await this.sleepService.Validate(_sleepInputModel)
            const sleepCreated = await Sleep.create(_sleepInputModel, { client: trx })
            dream.sleepId = sleepCreated.id

            if (validate) await this.Validate(dream)
            const dreamModel: DreamInput = {
                sleepId: dream.sleepId,
                title: dream.title,
                description: dream.description,
                dreamPointOfViewId: dream.dreamPointOfViewId,
                climate: dream.climate,
                dreamHourId: dream.dreamHourId,
                dreamDurationId: dream.dreamDurationId,
                dreamLucidityLevelId: dream.dreamLucidityLevelId,
                dreamTypeId: dream.dreamTypeId,
                dreamRealityLevelId: dream.dreamRealityLevelId,
                eroticDream: dream.eroticDream,
                hiddenDream: dream.hiddenDream,
                personalAnalysis: dream.personalAnalysis,
                dreamOriginId: dream.dreamOriginId,
            }
            return await Dream.create(dreamModel, { client: trx })
        })
    }

    async Update(dream: DreamOutput, validate = true): Promise<Dream> {
        const sleepExists = await Sleep.find(dream.sleepId)
        if (!sleepExists) throw new CustomException(404, "Sono não encontrado.")

        const dreamExists = await this.Get(dream.id)
        if (!dreamExists) throw new CustomException(404, "Sonho não encontrado.")

        return await db.transaction(async (trx) => {
            if (validate) await this.Validate(dream)
            return await Dream.updateOrCreate({ id: dream.id }, dream, { client: trx })
        })
    }

    async Validate(dream: DreamInput): Promise<void> {
        const sameTitleDreamExists = await Dream.findBy('title', dream.title)
        if (sameTitleDreamExists) throw new CustomException(400, "Um sonho com o mesmo título já existe.")
    }

    async Get(id: number): Promise<Dream | null> {
        return await Dream.find(id)
    }

    async Delete(id: number): Promise<void> {
        const sleep = await this.Get(id)
        if (!sleep) throw new CustomException(404, "Sonho não encontrado ou já deletado.")
        await sleep.delete()
    }

    async List({
        page,
        limit,
        orderBy,
        orderByDirection
    }: Pagination): Promise<ModelPaginatorContract<Dream>> {
        return await Dream.query()
            .orderBy(orderBy, orderByDirection as any)
            .paginate(page, limit)
    }

    async ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Dream>> {
        const { page, limit, orderBy, orderByDirection } = pagination

        const userExists = await User.find(userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente para a listagem de sonhos.")

        return await Dream.query()
            .innerJoin('sleeps', 'sleeps.id', 'dreams.sleep_id')
            .innerJoin('users', 'users.id', 'sleeps.user_id')
            .where('users.id', userId)
            .select('dreams.id', 'dreams.*')
            .orderBy(`dreams.${ orderBy }`, orderByDirection)
            .paginate(page, limit)
    }
}