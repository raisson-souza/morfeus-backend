import { DateTime } from "luxon"

export type DreamAnalysisInput = {
    month: number
    year: number
    mostPointOfViewOccurence?: string
    mostClimateOccurence?: string | null
    mostHourOccurence?: string
    mostDurationOccurence?: string
    mostLucidityLevelOccurence?: string
    mostDreamTypeOccurence?: string
    mostRealityLevelOccurenceOccurence?: string
    eroticDreamsAverage: number
    tagPerDreamAverage: number
    longestDreamTitle: string
    userId: number
}

export type DreamAnalysisOutput = {
    id: number
} & DreamAnalysisInput

export type SleepAnalysisInput = {
    month: number
    year: number
    dreamsCount: number
    goodWakeUpHumorPercentage: number
    badWakeUpHumorPercentage: number
    goodLayDownHumorPercentage: number
    badLayDownHumorPercentage: number
    mostFrequentWakeUpHumor?: string | null
    leastFrequentWakeUpHumor?: string | null
    mostFrequentLayDownHumor?: string | null
    leastFrequentLayDownHumor?: string | null
    mostFrequentBiologicalOccurence?: string | null
    leastFrequentBiologicalOccurence?: string | null
    mostSleepDuration: number
    leastSleepDuration: number
    averageDreamPerSleep: number
    sleepDurationAverage: number
    mostDreamsPerSleepDate: DateTime
    userId: number
}

export type SleepAnalysisOutput = {
    id: number
} & SleepAnalysisInput

// TIPOS PERSONALIZADOS

/** Tipo de contagem para climas */
export type DreamClimatesCount = {
    ameno: number
    calor: number
    garoa: number
    chuva: number
    tempestade: number
    nevoa: number
    neve: number
    multiplos: number
    outro: number
    indefinido: number
}

/** Tipo para contagem de bom humor */
export type SleepGoodHumorCount = {
    calm: number
    happiness: number
}

/** Tipo para contagem de mau humor */
export type SleepBadHumorCount = {
    anxiety: number
    drowsiness: number
    fear: number
    sadness: number
    tiredness: number
}

/** Tipo para contagem de humores */
export type SleepHumorCount = SleepGoodHumorCount & SleepBadHumorCount

/** Tipo para contagem de ocorrências biológicas */
export type SleepAnalysisBiologicalOccurencesCount = {
    sudorese: number
    bruxismo: number
    apneiaDoSono: number
    ronco: number
    movimentosPeriodicosDosMembros: number
    despertaresParciais: number
    refluxoGastroesofagico: number
    sialorreia: number
    arritmias: number
    mioclonia: number
    parassonia: number
    epistaxe: number
    miccaoInvoluntaria: number
    evacuacaoInvoluntaria: number
    polucao: number
}

/** Tipo para frequência de humor */
export type FrequentHumorAnalysis = {
    humor: string | null
    count: number
}

/** Tipo para frequência de ocorrências biológicas */
export type FrequentBiologicalOccurenceAnalysis = {
    biologicalOccurence: string | null
    count: number
}

/** Tipo para contagem de climas */
export type ClimateCountAnalysis = {
    climate: string | null
    count: number
}

/** Tipo para  */
export type LongestDreamTitleAnalysis = {
    title: string
    count: number
}