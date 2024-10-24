import { BiologicalOccurencesType } from "./biologicalOccurences.js"
import { CreateSleepWithDreamInput } from "./dreamTypes.js"
import { DateTime } from "luxon"
import { SleepHumorType } from "./sleepHumor.js"

export type SleepInput = {
    userId: number
    date: DateTime
    sleepTime?: number
    sleepStart?: DateTime
    sleepEnd?: DateTime
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

export type CreateSimpleSleepProps = {
    userId: number
    date: DateTime
    sleepStart?: DateTime
    sleepEnd?: DateTime
}

export type GetSimpleSleepProps = {
    sleepStart: DateTime | null
    sleepEnd: DateTime | null
}

/** Tipo para retorno na listagem de sonos por usuário */
export type ListSleepsByUserProps = {
    date: DateTime
    hoursSlept?: number
    wakeUpHumor?: SleepHumorType
    layDownHumor?: SleepHumorType
    biologicalOccurrences?: BiologicalOccurencesType
    dreamsQuantity: number
}

export const sleepInputModel : SleepInput = {
    userId: 0,
    date: DateTime.now(),
    sleepTime: undefined,
    sleepStart: undefined,
    sleepEnd: undefined,
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