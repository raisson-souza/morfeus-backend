import { ClearImportFilesJob, ImportDataJob } from './types/importDataTypes.js'
import { DateTime } from 'luxon'
import { DreamTagInput } from '../types/DreamTagTypes.js'
import { ExportUserData, ExportUserDataDreams, ExportUserDataSleeps } from '../types/userTypes.js'
import { Job, Worker } from 'bullmq'
import { TagInput } from '../types/TagTypes.js'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import Dream from '#models/dream'
import DreamTag from '#models/dream_tag'
import EmailSender from '../utils/EmailSender.js'
import File from '#models/file'
import fs from 'node:fs/promises'
import redisConnection from '#config/queue'
import Sleep from '#models/sleep'
import Tag from '#models/tag'
import User from '#models/user'

type ImportProcessEmailMessages = {
    errorOnSleepCreation: boolean
    errorOnDreamCreation: boolean
    dreamsWithNoSleep: boolean
    dreamsWithNoTags: boolean
    totalFailureOnImportProcess: boolean
}

type DreamTagImportType = {
    tags: string[]
    dreamId: number
}

class ImportDataWorkers {
    constructor() {
        new Worker<ImportDataJob, any, string>("importData", this.importData, { connection: redisConnection })
        new Worker<ClearImportFilesJob, any, string>("clearImportFiles", this.clearImportFiles, { connection: redisConnection })
    }

    private async importData(job: Job<ImportDataJob, any, string>) {
        console.log(`${ DateTime.now().toISO() } - JOB importData`)
        const emailMessages: ImportProcessEmailMessages = {
            errorOnSleepCreation: false,
            errorOnDreamCreation: false,
            dreamsWithNoSleep: false,
            dreamsWithNoTags: false,
            totalFailureOnImportProcess: false,
        }

        const user = await User
            .find(job.data.userId)
            .then(result => {
                return {
                    "name": result?.fullName ?? "",
                    "email": result?.email ?? "",
                }
            })

        try {
            const { userId, fileId } = job.data

            const failJob = async (finish: boolean = false) => {
                if (finish) await finishFile()
            }

            const file = await File.find(fileId)

            if (!file)
                return await failJob()

            if (file!.finished)
                return await failJob()

            const finishFile = async () => {
                await File.updateOrCreate(
                    { id: file.id },
                    { ...file.toJSON(), finished: true },
                )
            }

            const fileExpired = file!.expiresAt.diff(file!.createdAt, "days").days <= 0

            if (fileExpired)
                return await failJob(true)

            const filePath = app.makePath('uploads', file.fileName)
            await fs.readFile(filePath, "utf8")
                .then(async (data) => {
                    try {
                        if (file.isSameOriginImport) {
                            const sameOriginImport: ExportUserData = JSON.parse(data)
                            data = ""
                            await ImportDataWorkers.importSleeps(userId, sameOriginImport.sleeps, sameOriginImport.dreams, emailMessages)
                            sameOriginImport.sleeps = []
                            await ImportDataWorkers.importDreams(userId, sameOriginImport.dreams, emailMessages)
                            sameOriginImport.dreams = []
                        }
                        else {
                            if (file.dreamsPath) {
                                const importDreams = ImportDataWorkers.tryParseExternalDreams(data, file.dreamsPath, emailMessages)
                                await ImportDataWorkers.importExternalDreams(userId, importDreams, emailMessages)
                                return
                            }
                            await failJob(true)
                        }
                    }
                    catch (ex) {
                        await failJob(true)
                    }
                })
                .catch(ex => {
                    throw new Error(ex.message)
                })

            const emailMessage = ImportDataWorkers.mountEmailMessage(true, emailMessages)
            await EmailSender.Send({
                subject: "Finalização da importação de dados",
                text: `Olá ${ user.name }, o processo de importação de dados solicitado acabou de finalizar.\n${ emailMessage }`,
                to: user.email,
            })

            await finishFile()
        }
        catch (ex) {
            console.log(`Erro em importData:\m ${ ex.message }`)
            const emailMessage = ImportDataWorkers.mountEmailMessage(false, emailMessages)
            await EmailSender.Send({
                subject: "Finalização da importação de dados",
                text: `Olá ${ user.name }, o processo de importação de dados solicitado acabou de finalizar.\n${ emailMessage }`,
                to: user.email,
            })
        }
    }

