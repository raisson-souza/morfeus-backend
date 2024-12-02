import { CreateDreamModel, DreamCompleteUpdateInput, DreamInput, DreamListedByUser, DreamNoSleepDateKnown, DreamNoSleepTimeKnown, DreamNoSleepTimePeriod, DreamWithTags, ListDreamsByUser } from "../types/dreamTypes.js"
import { DateTime } from "luxon"
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
import TagService from "./tag_service.js"
import User from "#models/user"

@inject()
export default class DreamService implements DreamServiceProps {
    constructor(
        protected sleepService: SleepService,
        protected tagService: TagService,
    ) { }

    async Create(dream: CreateDreamModel, _ = true) : Promise<Dream> {
        let newDream: Dream | null = null
        const dreamModel: DreamInput = {
            sleepId: dream.sleepId ?? 0,
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
            isComplete: true,
        }

        await db.transaction(async (trx) => {
            if (dream.sleepId) {
                const sleepExists = await Sleep.find(dream.sleepId)
                if (!sleepExists)
                    throw new CustomException(404, "Sono referente não encontrado.")

                await this.Validate(dream)
                newDream = await Dream.create(dreamModel, { client: trx })
                await this.CreateTags(dream.tags, newDream!.id, trx)
            } else {
                if (!dream.dreamNoSleepDateKnown && !dream.dreamNoSleepTimeKnown)
                    throw new CustomException(400, "Não é possível criar um sonho sem informações necessárias sobre o sono referente.")

                const userExists = await User.find(dream.userId)
                if (!userExists)
                    throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")

                // TODO: caso horário conhecido, necessita entregar a data?
                dreamModel.sleepId = await this.DefineSleepIdForDreamNoSleep(
                    dream.userId,
                    dream.dreamNoSleepTimeKnown,
                    dream.dreamNoSleepDateKnown,
                    trx
                )

                await trx.transaction(async (childTrx) => {
                    this.Validate(dream)
                    newDream = await Dream.create(dreamModel, { client: childTrx })
                    await this.CreateTags(dream.tags, newDream!.id, childTrx)
                })
            }
        })
        return newDream!
    }

    // async CreateUncomplete(dream: CreateDreamModel, _ = true) : Promise<Dream> {
    //     return await db.transaction(async (trx) => {
    //         let newDream: Dream | null = null

    //         const dreamModel: DreamInput = {
    //             sleepId: dream.sleepId ?? 0,
    //             title: dream.title,
    //             description: dream.description,
    //             dreamPointOfViewId: dream.dreamPointOfViewId,
    //             climate: dream.climate,
    //             dreamHourId: dream.dreamHourId,
    //             dreamDurationId: dream.dreamDurationId,
    //             dreamLucidityLevelId: dream.dreamLucidityLevelId,
    //             dreamTypeId: dream.dreamTypeId,
    //             dreamRealityLevelId: dream.dreamRealityLevelId,
    //             eroticDream: dream.eroticDream,
    //             hiddenDream: dream.hiddenDream,
    //             personalAnalysis: dream.personalAnalysis,
    //             dreamOriginId: dream.dreamOriginId,
    //             isComplete: true,
    //         }

    //         if (dream.sleepId) {
    //             const sleepExists = await Sleep.find(dream.sleepId)
    //             if (!sleepExists)
    //                 throw new CustomException(404, "Sono referente não encontrado.")

    //             await this.Validate(dream)
    //             newDream = await Dream.create(dreamModel, { client: trx })
    //             await this.CreateTags(dream.tags, newDream!.id, trx)
    //         } else {
    //             if (!dream.dreamNoSleepDateKnown && !dream.dreamNoSleepTimeKnown)
    //                 throw new CustomException(400, "Não é possível criar um sonho sem informações necessárias sobre o sono referente.")

    //             const userExists = await User.find(dream.userId)
    //             if (!userExists)
    //                 throw new CustomException(404, "Usuário referente ao sono a ser criado não encontrado.")

