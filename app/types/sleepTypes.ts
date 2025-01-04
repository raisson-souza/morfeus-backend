import { BiologicalOccurencesType } from "./biologicalOccurences.js"
import { CreateSleepWithDreamInput } from "./dreamTypes.js"
import { DateTime } from "luxon"
import { SleepHumorType } from "./sleepHumor.js"

export type SleepInput = {
    userId: number
    date: DateTime
    sleepTime: number
    sleepStart: DateTime
    sleepEnd: DateTime
    isNightSleep: boolean
    wakeUpHumor: SleepHumorType
    layDownHumor: SleepHumorType
    biologicalOccurences: BiologicalOccurencesType
}

export type SleepOutput = {
    id : number
} & SleepInput

// TIPOS PERSONALIZADOS

/** Tipo de sono com sonhos integrados com tags para criação de sono */
export type SleepCreationInput = {
    userId: number
    sleepTime: number
    sleepStart: DateTime
    sleepEnd: DateTime
    wakeUpHumor: SleepHumorType
    layDownHumor: SleepHumorType
    biologicalOccurences: BiologicalOccurencesType
    dreams: CreateSleepWithDreamInput[]
}

export type SleepUpdateProps = {
    id: number
    userId: number
    sleepTime: number
    sleepStart: DateTime
    sleepEnd: DateTime
    wakeUpHumor: SleepHumorType
    layDownHumor: SleepHumorType
    biologicalOccurences: BiologicalOccurencesType
}

export type CreateSimpleSleepProps = {
    userId: number
    sleepId?: number
    sleepStart: DateTime
    sleepEnd: DateTime
    sleepTime: number
}

export type GetSimpleSleepProps = {
    sleepId: number | null
    sleepStart: DateTime | null
    sleepEnd: DateTime | null
}

/** Tipo para retorno na listagem de sonos por usuário */
export type ListSleepsByUserProps = {
    id: number
    date: DateTime
    sleepTime: number
    sleepStart: DateTime
    sleepEnd: DateTime
    isNightSleep: boolean
}

/** Tipo sono com listagem dos IDs de sonho */
export type SleepWithDreamsIds = {
    dreamsId: number[]
} & SleepOutput

export type SleepForDreamCreation = {
    id: number
    date: DateTime
    sleepStart: DateTime
    sleepEnd: DateTime
}

export const sleepInputModel : SleepInput = {
    userId: 0,
    date: DateTime.now(),
    sleepTime: 0,
    sleepStart: DateTime.now(),
    sleepEnd: DateTime.now(),
    isNightSleep: true,
    wakeUpHumor: {
        undefinedHumor: false,
        calm: false,
        drowsiness: false,
        tiredness: false,
        anxiety: false,
        happiness: false,
        fear: false,
        sadness: false,
        other: false
    },
    layDownHumor: {
        undefinedHumor: false,
        calm: false,
        drowsiness: false,
        tiredness: false,
        anxiety: false,
        happiness: false,
        fear: false,
        sadness: false,
        other: false
    },
    biologicalOccurences: {
        sudorese: false,
        bruxismo: false,
        apneiaDoSono: false,
        ronco: false,
        movimentosPeriodicosDosMembros: false,
        despertaresParciais: false,
        refluxoGastroesofagico: false,
        sialorreia: false,
        arritmias: false,
        mioclonia: false,
        parassonia: false,
        epistaxe: false,
        miccaoInvoluntaria: false,
        evacuacaoInvoluntaria: false,
        polucao: false
    }
}