    private async clearImportFiles(_: Job<ClearImportFilesJob, any, string>) {
        try {
            console.log(`${ DateTime.now().toISO() } - JOB clearImportFiles`)

            const deleteFile = async (fileName: string) => {
                try {
                    const filePath = app.makePath('uploads', fileName)
                    await fs.rm(filePath)
                }
                catch { }
            }

            // Registros não finalizados são buscados para validar a expiração e deletar o arquivo
            const notFinishedFiles = await File.query()
                .where("finished", false)
                .orderBy("id", "desc")

            if (notFinishedFiles.length > 0) {
                for (const notFinishedFile of notFinishedFiles) {
                    const isFileExpired = notFinishedFile.expiresAt.diff(notFinishedFile.createdAt, "days").days <= 0

                    if (isFileExpired) {
                        await deleteFile(notFinishedFile.fileName)
                        await File.query()
                            .where("id", notFinishedFile.id)
                            .update({ ...notFinishedFile.toJSON(), finished: true, fileDeleted: true })
                    }
                }
            }
            notFinishedFiles.length = 0

            // Registros já finalizados, porém com o arquivo não deletado são buscados para efetuar a exclusão
            const finishedNotDeletedFiles = await File.query()
                .where("finished", true)
                .andWhere("file_deleted", false)
                .orderBy("id", "desc")

            if (finishedNotDeletedFiles.length > 0) {
                for (const finishedNotDeletedFile of finishedNotDeletedFiles) {
                    await deleteFile(finishedNotDeletedFile.fileName)
                    await File.query()
                        .where("id", finishedNotDeletedFile.id)
                        .update({ ...finishedNotDeletedFile.toJSON(), fileDeleted: true })
                }
            }
            finishedNotDeletedFiles.length = 0

            // Todos os arquivos ainda presentes em UPLOADS são catalogados e informados pelo sistema
            const uploadsDirPath = app.makePath('uploads')
            const importFilesQuantity = (await fs.readdir(uploadsDirPath)).length

            if (importFilesQuantity > 0) {
                await EmailSender.SendInternal({
                    subject: `ClearImportFiles JOB ${ importFilesQuantity >= 50 ? "- MUITOS ARQUIVOS" : "" }`,
                    text: `${ DateTime.now().toISO() } - ${ importFilesQuantity } arquivos ainda não deletados na pasta uploads.`
                })
            }
        }
        catch (ex) {
            console.log(`Erro em clearImportFiles:\m ${ ex.message }`)
        }
    }

    static async importSleeps(userId: number, sleeps: ExportUserDataSleeps[], dreams: ExportUserDataDreams[], emailMessages: ImportProcessEmailMessages) {
        const updateDreamsIds = (originalSleepId: number, dbSleepId: number) => {
            dreams.map((dream, i) => {
                if (dream.sleepId === originalSleepId)
                    dreams[i].sleepId = dbSleepId
            })
        }

        await db.transaction(async trx => {
            for (const sleep of sleeps) {
                try {
                    sleep.date = DateTime.fromISO(sleep.date as any)
                    sleep.sleepStart = DateTime.fromISO(sleep.sleepStart as any)
                    sleep.sleepEnd = DateTime.fromISO(sleep.sleepEnd as any)
                    sleep.sleepTime = ImportDataWorkers.calculateSleepTime(sleep.sleepStart, sleep.sleepEnd)

                    const sameSleepIntervalSleeps = await ImportDataWorkers.getSameSleepIntervalSleeps(userId, sleep.date, sleep.sleepStart, sleep.sleepEnd)

                    if (sameSleepIntervalSleeps.length > 0) {
                        updateDreamsIds(sleep.id, sameSleepIntervalSleeps[0].id)
                        continue
                    }

                    const { id, ...sleepModel } = sleep

                    const newSleepId = await Sleep.create({ ...sleepModel, userId: userId }, { client: trx })
                        .then(result => result.id)
                    updateDreamsIds(sleep.id, newSleepId)
                }
                catch {
                    emailMessages.errorOnDreamCreation = true
                }
            }
        })
    }

