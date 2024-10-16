export type TagInput = {
    title: string
}

export type TagOutput = {
    id: number
} & TagInput

// TIPOS PERSONALIZADOS

export type TagWithQuantity = {
    quantity: number
} & TagOutput