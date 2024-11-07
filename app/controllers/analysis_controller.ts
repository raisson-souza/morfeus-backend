import { analysisValidator } from '#validators/analysis'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import AnalysisService from '#services/analysis_service'
import DreamAnalysis from '#models/dream_analysis'
import ResponseSender from '../functions/core/ResponseMessage.js'
import SleepAnalysis from '#models/sleep_analysis'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AnalysisController {
    constructor(protected analysisService : AnalysisService) { }

    async createDreamAnalysis({ request, auth, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(analysisValidator)
            await this.analysisService.CreateDreamAnalysis(auth.user!.id, DateTime.fromJSDate(date))
            ResponseSender<string>({ response, status: 201, data: "Estatística criada com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async getDreamAnalysis({ request, auth, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(analysisValidator)
            const dreamAnalysis = await this.analysisService.GetDreamAnalysis(auth.user!.id, DateTime.fromJSDate(date))
            ResponseSender<DreamAnalysis | null>({ response, data: dreamAnalysis })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async createSleepAnalysis({ request, auth, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(analysisValidator)
            await this.analysisService.CreateSleepAnalysis(auth.user!.id, DateTime.fromJSDate(date))
            ResponseSender<string>({ response, status: 201, data: "Estatística criada com sucesso." })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async getSleepAnalysis({ request, auth, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(analysisValidator)
            const sleepAnalysis = await this.analysisService.GetSleepAnalysis(auth.user!.id, DateTime.fromJSDate(date))
            ResponseSender<SleepAnalysis | null>({ response, data: sleepAnalysis })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }
}