    static async getSameSleepIntervalSleeps(userId: number, newSleepDate: DateTime<boolean>, newSleepStart: DateTime<boolean>, newSleepEnd: DateTime<boolean>) {
        const yesterday = newSleepDate.minus({ day: 1 })
        const tomorrow = newSleepDate.plus({ day: 1 })

        const sameDateSleeps = await Sleep.query()
            .where("user_id", userId)
            .andWhereRaw(`EXTRACT(YEAR FROM sleeps.date) = ${ newSleepDate.year }`)
            .andWhereRaw(`EXTRACT(MONTH FROM sleeps.date) = ${ newSleepDate.month }`)
            .andWhere(query => {
                query
                    .whereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ newSleepDate.day }`)
                    .orWhereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ yesterday.day }`)
                    .orWhereRaw(`EXTRACT(DAY FROM sleeps.date) = ${ tomorrow.day }`)
            })

        const sleepPeriodsConflicts: Sleep[] = []

        sameDateSleeps.map(sameDateSleep => {
            if (ImportDataWorkers.checkSleepPeriod(sameDateSleep, newSleepStart.toMillis(), newSleepEnd.toMillis()))
                sleepPeriodsConflicts.push(sameDateSleep)
        })

        return sleepPeriodsConflicts
    }

    static checkSleepPeriod(sleep: Sleep, sleepStartEpoch: number, sleepEndEpoch: number): boolean {
        const dbSleepStartEpoch = sleep.sleepStart.toMillis()
        const dbSleepEndEpoch = sleep.sleepEnd.toMillis()

        return (
            // o novo sono inicia antes do inicio sono e termina antes do fim
            (
                dbSleepStartEpoch >= sleepStartEpoch &&
                dbSleepStartEpoch <= sleepEndEpoch &&
                dbSleepEndEpoch >= sleepEndEpoch
            ) ||
            // o novo sono inicia após o inicio do sono e termina antes do fim
            (
                dbSleepStartEpoch >= sleepStartEpoch &&
                dbSleepEndEpoch <= sleepEndEpoch
            ) ||
            // o novo sono inicia antes do inicio do sono e termina após o fim
            (
                dbSleepStartEpoch <= sleepStartEpoch &&
                dbSleepEndEpoch >= sleepEndEpoch
            ) ||
            // o novo sono inicia após o inicio do sono e termina após o fim
            (
                dbSleepStartEpoch <= sleepStartEpoch &&
                dbSleepEndEpoch >= sleepStartEpoch &&
                dbSleepEndEpoch <= sleepEndEpoch
            )
        )
    }

    static calculateSleepTime(sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>): number {
        if (sleepStart > sleepEnd)
            throw new Error("Horário de ir dormir e acordar inválido.")

        return sleepEnd.diff(sleepStart, "hours").hours
    }

    static async importDreams(userId: number, dreams: ExportUserDataDreams[], emailMessages: ImportProcessEmailMessages) {
        const dreamTagsImport: DreamTagImportType[] = []

        await db.transaction(async trx => {
            let dreamsNoSleep: ExportUserDataDreams[] = []

            for (const dream of dreams) {
                try {
                    const isDreamInDb = await Dream.query()
                        .innerJoin("sleeps", "sleeps.id", "dreams.sleep_id")
                        .where("title", dream.title)
                        .andWhereNot("sleeps.user_id", "!=", userId)
                        .select("dreams.id")
                        .first()
                        .then(result => result != null)

                    if (!isDreamInDb) {
                        const sleepsExists = await Sleep
                            .query()
                            .where("id", dream.sleepId)
                            .andWhere("user_id", userId)
                            .first()
                            .then(result => result != null)

                        if (!sleepsExists) {
                            dreamsNoSleep.push({
                                ...dream,
                                sleepId: 0,
                            })
                            continue
                        }

                        const { id, ...dreamModel } = dream

                        const newDreamId = await Dream.create(dreamModel, { client: trx })
                            .then(result => result.id)
                        dreamTagsImport.push({ dreamId: newDreamId, tags: dream.dreamTags })
                    }
                }
                catch {
                    emailMessages.errorOnDreamCreation = true
                }
            }

            if (dreamsNoSleep.length > 0)
                emailMessages.dreamsWithNoSleep = true

            const lastSleepId = await Sleep.query()
                .where("user_id", userId)
                .orderBy("date", "desc")
                .first()
                .then(async (result) => {
                    if (!result) {
                        const yesterday = DateTime.now().minus({ days: 1 })
                        const newSleepId = await Sleep.create({
                            date: yesterday,
                            sleepTime: 1,
                            sleepStart: yesterday.set({ hour: 1 }),
                            sleepEnd: yesterday,
                            isNightSleep: (yesterday.hour >= 0 && yesterday.hour <= 11) || (yesterday.hour >= 18 && yesterday.hour <= 23),
                            userId: userId,
                        }).then(result => result.id)
                        return newSleepId
                    }
                    return result.id
                })

            for (const dreamNoSleep of dreamsNoSleep) {
                try {
                    dreamNoSleep.sleepId = lastSleepId
                    const { id, ...dreamModel } = dreamNoSleep
                    const newDreamId = await Dream.create(dreamModel, { client: trx })
                        .then(result => result.id)
                    dreamTagsImport.push({ dreamId: newDreamId, tags: dreamNoSleep.dreamTags })
                }
                catch {
                    emailMessages.errorOnDreamCreation = true
                }
            }
            dreamsNoSleep = []
        })

        await db.transaction(async (trx) => {
            for (const dreamTagImport of dreamTagsImport) {
                try {
                    await ImportDataWorkers.manageTags(dreamTagImport.tags, dreamTagImport.dreamId, trx)
                }
                catch {
                    emailMessages.dreamsWithNoTags = true
                }
            }
        })
    }

    static async manageTags(newTags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
        const oldTags = await db.query()
            .from("dream_tags")
            .innerJoin("tags", "tags.id", "dream_tags.tag_id")
            .where("dream_id", dreamId)
            .select("dream_tags.id as dreamTagId", "tags.id as id", "tags.title as title")
            .then(result => {
                return result.map(row => {
                    return {
                        "dreamTagId": Number.parseInt(row["dreamTagId"]),
                        "title": row["title"] as string,
                    }
                })
            })

        for (const oldTag of oldTags) {
            if (!newTags.includes(oldTag.title)) {
                await DreamTag.query()
                    .where("id", oldTag.dreamTagId)
                    .delete()
            }
        }

        for (const tag of newTags) {
            let tagId: null | number = null
            await Tag.findBy('title', tag.toUpperCase(), { client: trx })
                .then(result => { if (result) tagId = result.id})

            if (!tagId) {
                const tagModel: TagInput = { title: tag.toUpperCase() }
                const newTag = await Tag.create(tagModel, { client: trx })
                tagId = newTag.id
            }

            const isTagAttached = await DreamTag
                .query({ client: trx })
                .where('tag_id', tagId)
                .andWhere('dream_id', dreamId)
                .select('id')
                .then(tagsAttached => tagsAttached.length > 0)

            if (!isTagAttached) {
                const dreamTagModel: DreamTagInput = {
                    dreamId: dreamId,
                    tagId: tagId
                }
                await DreamTag.create(dreamTagModel, { client: trx })
            }
        }
    }

    static async importExternalDreams(userId: number, dreams: any[], emailMessages: ImportProcessEmailMessages) {
        // TODO: Próximo desenvolvimento
    }

    static tryParseExternalDreams(data: string, dreamsPath: string, emailMessages: ImportProcessEmailMessages): any[] {
        try {
            const dreamsPathList = dreamsPath.split("/")
            let parsedData = JSON.parse(data)

            dreamsPathList.map(path => {
                parsedData = parsedData[path]
            })

            return parsedData
        }
        catch {
            emailMessages.totalFailureOnImportProcess = true
            throw new Error("Não foi possível encontrar os sonhos no arquivo de importação.")
        }
    }

    static mountEmailMessage(success: boolean, emailMessages: ImportProcessEmailMessages): string {
        const messages: string[] = []

        messages.push(
            success
                ? "O processo de importação ocorreu com sucesso!"
                : "O processo de importação não foi efetuado devido a um erro desconhecido, por favor, valide seu arquivo de importação ou a forma!"
        )

        if (
            emailMessages.totalFailureOnImportProcess ||
            emailMessages.errorOnSleepCreation ||
            emailMessages.errorOnDreamCreation ||
            emailMessages.dreamsWithNoSleep ||
            emailMessages.dreamsWithNoTags
        ) {
            messages.push(`${ success ? "Apesar do sucesso na importação," : "Durante a importação" } um ou mais erros ocorreram durante o processo:`)
        }

        if (emailMessages.totalFailureOnImportProcess)
            messages.push("Houve uma falha geral no processo de importação e nenhum registro foi importado, verifique seu arquivo de importação ou tente novamente.")
        else {
            if (emailMessages.errorOnSleepCreation)
                messages.push("Ocorreu um erro ao criar um ou mais ciclos de sono, é possível que um ou mais destes erros não tenham sido contornados.")
            if (emailMessages.errorOnDreamCreation)
                messages.push("Ocorreu um erro ao criar um ou mais sonhos, é possível que um ou mais destes erros não tenham sido contornados.")
            if (emailMessages.dreamsWithNoSleep)
                messages.push("Não foi possível encontrar um ciclo de sono para um ou mais sonhos, portanto, um ou mais sonhos foram anexados ao último ciclo de sono cadastrado por você, por favor, verifique.")
            if (emailMessages.dreamsWithNoTags)
                messages.push("Não foi possível importar as tags de um ou mais sonhos, será necessário adicioná-las manualmente, por favor, verifique.")
        }

        let finalMessage = ""

        messages.map((message, i) => {
            finalMessage += `${ message }${ i === messages.length - 1 ? "" : "\n" }`
        })

        return finalMessage
    }
}

export default ImportDataWorkers