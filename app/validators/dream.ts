import vine from '@vinejs/vine'

/** Valida a criação de um sonho completo */
export const createCompleteDreamValidator = vine.compile(
    vine.object({
        /** Sono referente é opcional pois o sonho pode criar o sono */
        sleepId: vine.number().optional(),
        title: vine.string(),
        description: vine.string(),
        dreamPointOfViewId: vine.number(),
        climate: vine.object({
            ameno: vine.boolean(),
            calor: vine.boolean(),
            garoa: vine.boolean(),
            chuva: vine.boolean(),
            tempestade: vine.boolean(),
            nevoa: vine.boolean(),
            neve: vine.boolean(),
            multiplos: vine.boolean(),
            outro: vine.boolean(),
            indefinido: vine.boolean(),
        }),
        dreamHourId: vine.number(),
        dreamDurationId: vine.number(),
        dreamLucidityLevelId: vine.number(),
        dreamTypeId: vine.number(),
        dreamRealityLevelId: vine.number(),
        eroticDream: vine.boolean(),
        hiddenDream: vine.boolean(),
        personalAnalysis: vine.string().optional(),
        tags: vine.array(vine.string()),
        /** Informações para criação de sono caso sleep_id não seja informado */
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }).optional(),
        userId: vine.number().optional(),
    })
)

/** Valida a criação de um sonho incompleto (rápido ou importado) */
export const createUncompleteDreamValidator = vine.compile(
    vine.object({
        title: vine.string(),
        description: vine.string(),
        dreamPointOfViewId: vine.number().optional(),
        climateId: vine.number().optional(),
        dreamHourId: vine.number().optional(),
        dreamDurationId: vine.number().optional(),
        dreamLucidityLevelId: vine.number().optional(),
        dreamTypeId: vine.number().optional(),
        dreamRealityLevelId: vine.number().optional(),
        eroticDream: vine.boolean().optional(),
        hiddenDream: vine.boolean().optional(),
        personalAnalysis: vine.string().optional(),
        dreamOriginId: vine.number(),
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }),
        userId: vine.number(),
    })
)

/** Valida a atualização de um sonho incompleto. */
export const updateCompleteDreamValidator = vine.compile(
    vine.object({
        id: vine.number(),
        sleepId: vine.number(),
        title: vine.string(),
        description: vine.string(),
        dreamPointOfViewId: vine.number(),
        climate: vine.object({
            ameno: vine.boolean(),
            calor: vine.boolean(),
            garoa: vine.boolean(),
            chuva: vine.boolean(),
            tempestade: vine.boolean(),
            nevoa: vine.boolean(),
            neve: vine.boolean(),
            multiplos: vine.boolean(),
            outro: vine.boolean(),
            indefinido: vine.boolean(),
        }),
        dreamHourId: vine.number(),
        dreamDurationId: vine.number(),
        dreamLucidityLevelId: vine.number(),
        dreamTypeId: vine.number(),
        dreamRealityLevelId: vine.number(),
        eroticDream: vine.boolean(),
        hiddenDream: vine.boolean(),
        personalAnalysis: vine.string().optional(),
        tags: vine.array(vine.string())
    })
)