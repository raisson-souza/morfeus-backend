import vine from '@vinejs/vine'

/** Valida a criação de um usuário */
export const createUserValidator = vine.compile(
    vine.object({
        fullName: vine.string().trim(),
        email: vine.string().email(),
        password: vine.string().trim(),
    })
)

/** Valida a atualização de um usuário */
export const updateUserValidator = vine.compile(
    vine.object({
        fullName: vine.string().trim(),
        email: vine.string().email(),
        password: vine.string().trim(),
    })
)

/** Valida o login de um usuário */
export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().trim(),
    })
)

/** Valida a atualização de um usuário */
export const finishAccountRecoveryValidator = vine.compile(
    vine.object({
        email: vine.string().email(),
        password: vine.string().trim(),
        code: vine.string().trim(),
    })
)

/** Valida a exportação de dados de um usuário */
export const exportUserDataValidator = vine.compile(
    vine.object({
        startDate: vine.date({ formats: ['YYYY-MM-DD', 'YYYY/MM/DD'] }),
        endDate: vine.date({ formats: ['YYYY-MM-DD', 'YYYY/MM/DD'] }),
    })
)

/** Valida a importação de dados de um usuário */
export const importUserDataValidator = vine.compile(
    vine.object({
        isSameOriginImport: vine.boolean(),
        dreamsPath: vine.string().trim().nullable(),
    })
)