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
        fullName: vine.string().trim(),
        email: vine.string().email(),
        password: vine.string().trim().alphaNumeric(),
    })
)

export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().trim().alphaNumeric(),
    })
)