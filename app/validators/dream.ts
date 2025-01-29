import vine from '@vinejs/vine'

/** Valida a criação de um sonho completo */
export const createCompleteDreamValidator = vine.compile(
    vine.object({
        sleepId: vine.number().nullable(),
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
        personalAnalysis: vine.string().nullable(),
        tags: vine.array(vine.string()),
        /** Informações para criação de sono caso sleep_id não seja informado */
        dreamNoSleepDateKnown: vine.object({
            date: vine.date({ formats: ['YYYY/MM/DD'] }),
            period: vine.string().in(["morning", "afternoon", "night"]),
        }).nullable(),
        dreamNoSleepTimeKnown: vine.object({
            date: vine.date({ formats: ['YYYY/MM/DD'] }),
            sleepStart: vine.date({ formats: ['YYYY/MM/DD HH:mm:ss'] }),
            sleepEnd: vine.date({ formats: ['YYYY/MM/DD HH:mm:ss'] }),
        }).nullable(),
    })
)

/** Valida a criação de um sonho incompleto (rápido ou importado) */
export const createUncompleteDreamValidator = vine.compile(
    vine.object({
        title: vine.string(),
        description: vine.string(),
        dreamPointOfViewId: vine.number().nullable(),
        climateId: vine.number().nullable(),
        dreamHourId: vine.number().nullable(),
        dreamDurationId: vine.number().nullable(),
        dreamLucidityLevelId: vine.number().nullable(),
        dreamTypeId: vine.number().nullable(),
        dreamRealityLevelId: vine.number().nullable(),
        eroticDream: vine.boolean().nullable(),
        hiddenDream: vine.boolean().nullable(),
        personalAnalysis: vine.string().nullable(),
        dreamOriginId: vine.number(),
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }),
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
        personalAnalysis: vine.string().nullable(),
        tags: vine.array(vine.string())
    })
)

/** Valida a busca de sonhos por sono */
export const listDreamBySleepValidator = vine.compile(
    vine.object({
        sleep_id: vine.number(),
    })
)

export const listDreamsByUserValidator = vine.compile(
    vine.object({
        /** Data para extração do mês para a filtragem */
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }),
        /** Filtro único por característica de sonho */
        dreamCaracteristicsFilter: vine.string().in(["all", "allNotHidden", "allNotErotic", "allNotHiddenAndErotic", "allHidden", "allErotic"]),
        /** Filtro único por origem do sonho */
        dreamOriginFilter: vine.string().in(["all", "completeDreams", "fastDreams", "importedDreams"]),
        /** Filtro acumulativo por característica específica de sonho */
        dreamEspecificCaracteristicsFilter: vine.object({
            /** Sem especificação de característica (ignora outras filtragens acumulativas) */
            noEspecificy: vine.boolean().nullable(),
            dreamsWithPersonalAnalysis: vine.boolean().nullable(),
            dreamClimates: vine.object({
                ameno: vine.boolean().nullable(),
                calor: vine.boolean().nullable(),
                garoa: vine.boolean().nullable(),
                chuva: vine.boolean().nullable(),
                tempestade: vine.boolean().nullable(),
                nevoa: vine.boolean().nullable(),
                neve: vine.boolean().nullable(),
                multiplos: vine.boolean().nullable(),
                outro: vine.boolean().nullable(),
                indefinido: vine.boolean().nullable(),
            }).nullable(),
            dreamHourId: vine.number().nullable(),
            dreamDurationId: vine.number().nullable(),
            dreamLucidityLevelId: vine.number().nullable(),
            dreamTypeId: vine.number().nullable(),
            dreamRealityLevelId: vine.number().nullable(),
            dreamPointOfViewId: vine.number().nullable(),
        }),
    })
)