    //             dreamModel.sleepId = await this.DefineSleepIdForDreamNoSleep(
    //                 dream.userId,
    //                 dream.dreamNoSleepTimeKnown,
    //                 dream.dreamNoSleepDateKnown,
    //                 trx
    //             )

    //             await trx.transaction(async (childTrx) => {
    //                 this.Validate(dream)
    //                 newDream = await Dream.create(dreamModel, { client: childTrx })
    //                 await this.CreateTags(dream.tags, newDream!.id, childTrx)
    //             })
    //         }

    //         return newDream!
    //     })
    // }

    async Update(dream: DreamCompleteUpdateInput, _ = true): Promise<Dream> {
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
                isComplete: true,
            }

            const sameDreamTitle = await Dream.query()
                .where("title", updateDreamModel.title)
                .andWhereNot("id", dream.id)
                .first()
            if (sameDreamTitle)
                throw new CustomException(400, "Um sonho com o mesmo título já existe.")

            const newDream = await Dream.updateOrCreate({ id: dream.id }, updateDreamModel, { client: trx })
            await this.CreateTags(dream.tags, newDream.id, trx)
            return newDream
        })
    }

    async Validate(dream: CreateDreamModel): Promise<void> {
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

    async ListByUser(listingProps: ListDreamsByUser): Promise<DreamListedByUser[]> {
        const {
            userId,
            dreamCaracteristicsFilter,
            dreamOriginFilter,
            dreamEspecificCaracteristicsFilter: {
                noEspecificy,
                dreamsWithPersonalAnalysis,
                dreamClimates,
                dreamHourId,
                dreamDurationId,
                dreamLucidityLevelId,
                dreamTypeId,
                dreamRealityLevelId,
                dreamPointOfViewId,
            },
            date,
        } = listingProps

        const userExists = await User.find(userId)
        if (!userExists) throw new CustomException(404, "Usuário inexistente para a listagem de sonhos.")

        if (date > DateTime.now())
            throw new CustomException(400, "A data de listagem não pode ser maior que a atual.")

        const dreamsFound: DreamListedByUser[] = await db.query()
            .from('dreams')
            .innerJoin('sleeps', 'sleeps.id', 'dreams.sleep_id')
            .innerJoin('users', 'users.id', 'sleeps.user_id')
            // 1° FILTRO - base | OBJETIVO
            .where(query => {
                query.where('users.id', userId)
                query.whereRaw("EXTRACT(YEAR FROM sleeps.date) = ?", [ (date as any).getFullYear() ])
                query.andWhereRaw("EXTRACT(MONTH FROM sleeps.date) = ?", [ (date as any).getMonth() + 1])
            })
            // 2° FILTRO - listagem de sonhos | OBJETIVO
            .andWhere(query => {
                switch (dreamCaracteristicsFilter) {
                    case "all": break
                    case "allNotHidden":
                        query.where('dreams.hidden_dream', false)
                        break
                    case "allNotErotic":
                        query.where('dreams.erotic_dream', false)
                        break
                    case "allNotHiddenAndErotic":
                        query.where('dreams.hidden_dream', false)
                        query.where('dreams.erotic_dream', false)
                        break
                    case "allHidden":
                        query.where('dreams.hidden_dream', true)
                        break
                    case "allErotic":
                        query.where('dreams.erotic_dream', true)
                        break
                    default:
                }
            })
            // 3° FILTRO - origem do sonho | OBJETIVO
            .andWhere(query => {
                switch (dreamOriginFilter) {
                    case "all": break
                    case "completeDreams":
                        query.where('dreams.dream_origin_id', 1)
                        break
                    case "fastDreams":
                        query.where('dreams.dream_origin_id', 2)
                        break
                    case "importedDreams":
                        query.where('dreams.dream_origin_id', 3)
                        break
                    default:
                }
            })
            // 4° FILTRO - características do sonho | ACUMULATIVO
            .if(!noEspecificy, query => {
                query.andWhere(query2 => {
                    if (dreamsWithPersonalAnalysis)
                        query2.orWhereNotNull('dreams.personal_analysis')
                    // Se existirem climas a serem filtrados e se pelo menos um for verdadeiro
                    if (
                        dreamClimates &&
                        (
                            dreamClimates.ameno ||
                            dreamClimates.indefinido ||
                            dreamClimates.outro ||
                            dreamClimates.multiplos ||
                            dreamClimates.neve ||
                            dreamClimates.nevoa ||
                            dreamClimates.tempestade ||
                            dreamClimates.chuva ||
                            dreamClimates.garoa ||
                            dreamClimates.calor
                        )
                    ) {
                        query2.orWhereJsonSuperset('dreams.climate', {
                            'ameno': dreamClimates.ameno ?? false,
                            'indefinido': dreamClimates.indefinido ?? false,
                            'outro': dreamClimates.outro ?? false,
                            'multiplos': dreamClimates.multiplos ?? false,
                            'neve': dreamClimates.neve ?? false,
                            'nevoa': dreamClimates.nevoa ?? false,
                            'tempestade': dreamClimates.tempestade ?? false,
                            'chuva': dreamClimates.chuva ?? false,
                            'garoa': dreamClimates.garoa ?? false,
                            'calor': dreamClimates.calor ?? false,
                        })
                    }
                    if (dreamHourId)
                        query2.orWhere('dreams.dream_hour_id', dreamHourId)
                    if (dreamDurationId)
                        query2.orWhere('dreams.dream_duration_id', dreamDurationId)
                    if (dreamLucidityLevelId)
                        query2.orWhere('dreams.dream_lucidity_level_id', dreamLucidityLevelId)
                    if (dreamTypeId)
                        query2.orWhere('dreams.dream_type_id', dreamTypeId)
                    if (dreamRealityLevelId)
                        query2.orWhere('dreams.dream_reality_level_id', dreamRealityLevelId)
                    if (dreamPointOfViewId)
                        query2.orWhere('dreams.dream_point_of_view_id', dreamPointOfViewId)
                })
            })
            .select('dreams.id', 'dreams.title', 'sleeps.date')
            .select(db.raw('SUBSTRING(dreams.description, 1, 50) as shortDescription'))
            .orderBy('dreams.created_at', 'asc')
            .then(result => {
                return result.map(dream => {
                    return {
                        id: dream["id"],
                        title: dream["title"],
                        shortDescription: dream["shortDescription"],
                        date: dream["date"],
                        tags: [],
                    } as DreamListedByUser
                }) as DreamListedByUser[]
            })

        if (dreamsFound.length > 0) {
            for (const dream of dreamsFound) {
                try {
                    dream.tags = await this.tagService.ListByDream(dream.id)
                } catch { }
            }
        }

        return dreamsFound
    }

    async CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
        if (tags.length === 0) return

        for (const tag of tags) {
            let tagId: null | number = null
            // Procura se a tag já existe
            await Tag.findBy('title', tag.toUpperCase(), { client: trx })
                .then(result => { if (result) tagId = result.id})

            // Se a tag não existe, cria uma nova
            if (!tagId) {
                const tagModel: TagInput = { title: tag.toUpperCase() }
                const newTag = await Tag.create(tagModel, { client: trx })
                tagId = newTag.id
            }

            // Verifica se a tag existente ou recém criada já está anexada no sonho
            const isTagAttached = await DreamTag
                .query({ client: trx })
                .where('tag_id', tagId)
                .andWhere('dream_id', dreamId)
                .select('id')
                .then(tagsAttached => tagsAttached.length > 0)

            // Anexa a tag ao sonho se não estiver anexada
            if (!isTagAttached) {
                const dreamTagModel: DreamTagInput = {
                    dreamId: dreamId,
                    tagId: tagId
                }
                await DreamTag.create(dreamTagModel, { client: trx })
            }
        }
    }

    async ListDreamsBySleep(sleepId?: number, date?: DateTime): Promise<DreamWithTags[]> {
        const dreams: DreamWithTags[] = []
        let foundSleepId: number | null = null

        // Procura-se sono pelo sleepId
        if (sleepId) {
            const sleepIdById = await Sleep.find(sleepId)
                .then(result => { return result?.id })
            if (!sleepIdById) throw new CustomException(404, "Sono não encontrado.")
            foundSleepId = sleepIdById
        }

        // Procura-se sono pela data
        if (!foundSleepId && date) {
            const sleepIdByDate = await Sleep.findBy("date", date)
                .then(result => { return result?.id })
            if (!sleepIdByDate) throw new CustomException(404, "Sono não encontrado.")
            foundSleepId = sleepIdByDate
        }

        // Procuramos os sonhos do sono
        const foundDreams = await Dream.query()
            .where("sleep_id", foundSleepId!)

        for (const dream of foundDreams) {
            // Capturadas as tags do sonho
            const tags: { tagId: number, tagTitle: string }[] = await Tag.query()
                .innerJoin("dream_tags", "dream_tags.tag_id", "tags.id")
                .where("dream_id", dream.id)
                .then(tags => {
                    return tags.map(tag => {
                        return {
                            tagId: tag.id,
                            tagTitle: tag.title
                        }
                    })
                })

            // Montado o tipo do sonho com as tags
            dreams.push({
                sleepId: dream.sleepId,
                title: dream.title,
                description: dream.description,
                dreamPointOfViewId: dream.dreamPointOfViewId,
                climate: dream.climate,
                dreamHourId: dream.dreamDurationId,
                dreamDurationId: dream.dreamDurationId,
                dreamLucidityLevelId: dream.dreamLucidityLevelId,
                dreamTypeId: dream.dreamTypeId,
                dreamRealityLevelId: dream.dreamRealityLevelId,
                eroticDream: dream.eroticDream,
                hiddenDream: dream.hiddenDream,
                personalAnalysis: dream.personalAnalysis ?? undefined,
                dreamOriginId: dream.dreamOriginId,
                isComplete: dream.isComplete,
                tags: tags
            })
        }

        return dreams
    }

    // TODO: Explicitar retorno dos métodos e simplificar parametros
    private async DefineSleepIdForDreamNoSleep(userId: number, timeKnown: DreamNoSleepTimeKnown | null, dateKnown: DreamNoSleepDateKnown | null, trx: TransactionClientContract): Promise<number> {
        let sleepId: number | null = null
        let sleepStart: DateTime<boolean> | null = null
        let sleepEnd: DateTime<boolean> | null = null

        if (timeKnown) {
            sleepStart = timeKnown.sleepStart
            sleepEnd = timeKnown.sleepEnd
            sleepId = await this.GetSleepForDreamNoSleepByTimeKnown(
                userId,
                timeKnown.date,
                timeKnown.sleepStart,
                timeKnown.sleepEnd
            )
        } else {
            const sleepPeriodTimes = this.DefineSleepPeriodTimes(dateKnown!.date, dateKnown!.period)
            sleepStart = sleepPeriodTimes.sleepStart
            sleepEnd = sleepPeriodTimes.sleepEnd
            sleepId = await this.GetSleepForDreamNoSleepByDateKnown(
                userId,
                dateKnown!.date,
                dateKnown!.period,
            )
        }

        if (sleepId) {
            return sleepId
        }
        else {
            const newSleep = await this.CreateSleepForDreamNoSleep(userId, sleepStart, sleepEnd, trx)
            return newSleep.id
        }
    }

    // TODO: Explicitar retorno dos métodos e simplificar parametros
    private async CreateSleepForDreamNoSleep(userId: number, sleepStart: DateTime<true>, sleepEnd: DateTime<true>, trx: TransactionClientContract): Promise<Sleep> {
        const isNightSleep = this.sleepService.IsNightSleep(sleepStart, sleepEnd)
        const sleepDate = this.sleepService.DefineSleepDate(sleepEnd, isNightSleep)
        await this.sleepService.ValidateSleepCreation(userId, sleepDate, sleepStart, sleepEnd)

        const sleepModel: SleepInput = {
            ...sleepInputModel,
            userId: userId,
            date: sleepDate,
            sleepTime: 0,
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
            isNightSleep: isNightSleep,
        }

        return await Sleep.create(sleepModel, { client: trx })
    }

    // TODO: Explicitar retorno dos métodos e simplificar parametros
    // TODO: É possivel simplificar e unir a GetSleepForDreamNoSleepByTimeKnown?
    private async GetSleepForDreamNoSleepByDateKnown(userId: number, sleepDate: DateTime<true>, sleepPeriod: DreamNoSleepTimePeriod): Promise<number | null> {
        const yesterdayIso = sleepDate.minus({ day: 1 }).toISODate()
        const sleeps = await Sleep.query()
            .where("user_id", userId)
            .andWhere(query => {
                query
                    .where("date", sleepDate.toISODate())
                    .orWhere("date", yesterdayIso)
            })
            .orderBy("id", "desc")
        let sleepId: number | null = null

        const { sleepStart, sleepEnd } = this.DefineSleepPeriodTimes(sleepDate, sleepPeriod)

        for (const sleep of sleeps) {
            if (this.sleepService.CheckSleepPeriod(sleep, sleepStart.toMillis(), sleepEnd.toMillis())) {
                sleepId = sleep.id
                break
            }
        }

        return sleepId
    }

    // TODO: Explicitar retorno dos métodos e simplificar parametros
    private DefineSleepPeriodTimes(periodDate: DateTime<true>, period: DreamNoSleepTimePeriod): { sleepStart: DateTime<true>, sleepEnd: DateTime<true> } {
        let sleepStart = DateTime.fromMillis(periodDate.toMillis()) as DateTime<true>
        let sleepEnd = DateTime.fromMillis(periodDate.toMillis()) as DateTime<true>

        switch (period) {
            case "morning":
                sleepStart = sleepStart.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                sleepEnd = sleepStart.set({ hour: 12, minute: 59, second: 59, millisecond: 0 })
                break
            case "afternoon":
                sleepStart = sleepStart.set({ hour: 12, minute: 0, second: 0, millisecond: 0 })
                sleepEnd = sleepStart.set({ hour: 17, minute: 59, second: 59, millisecond: 0 })
                break
            case "night":
                sleepStart = sleepStart.set({ hour: 18, minute: 0, second: 0, millisecond: 0 })
                sleepEnd = sleepStart.set({ hour: 23, minute: 59, second: 59, millisecond: 0 })
                break
        }

        return {
            sleepStart: sleepStart,
            sleepEnd: sleepEnd,
        }
    }

    // TODO: Explicitar retorno dos métodos e simplificar parametros
    // TODO: É possivel simplificar e unir a GetSleepForDreamNoSleepByDateKnown?
    private async GetSleepForDreamNoSleepByTimeKnown(userId: number, sleepDate: DateTime<true>, sleepStart: DateTime<true>, sleepEnd: DateTime<true>): Promise<number | null> {
        const yesterdayIso = sleepDate.minus({ day: 1 }).toISODate()
        const sleeps = await Sleep.query()
            .where("user_id", userId)
            .andWhere(query => {
                query
                    .where("date", sleepDate.toISODate())
                    .orWhere("date", yesterdayIso)
            })
            .orderBy("id", "desc")
        let sleepId: number | null = null

        for (const sleep of sleeps) {
            if (this.sleepService.CheckSleepPeriod(sleep, sleepStart.toMillis(), sleepEnd.toMillis())) {
                sleepId = sleep.id
                break
            }
        }

        return sleepId
    }
}