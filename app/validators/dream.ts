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

/** Valida a busca de sonhos por sono */
export const listDreamBySleepValidator = vine.compile(
    vine.object({
        sleep_id: vine.number().optional(),
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] }).optional(),
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
            noEspecificy: vine.boolean().optional(),
            dreamsWithPersonalAnalysis: vine.boolean().optional(),
            dreamClimates: vine.object({
                ameno: vine.boolean().optional(),
                calor: vine.boolean().optional(),
                garoa: vine.boolean().optional(),
                chuva: vine.boolean().optional(),
                tempestade: vine.boolean().optional(),
                nevoa: vine.boolean().optional(),
                neve: vine.boolean().optional(),
                multiplos: vine.boolean().optional(),
                outro: vine.boolean().optional(),
                indefinido: vine.boolean().optional(),
            }).optional(),
            dreamHourId: vine.number().optional(),
            dreamDurationId: vine.number().optional(),
            dreamLucidityLevelId: vine.number().optional(),
            dreamTypeId: vine.number().optional(),
            dreamRealityLevelId: vine.number().optional(),
        }),
    })
)