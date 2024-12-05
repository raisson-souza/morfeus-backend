import vine from '@vinejs/vine'

/** Valida a criação de um sono */
export const createSleepValidator = vine.compile(
    vine.object({
        sleepStart: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
        sleepEnd: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
        wakeUpHumor: vine.object({
            undefinedHumor: vine.boolean(),
            calm: vine.boolean(),
            drowsiness: vine.boolean(),
            tiredness: vine.boolean(),
            anxiety: vine.boolean(),
            happiness: vine.boolean(),
            fear: vine.boolean(),
            sadness: vine.boolean(),
            other: vine.boolean(),
        }),
        layDownHumor: vine.object({
            undefinedHumor: vine.boolean(),
            calm: vine.boolean(),
            drowsiness: vine.boolean(),
            tiredness: vine.boolean(),
            anxiety: vine.boolean(),
            happiness: vine.boolean(),
            fear: vine.boolean(),
            sadness: vine.boolean(),
            other: vine.boolean(),
        }),
        biologicalOccurences: vine.object({
            sudorese: vine.boolean(),
            bruxismo: vine.boolean(),
            apneiaDoSono: vine.boolean(),
            ronco: vine.boolean(),
            movimentosPeriodicosDosMembros: vine.boolean(),
            despertaresParciais: vine.boolean(),
            refluxoGastroesofagico: vine.boolean(),
            sialorreia: vine.boolean(),
            arritmias: vine.boolean(),
            mioclonia: vine.boolean(),
            parassonia: vine.boolean(),
            epistaxe: vine.boolean(),
            miccaoInvoluntaria: vine.boolean(),
            evacuacaoInvoluntaria: vine.boolean(),
            polucao: vine.boolean(),
        }),
        dreams: vine.array(
            vine.object({
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
        ).optional()
    })
)

/** Valida a atualização de um sono */
export const updateSleepValidator = vine.compile(
    vine.object({
        id: vine.number(),
        sleepStart: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
        sleepEnd: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
        wakeUpHumor: vine.object({
            undefinedHumor: vine.boolean(),
            calm: vine.boolean(),
            drowsiness: vine.boolean(),
            tiredness: vine.boolean(),
            anxiety: vine.boolean(),
            happiness: vine.boolean(),
            fear: vine.boolean(),
            sadness: vine.boolean(),
            other: vine.boolean(),
        }),
        layDownHumor: vine.object({
            undefinedHumor: vine.boolean(),
            calm: vine.boolean(),
            drowsiness: vine.boolean(),
            tiredness: vine.boolean(),
            anxiety: vine.boolean(),
            happiness: vine.boolean(),
            fear: vine.boolean(),
            sadness: vine.boolean(),
            other: vine.boolean(),
        }),
        biologicalOccurences: vine.object({
            sudorese: vine.boolean(),
            bruxismo: vine.boolean(),
            apneiaDoSono: vine.boolean(),
            ronco: vine.boolean(),
            movimentosPeriodicosDosMembros: vine.boolean(),
            despertaresParciais: vine.boolean(),
            refluxoGastroesofagico: vine.boolean(),
            sialorreia: vine.boolean(),
            arritmias: vine.boolean(),
            mioclonia: vine.boolean(),
            parassonia: vine.boolean(),
            epistaxe: vine.boolean(),
            miccaoInvoluntaria: vine.boolean(),
            evacuacaoInvoluntaria: vine.boolean(),
            polucao: vine.boolean(),
        }),
    })
)

export const createSimpleSleepValidator = vine.compile(
    vine.object({
        sleepId: vine.number().optional(),
        sleepStart: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
        sleepEnd: vine.date({ formats: ['YYYY-MM-DD HH:mm:ss', 'YYYY/MM/DD HH:mm:ss'] }),
    })
)

/** Valida a listagem de sonos por usuário */
export const listSleepsByUserValidator = vine.compile(
    vine.object({
        /** Data para extração do mês para a filtragem */
        date: vine.date({ formats: ['YYYY-MM-DD'] }),
    })
)

export const listSleepsForDreamCreationValidator = vine.compile(
    vine.object({
        pageNumber: vine.number().min(1),
    })
)