import vine from '@vinejs/vine'

/** Valida a listagem de tags por mês */
export const listTagsValidator = vine.compile(
    vine.object({
        date: vine.date({ formats: ['YYYY/MM/DD', 'YYYY-MM-DD'] })
    })
)

/** Valida a listagem de tags por sonho */
export const listTagsByDreamValidator = vine.compile(
    vine.object({
        dreamId: vine.number().min(1)
    })
)

/** Valida a listagem de sonhos por tag */
export const listDreamsByTagValidator = vine.compile(
    vine.object({
        tagId: vine.number().min(1)
    })
)