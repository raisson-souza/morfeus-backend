import { DateTime } from "luxon"

export type ImportDataJob = {
    fileId: number
    userId: number
}

export type ClearImportFilesJob = { }

export type ExternalDreamType = {
    date: DateTime | null
    title: string
    description: string
    tags: string[]
}