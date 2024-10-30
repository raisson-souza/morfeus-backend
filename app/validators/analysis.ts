import vine from '@vinejs/vine'

/** Valida a criação ou captura de uma estatística de sono ou sonho. */
export const analysisValidator = vine.compile(
    vine.object({
        date: vine.date({ formats: ['YYYY-MM-DD'] }),
    })
)