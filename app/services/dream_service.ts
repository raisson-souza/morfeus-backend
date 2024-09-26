import { DateTime } from "luxon"
import { DreamCompleteInput, DreamCompleteUpdateInput, DreamInput, DreamUncompleteInput } from "../types/dreamTypes.js"
import { DreamTagInput } from "../types/DreamTagTypes.js"
import { inject } from "@adonisjs/core"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../types/pagiation.js"
import { SleepInput, sleepInputModel } from "../types/sleepTypes.js"
import { TagInput } from "../types/TagTypes.js"
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import DreamServiceProps from "./types/dream_service_props.js"
import DreamTag from "#models/dream_tag"
import Sleep from "#models/sleep"
import SleepService from "./sleep_service.js"
import Tag from "#models/tag"
import User from "#models/user"

@inject()
export default class DreamService implements DreamServiceProps {
    constructor(protected sleepService: SleepService) { }

    async Create(dream: DreamCompleteInput, validate = true) : Promise<Dream> {
        let newDream: Dream | null = null
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

        await db.transaction(async (trx) => {
            // Caso o sono exista, não necessita criar um provisório
            if (dream.sleepId) {
                const sleepExists = await Sleep.find(dream.sleepId)
                if (!sleepExists) throw new CustomException(404, "Sono referente não encontrado.")

                if (validate) await this.Validate(dream)
                newDream = await Dream.create(dreamModel, { client: trx })
                await this.CreateTags(dream.tags, newDream!.id, trx)
            } else {
                // Verifica a existência do usuário para a criação do sono
                const userExists = await User.find(dream.userId)
                if (!userExists) throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")

                // Monta o objeto de criação de um sono
                const createSleepModel: SleepInput = {
                    ...sleepInputModel,
                    userId: dream.userId ?? 0,
                    date: dream.date ?? DateTime.now(),
                }
                await this.sleepService.Validate(createSleepModel)
                const sleepCreated = await Sleep.create(createSleepModel, { client: trx })
                // ID do sono no sonho é populado
                dreamModel.sleepId = sleepCreated.id

                // No caso da criação do sonho sem sono pré-criado, iniciamos uma transação aninhada para lidar com o sonho e as tags
                await trx.transaction(async (childTrx) => {
                    if (validate) await this.Validate(dream)
                    newDream = await Dream.create(dreamModel, { client: childTrx })
                    await this.CreateTags(dream.tags, newDream!.id, childTrx)
                })
            }
        })
        return newDream!
    }

    async CreateUncomplete(dream: DreamUncompleteInput, validate = true) : Promise<Dream> {
        return await db.transaction(async (trx) => {
            const userExists = await User.find(dream.userId, { client: trx })
            if (!userExists) throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")

            const sleepExists = await Sleep.findBy('date', dream.date)
            let sleepId: number | null = null

            if (!sleepExists) {
                const createSleepModel: SleepInput = {
                    ...sleepInputModel,
                    userId: dream.userId ?? 0,
                    date: dream.date ?? DateTime.now(),
                }
                await this.sleepService.Validate(createSleepModel)
                await Sleep.create(createSleepModel, { client: trx })
                    .then(sleep => { sleepId = sleep.id })
            } else {
                sleepId = sleepExists.id
            }

            if (validate) await this.Validate(dream)
            const createDreamModel: DreamInput = {
                sleepId: sleepId!,
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
            return await Dream.create(createDreamModel, { client: trx })
        })
    }

    async Update(dream: DreamCompleteUpdateInput, validate = true): Promise<Dream> {
        const sleepExists = await Sleep.find(dream.sleepId)
        if (!sleepExists) throw new CustomException(404, "Sono não encontrado.")

        const dreamExists = await this.Get(dream.id)
        if (!dreamExists) throw new CustomException(404, "Sonho não encontrado.")

        return await db.transaction(async (trx) => {
            const updateDreamModel: DreamInput = {
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
            if (validate) await this.Validate(updateDreamModel)
            const newDream = await Dream.updateOrCreate({ id: dream.id }, updateDreamModel, { client: trx })
            await this.CreateTags(dream.tags, newDream.id, trx)
            return newDream
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

    async CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
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