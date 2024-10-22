import { DateTime } from "luxon"
import { DreamClimateType } from "./dreamClimate.js"
import { LucidRow } from "@adonisjs/lucid/types/model"
import { TagOutput } from "./TagTypes.js"

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
    personalAnalysis?: string
    dreamOriginId: number
    isComplete: boolean
}

export type DreamOutput = {
    id : number
} & DreamInput

// TIPOS PERSONALIZADOS

/** Tipo de sonho para criação de sonho completo */
type BaseDreamCompleteInput = {
    date?: DateTime
    userId?: number
} & DreamInput

/** Tipo de sonho com tags (apenas título) */
export type DreamCompleteInput = {
    tags: string[]
} & BaseDreamCompleteInput

/** Tipo de sonho para criação de sonho não completo */
export type DreamUncompleteInput = BaseDreamCompleteInput

/** Tipo de sonho com tags (apenas título) para atualização de sonho */
export type DreamCompleteUpdateInput = {
    tags: string[]
} & DreamOutput

/** Tipo de sono com tags (apenas título) para criação de sonho dentro da criação de sono */
export type CreateSleepWithDreamInput = {
    tags: string[]
} & DreamInput

/** Tipo de sonho integrado com lista de tags */
export type DreamWithTags = {
    tags: {
        tagId: number
        tagTitle: string
    }[]
} & DreamInput

export type ListDreamsByUser = {
    /** ID do usuário */
    userId: number
    /** Filtro único por característica de sonho */
    dreamCaracteristicsFilter: "all" | "allNotHidden" | "allNotErotic" | "allNotHiddenAndErotic" | "allHidden" | "allErotic"
    /** Filtro único por origem do sonho */
    dreamOriginFilter: "all" | "completeDreams" | "fastDreams" | "importedDreams"
    /** Filtro acumulativo por característica específica de sonho */
    dreamEspecificCaracteristicsFilter: {
        /** Sem especificação de característica (ignora outras filtragens acumulativas) */
        noEspecificy?: boolean
        dreamsWithPersonalAnalysis?: boolean
        dreamClimates?: DreamClimateType
        dreamHourId?: number
        dreamDurationId?: number
        dreamLucidityLevelId?: number
        dreamTypeId?: number
        dreamRealityLevelId?: number
        dreamPointOfViewId?: number
    }
    /** Data para extração do mês para a filtragem */
    date: DateTime
} 

/** Retorno dos sonhos listados por usuário */
export type DreamListedByUser = {
    id: number
    title: string
    /** Descrição curta do sonho */
    shortDescription: string
    date: DateTime
    tags: TagOutput[]
}

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
    personalAnalysis: undefined,
    dreamOriginId: 1,
    isComplete: false,
}