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
    dreams: CreateSleepWithDreamInput[]
} & SleepInput

export const sleepInputModel : SleepInput = {
    userId: 0,
    date: DateTime.now(),
    sleepTime: 0,
    sleepStart: DateTime.now(),
    sleepEnd: DateTime.now(),
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