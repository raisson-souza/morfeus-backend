import { createCompleteDreamValidator, createUncompleteDreamValidator, updateCompleteDreamValidator } from '#validators/dream'
import { DateTime } from 'luxon'
import { inject } from "@adonisjs/core"
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { paginationValidator } from '#validators/system'
import CustomException from '#exceptions/custom_exception'
import Dream from '#models/dream'
import DreamService from '#services/dream_service'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class DreamController {
    constructor(protected dreamService : DreamService) { }

    async create({ request, response }: HttpContext) : Promise<void> {
        const dream = await request.validateUsing(createCompleteDreamValidator)
        await this.dreamService.Create({
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
            personalAnalysis: dream.personalAnalysis ?? "",
            dreamOriginId: 1,
            date: dream.date === undefined ? DateTime.now() : DateTime.fromJSDate(dream.date),
            userId: dream.userId,
        })
        response.status(201).json("Sonho criado com sucesso.")
    }

    async createUncomplete({ request, response }: HttpContext) : Promise<void> {
        const dream = await request.validateUsing(createUncompleteDreamValidator)
        await this.dreamService.CreateUncomplete({
            sleepId: dream.sleepId ?? 0,
            title: dream.title,
            description: dream.description,
            dreamPointOfViewId: dream.dreamPointOfViewId ?? 1,
            climate: {
                ameno: false,
                calor: false,
                garoa: false,
                chuva: false,
                tempestade: false,
                nevoa: false,
                neve: false,
                multiplos: false,
                outro: false,
                indefinido: true
            },
            dreamHourId: dream.dreamHourId ?? 5,
            dreamDurationId: dream.dreamDurationId ?? 1,
            dreamLucidityLevelId: dream.dreamLucidityLevelId ?? 1,
            dreamTypeId: dream.dreamTypeId ?? 1,
            dreamRealityLevelId: dream.dreamRealityLevelId ?? 1,
            eroticDream: dream.eroticDream ?? false,
            hiddenDream: dream.hiddenDream ?? false,
            personalAnalysis: dream.personalAnalysis ?? "",
            dreamOriginId: dream.dreamOriginId,
            date: dream.date === undefined ? DateTime.now() : DateTime.fromJSDate(dream.date),
            userId: dream.userId ?? 0
        })
        response.status(201).json("Sonho criado com sucesso.")
    }

    async update({ request, response }: HttpContext) : Promise<void> {
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
        })
        response.status(201).json("Sonho atualizado com sucesso.")
    }

    async get({ params }: HttpContext) : Promise<Dream | null> {
        const { id } = params
        const dream = await this.dreamService.Get(Number.parseInt(id ?? 0))
        if (!dream) throw new CustomException(404, "Sonho não encontrado.")
        return dream!
    }

    async list({ request }: HttpContext) : Promise<ModelPaginatorContract<Dream>> {
        const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
        return await this.dreamService.List({ page, limit, orderBy, orderByDirection: orderByDirection as any })
    }

    async delete({ params, response }: HttpContext) : Promise<void> {
        const { id } = params
        await this.dreamService.Delete(id)
        response.status(201).json("Sonho deletado com sucesso.")
    }

    async listByUser({ params, request }: HttpContext): Promise<ModelPaginatorContract<Dream>> {
        const { id } = params
        const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
        return this.dreamService.ListByUser(
            { page, limit, orderBy, orderByDirection: orderByDirection as any },
            id
        )
    }
}