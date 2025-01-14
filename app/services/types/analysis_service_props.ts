import { DateTime } from "luxon"
import DreamAnalysis from "#models/dream_analysis"
import SleepAnalysis from "#models/sleep_analysis"

export default interface AnalysisServiceProps {
    /** Cria uma análise de sonhos */
    CreateDreamAnalysis(userId: number, date: DateTime): Promise<void>
    /** Captura uma análise de sonhos */
    GetDreamAnalysis(userId: number, date: DateTime): Promise<DreamAnalysis>
    /** Cria uma análise de sono */
    CreateSleepAnalysis(userId: number, date: DateTime): Promise<void>
    /** Captura uma análise de sono */
    GetSleepAnalysis(userId: number, date: DateTime): Promise<SleepAnalysis>
}