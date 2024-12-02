import { createCompleteDreamValidator, listDreamBySleepValidator, listDreamsByUserValidator, updateCompleteDreamValidator } from '#validators/dream'
import { DateTime } from 'luxon'
import { DreamListedByUser, DreamWithTags, ListDreamsByUser } from '../types/dreamTypes.js'
import { inject } from "@adonisjs/core"
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { paginationValidator } from '#validators/system'
import CustomException from '#exceptions/custom_exception'
import Dream from '#models/dream'
import DreamService from '#services/dream_service'
import ResponseSender from '../functions/core/ResponseMessage.js'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DreamController {
    constructor(protected dreamService : DreamService) { }

    async create({ request, response, auth }: HttpContext) {
        try {
            const dream = await request.validateUsing(createCompleteDreamValidator)
            await this.dreamService.Create({
                sleepId: dream.sleepId ?? undefined,
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
                personalAnalysis: dream.personalAnalysis ?? undefined,
                dreamOriginId: 1,
                userId: auth.user!.id,
                tags: dream.tags,
                isComplete: true,
                dreamNoSleepDateKnown: dream.dreamNoSleepDateKnown
                    ? {
                        date: DateTime.fromJSDate(dream.dreamNoSleepDateKnown.date),
                        period: dream.dreamNoSleepDateKnown.period as any
                    }
                    : null,
                dreamNoSleepTimeKnown: dream.dreamNoSleepTimeKnown
                    ? {
                        date: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.date),
                        sleepStart: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.sleepStart),
                        sleepEnd: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.sleepEnd)
                    }
                    : null,
            })
            ResponseSender<string>({ response, status: 201, data: "Sonho criado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    // async createUncomplete({ request, response, auth }: HttpContext) {
    //     try {
    //         const dream = await request.validateUsing(createUncompleteDreamValidator)
    //         await this.dreamService.CreateUncomplete({
    //             sleepId: 0,
    //             title: dream.title,
    //             description: dream.description,
    //             dreamPointOfViewId: dream.dreamPointOfViewId ?? 1,
    //             climate: {
    //                 ameno: false,
    //                 calor: false,
    //                 garoa: false,
    //                 chuva: false,
    //                 tempestade: false,
    //                 nevoa: false,
    //                 neve: false,
    //                 multiplos: false,
    //                 outro: false,
    //                 indefinido: true
    //             },
    //             dreamHourId: dream.dreamHourId ?? 5,
    //             dreamDurationId: dream.dreamDurationId ?? 1,
    //             dreamLucidityLevelId: dream.dreamLucidityLevelId ?? 1,
    //             dreamTypeId: dream.dreamTypeId ?? 1,
    //             dreamRealityLevelId: dream.dreamRealityLevelId ?? 1,
    //             eroticDream: dream.eroticDream ?? false,
    //             hiddenDream: dream.hiddenDream ?? false,
    //             personalAnalysis: dream.personalAnalysis ?? undefined,
    //             dreamOriginId: dream.dreamOriginId,
    //             userId: auth.user!.id,
    //             isComplete: false,
    //             tags: [],
    //             dreamNoSleepDateKnown: dream.dreamNoSleepDateKnown
    //                 ? {
    //                     date: DateTime.fromJSDate(dream.dreamNoSleepDateKnown.date),
    //                     period: dream.dreamNoSleepDateKnown.period as any
    //                 }
    //                 : null,
    //             dreamNoSleepTimeKnown: dream.dreamNoSleepTimeKnown
    //                 ? {
    //                     date: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.date),
    //                     sleepStart: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.sleepStart),
    //                     sleepEnd: DateTime.fromJSDate(dream.dreamNoSleepTimeKnown.sleepEnd)
    //                 }
    //                 : null,
    //         })
    //         ResponseSender<string>({ response, status: 201, data: "Sonho criado com sucesso." })
    //     }
    //     catch (ex) {
    //         ResponseSender<string>({ response, data: ex as Error })
    //     }
    // }

    async update({ request, response }: HttpContext) {
        try {
            const dream = await request.validateUsing(updateCompleteDreamValidator)
            await this.dreamService.Update({
                id: dream.id,
                sleepId: dream.sleepId,
                title: dream.title,
                description: dream.description,
                dreamPointOfViewId: dream.dreamPointOfViewId,
                climate: {
                    ameno: dream.climate.ameno,
                    calor: dream.climate.ameno,
                    garoa: dream.climate.ameno,
                    chuva: dream.climate.ameno,
                    tempestade: dream.climate.ameno,
                    nevoa: dream.climate.ameno,
                    neve: dream.climate.ameno,
                    multiplos: dream.climate.ameno,
                    outro: dream.climate.ameno,
                    indefinido: dream.climate.ameno,
                },
                dreamHourId: dream.dreamHourId,
                dreamDurationId: dream.dreamDurationId,
                dreamLucidityLevelId: dream.dreamLucidityLevelId,
                dreamTypeId: dream.dreamTypeId,
                dreamRealityLevelId: dream.dreamRealityLevelId,
                eroticDream: dream.eroticDream,
                hiddenDream: dream.hiddenDream,
                personalAnalysis: dream.personalAnalysis ?? "",
                dreamOriginId: 1,
                tags: dream.tags,
                isComplete: true,
            })
            ResponseSender<string>({ response, status: 201, data: "Sonho atualizado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async get({ params, response }: HttpContext) {
        try {
            const { id } = params
            const dream = await this.dreamService.Get(Number.parseInt(id ?? 0))
            if (!dream) throw new CustomException(404, "Sonho não encontrado.")
            ResponseSender<Dream>({ response, data: dream })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async list({ request, response }: HttpContext) {
        try {
            const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
            const dreamsList = await this.dreamService.List({ page, limit, orderBy, orderByDirection: orderByDirection as any })
            ResponseSender<ModelPaginatorContract<Dream>>({ response, data: dreamsList })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async delete({ params, response }: HttpContext) {
        try {
            const { id } = params
            await this.dreamService.Delete(id)
            ResponseSender<string>({ response, data: "Sonho deletado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listByUser({ request, auth, response }: HttpContext) {
        try {
            const listDreamsByUserPropsFromValidator = await request.validateUsing(listDreamsByUserValidator)
            const listDreamsByUserProps: ListDreamsByUser = {
                ...(listDreamsByUserPropsFromValidator as any),
                userId: auth.user!.id
            }
            const dreamsListByUser = await this.dreamService.ListByUser(listDreamsByUserProps)
            ResponseSender<DreamListedByUser[]>({ response, data: dreamsListByUser })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listBySleep({ request, response }: HttpContext) {
        try {
            const { sleep_id, date } = await request.validateUsing(listDreamBySleepValidator)
            if (!sleep_id && !date) response.status(400).json("É necessário informar o ID do sono ou a data do sono.")
            const dreamsListBySleep = await this.dreamService.ListDreamsBySleep(sleep_id, (date != undefined ? DateTime.fromJSDate(date) : DateTime.now()))
            ResponseSender<DreamWithTags[]>({ response, data: dreamsListBySleep })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }
}