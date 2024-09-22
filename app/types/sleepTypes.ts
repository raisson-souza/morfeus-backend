import { BiologicalOccurencesType } from "./biologicalOccurences.js"
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