import { analysisValidator } from '#validators/analysis'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import AnalysisService from '#services/analysis_service'
import DreamAnalysis from '#models/dream_analysis'
import SleepAnalysis from '#models/sleep_analysis'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class AnalysisController {
    constructor(protected analysisService : AnalysisService) { }

    async createDreamAnalysis({ request, auth, response }: HttpContext): Promise<void> {
        const { date } = await request.validateUsing(analysisValidator)
        await this.analysisService.CreateDreamAnalysis(auth.user!.id, DateTime.fromJSDate(date))
        response.status(200).send("Estatística criada com sucesso.")
    }

    async getDreamAnalysis({ request, auth }: HttpContext): Promise<DreamAnalysis | null> {
        const { date } = await request.validateUsing(analysisValidator)
        return await this.analysisService.GetDreamAnalysis(auth.user!.id, DateTime.fromJSDate(date))
    }

    async createSleepAnalysis({ request, auth, response }: HttpContext): Promise<void> {
        const { date } = await request.validateUsing(analysisValidator)
        await this.analysisService.CreateSleepAnalysis(auth.user!.id, DateTime.fromJSDate(date))
        response.status(200).send("Estatística criada com sucesso.")
    }

    async getSleepAnalysis({ request, auth }: HttpContext): Promise<SleepAnalysis | null> {
        const { date } = await request.validateUsing(analysisValidator)
        return await this.analysisService.GetSleepAnalysis(auth.user!.id, DateTime.fromJSDate(date))
    }
}