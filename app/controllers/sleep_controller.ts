import { createSimpleSleepValidator, createSleepValidator, listSleepsByUserValidator, listSleepsForDreamCreationValidator, updateSleepValidator } from '#validators/sleep'
import { CreateSleepWithDreamInput } from '../types/dreamTypes.js'
import { DateTime } from 'luxon'
import { GetSimpleSleepProps, ListSleepsByUserProps } from '../types/sleepTypes.js'
import { inject } from '@adonisjs/core'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { paginationValidator } from '#validators/system'
import CustomException from '#exceptions/custom_exception'
import ResponseSender from '../functions/core/ResponseMessage.js'
import Sleep from '#models/sleep'
import SleepService from '#services/sleep_service'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class SleepController {
    constructor(protected sleepService : SleepService) { }

    async create({ request, response, auth }: HttpContext) {
        try {
            const sleep = await request.validateUsing(createSleepValidator)
            const dreams: CreateSleepWithDreamInput[] = []

            if (sleep.dreams != undefined && sleep.dreams.length > 0) {
                sleep.dreams!.map(dream => dreams.push({
                    title: dream.title,
                    description: dream.description,
                    dreamPointOfViewId: dream.dreamPointOfViewId,
                    climate: {
                        ameno: dream.climate.ameno,
                        calor: dream.climate.calor,
                        garoa: dream.climate.garoa,
                        chuva: dream.climate.chuva,
                        tempestade: dream.climate.tempestade,
                        nevoa: dream.climate.nevoa,
                        neve: dream.climate.neve,
                        multiplos: dream.climate.multiplos,
                        outro: dream.climate.outro,
                        indefinido: dream.climate.indefinido,
                    },
                    dreamHourId: dream.dreamHourId,
                    dreamDurationId: dream.dreamDurationId,
                    dreamLucidityLevelId: dream.dreamLucidityLevelId,
                    dreamTypeId: dream.dreamTypeId,
                    dreamRealityLevelId: dream.dreamRealityLevelId,
                    eroticDream: dream.eroticDream,
                    hiddenDream: dream.hiddenDream,
                    personalAnalysis: dream.personalAnalysis,
                    sleepId: 0,
                    dreamOriginId: 1,
                    tags: dream.tags,
                    isComplete: true,
                }))
            }

            await this.sleepService.Create({
                userId: auth.user!.id,
                sleepTime: this.calculateSleepTime(sleep.sleepStart, sleep.sleepEnd),
                sleepStart: DateTime.fromJSDate(sleep.sleepStart),
                sleepEnd: DateTime.fromJSDate(sleep.sleepEnd),
                wakeUpHumor: sleep.wakeUpHumor,
                layDownHumor: sleep.layDownHumor,
                biologicalOccurences: sleep.biologicalOccurences,
                dreams: dreams,
            })

            ResponseSender<string>({ response, status: 201, data: "Sono criado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async update({ request, response, auth }: HttpContext) {
        try {
            const sleep = await request.validateUsing(updateSleepValidator)
            await this.sleepService.Update({
                userId: auth.user!.id,
                id: sleep.id,
                sleepTime: this.calculateSleepTime(sleep.sleepStart, sleep.sleepEnd),
                sleepStart: DateTime.fromJSDate(sleep.sleepStart),
                sleepEnd: DateTime.fromJSDate(sleep.sleepEnd),
                wakeUpHumor: sleep.wakeUpHumor,
                layDownHumor: sleep.layDownHumor,
                biologicalOccurences: sleep.biologicalOccurences,
            })
            ResponseSender<string>({ response, status: 201, data: "Sono atualizado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async get({ params, response, auth }: HttpContext) {
        try {
            const { id } = params
            const sleep = await this.sleepService.GetUserSleep(Number.parseInt(id ?? 0), auth.user!.id)
            if (!sleep) throw new CustomException(404, "Ciclo de sono não encontrado.")
            ResponseSender<Sleep>({ response, data: sleep! })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async list({ request, response }: HttpContext) {
        try {
            const { page, limit = 10, orderBy = "id", orderByDirection = "desc" } = await request.validateUsing(paginationValidator)
            const sleepList = await this.sleepService.List({ page, limit, orderBy, orderByDirection: orderByDirection as any })
            ResponseSender<ModelPaginatorContract<Sleep>>({ response, data: sleepList })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async delete({ params, response }: HttpContext) {
        try {
            const { id } = params
            await this.sleepService.Delete(id)
            ResponseSender<string>({ response, data: "Sono deletado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listByUser({ request, auth, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(listSleepsByUserValidator)
            const sleepListByUser = await this.sleepService.ListByUser(DateTime.fromJSDate(date), auth.user!.id)
            ResponseSender<ListSleepsByUserProps[]>({ response, data: sleepListByUser })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async createSimpleSleep({ request, response, auth }: HttpContext) {
        try {
            const { sleepStart, sleepEnd, sleepId } = await request.validateUsing(createSimpleSleepValidator)

            if (!sleepStart && !sleepEnd)
                throw new CustomException(400, "Nenhuma informação para criação de sono simples informada.")

            await this.sleepService.CreateSimpleSleep({
                sleepStart: DateTime.fromJSDate(sleepStart),
                sleepEnd: DateTime.fromJSDate(sleepEnd),
                userId: auth.user!.id,
                sleepTime: this.calculateSleepTime(sleepStart, sleepEnd),
                sleepId: sleepId,
            })
            ResponseSender<string>({ response, status: 201, data: "Sono simples criado com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async getSimpleSleep({ auth, response }: HttpContext) {
        try {
            const simpleSleep = await this.sleepService.GetSimpleSleep(auth.user!.id)
            ResponseSender<GetSimpleSleepProps>({ response, data: simpleSleep })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listSleepsForDreamCreation({ auth, request, response }: HttpContext) {
        try {
            const { pageNumber } = await request.validateUsing(listSleepsForDreamCreationValidator)
            const sleepsForDreamCreation = await this.sleepService.ListSleepsForDreamCreation(auth.user!.id, pageNumber)
            ResponseSender<ModelPaginatorContract<Sleep>>({ response, status: 200, data: sleepsForDreamCreation })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    private calculateSleepTime(sleepStart: Date, sleepEnd: Date): number {
        const sleepStartDate = DateTime.fromJSDate(sleepStart)
        const sleepEndDate = DateTime.fromJSDate(sleepEnd)

        if (sleepStartDate > sleepEndDate)
            throw new CustomException(400, "Horário de ir dormir e acordar inválido.")

        return sleepEndDate.diff(sleepStartDate, "hours").hours
    }
}