export type UserInput = {
    fullName : string
    email : string
    password : string
}

export type UserOutput = {
    id : number
} & UserInput

// TIPOS PERSONALIZADOS

export type UserModalAccountRecovery = {
    email: string
    password: string
    code: string
}