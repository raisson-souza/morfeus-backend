import { DateTime } from "luxon"
import { DreamClimateType } from "./dreamClimate.js"

export type DreamInput = {
    sleepId: number
    title: string
    description: string
    dreamPointOfViewId: number
    climate: DreamClimateType
    dreamHourId: number
    dreamDurationId: number
    dreamLucidityLevelId: number
    dreamTypeId: number
    dreamRealityLevelId: number
    eroticDream: boolean
    hiddenDream: boolean
    personalAnalysis: string
    dreamOriginId: number
    isComplete: boolean
}

export type DreamOutput = {
    id : number
} & DreamInput

type BaseDreamCompleteInput = {
    date?: DateTime
    userId?: number
} & DreamInput

export type DreamCompleteInput = {
    tags: string[]
} & BaseDreamCompleteInput

export type DreamUncompleteInput = BaseDreamCompleteInput

export type DreamCompleteUpdateInput = {
    tags: string[]
} & DreamOutput

export type CreateSleepWithDreamInput = {
    tags: string[]
} & DreamInput

export const dreamInputModel: DreamInput = {
    sleepId: 0,
    title: "",
    description: "",
    dreamPointOfViewId: 1,
    climate: {
        ameno: false,
        calor: false,
        garoa: false,
        chuva: false,
        tempestade: false,
        nevoa: false,
        neve: false,
        multiplos: false,
        outro: false,
        indefinido: true
    },
    dreamHourId: 5,
    dreamDurationId: 1,
    dreamLucidityLevelId: 1,
    dreamTypeId: 1,
    dreamRealityLevelId: 1,
    eroticDream: false,
    hiddenDream: false,
    personalAnalysis: "",
    dreamOriginId: 1,
    isComplete: false,
}