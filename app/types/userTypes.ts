import { BiologicalOccurencesType } from "./biologicalOccurences.js"
import { DateTime } from "luxon"
import { DreamClimateType } from "./dreamClimate.js"
import { SleepHumorType } from "./sleepHumor.js"

export type UserInput = {
    fullName : string
    email : string
    password : string
}

export type UserOutput = {
    id : number
} & UserInput

// TIPOS PERSONALIZADOS

export type UserModalAccountRecovery = {
    email: string
    password: string
    code: string
}

export type ExportUserDataSleeps = {
    id: number
    date: DateTime
    sleepTime: number
    sleepStart: DateTime
    sleepEnd: DateTime
    isNightSleep: boolean
    wakeUpHumor: SleepHumorType
    layDownHumor: SleepHumorType
    biologicalOccurences: BiologicalOccurencesType
}

export type ExportUserDataDreams = {
    id: number
    title: string
    description:  string
    climate: DreamClimateType
    eroticDream: boolean
    hiddenDream: boolean
    personalAnalysis:  string | null
    dreamOriginId: number
    dreamPointOfViewId: number
    dreamHourId: number
    dreamDurationId: number
    dreamLucidityLevelId: number
    dreamTypeId: number
    dreamRealityLevelId: number
    sleepId: number
    dreamTags: string[]
}

export type ExportUserData = {
    sleeps: ExportUserDataSleeps[]
    dreams: ExportUserDataDreams[]
}

export type SyncRecordsDaysPeriodOverrideType = {
    start: DateTime<true>
    end: DateTime<true>
}