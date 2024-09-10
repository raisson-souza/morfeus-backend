import vine from '@vinejs/vine'

/** Valida a criação de um usuário */
export const createUserValidator = vine.compile(
    vine.object({
        fullName: vine.string().trim(),
        email: vine.string().email(),
        password: vine.string().trim().alphaNumeric(),
    })
)

export const updateUserValidator = vine.compile(
    vine.object({
        id: vine.number(),
        fullName: vine.string().trim(),
        email: vine.string().email(),
        password: vine.string().trim().alphaNumeric(),
    })
)