import vine from '@vinejs/vine'

/** Valida a paginação */
export const paginationValidator = vine.compile(
    vine.object({
        page: vine.number().min(1).max(99),
        limit: vine.number().in([10, 20, 50]).optional(),
        orderBy: vine.string().optional(),
        orderByDirection: vine.string().in(["asc", "desc"]).optional(),
    })
)