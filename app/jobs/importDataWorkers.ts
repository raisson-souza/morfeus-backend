import { ClearImportFilesJob, ExternalDreamType, ImportDataJob } from './types/importDataTypes.js'
import { cuid } from '@adonisjs/core/helpers'
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
    totalDreams: number
    totalSleeps: number
    errorOnSleepCreation: boolean
    errorOnDreamCreation: boolean
    dreamsWithNoSleep: boolean
    dreamsWithNoTags: boolean
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
            totalDreams: 0,
            totalSleeps: 0,
            errorOnSleepCreation: false,
            errorOnDreamCreation: false,
            dreamsWithNoSleep: false,
            dreamsWithNoTags: false,
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
                            emailMessages.totalDreams = sameOriginImport.dreams.length
                            emailMessages.totalSleeps = sameOriginImport.sleeps.length
                            await ImportDataWorkers.importSleeps(userId, sameOriginImport.sleeps, sameOriginImport.dreams, emailMessages)
                            sameOriginImport.sleeps = []
                            await ImportDataWorkers.importDreams(userId, sameOriginImport.dreams, emailMessages)
                            sameOriginImport.dreams = []
                        }
                        else {
                            if (file.dreamsPath) {
                                let importDreams = ImportDataWorkers.tryParseExternalDreamsImportPath(data, file.dreamsPath)
                                data = ""
                                emailMessages.totalDreams = importDreams.length
                                await ImportDataWorkers.importExternalDreams(userId, importDreams, emailMessages)
                                importDreams = []
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

            await EmailSender.Send({
                subject: "Importação de Dados",
                text: ImportDataWorkers.mountEmailMessage(user.name, true, emailMessages),
                to: user.email,
            })

            await finishFile()
        }
        catch (ex) {
            console.log(`Erro em importData:\m ${ ex.message }`)
            await EmailSender.Send({
                subject: "Importação de Dados",
                text: ImportDataWorkers.mountEmailMessage(user.name, false, emailMessages),
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

    /** Importa os ciclos de sono do usuário */
    static async importSleeps(userId: number, sleeps: ExportUserDataSleeps[], dreams: ExportUserDataDreams[], emailMessages: ImportProcessEmailMessages) {
        const updateDreamsIds = (originalSleepId: number, dbSleepId: number) => {
            dreams.map((dream, i) => {
                if (dream.sleepId === originalSleepId)
                    dreams[i].sleepId = dbSleepId
            })
        }

        await db.transaction(async trx => {
            try {
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
                await trx.commit()
            }
            catch {
                await trx.rollback()
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

    /** Importa os sonhos de mesma origem do usuário */
    static async importDreams(userId: number, dreams: ExportUserDataDreams[], emailMessages: ImportProcessEmailMessages) {
        const dreamTagsImport: DreamTagImportType[] = []

        await db.transaction(async trx => {
            try {
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
                            const newSleepId = await ImportDataWorkers.searchOrCreateSleepCycleForDream(trx, userId, dream.sleepId, null)
                            dream.sleepId = newSleepId
                            dream.dreamOriginId = 3

                            const { id, ...dreamModel } = dream

                            const newDreamId = await Dream
                                .create(dreamModel, { client: trx })
                                .then(result => result.id)
                            dreamTagsImport.push({ dreamId: newDreamId, tags: dream.dreamTags })
                        }
                    }
                    catch {
                        emailMessages.errorOnDreamCreation = true
                    }
                }
                await trx.commit()
            }
            catch {
                await trx.rollback()
            }
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

    /** Trata da criação e edição das tags de um sonho importado */
    static async manageTags(newTags: string[], dreamId: number, trx: TransactionClientContract): Promise<void> {
        newTags.map((newTag, i) => {
            newTags[i] = newTag.replaceAll(" ", "_")
        })

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

    /** Busca ou cria um ciclo de sono para um sonho */
    static async searchOrCreateSleepCycleForDream(trx: TransactionClientContract, userId: number, sleepId: number | null, dreamDate: DateTime | null): Promise<number> {
        // Verifica-se a existência do sleepId informado
        if (sleepId) {
            const sleepExists = await Sleep.query()
                .where("user_id", userId)
                .andWhere("id", sleepId)
                .orderBy("created_at", "desc")
                .first()
                .then(result => result != null)

            if (sleepExists) return sleepId
        }
        // Verifica-se a existência de um ciclo de sono pertencente a data informada, caso contrário, cria um para essa data
        if (dreamDate) {
            const dreamDatePeriodDayBefore = dreamDate.minus({ days: 1 }).set({ hour: 0, minute: 0, second: 1 })
            const dreamDatePeriodDayAfter = dreamDate.plus({ days: 1 }).set({ hour: 23, minute: 59, second: 59 })
            const sameSleepIntervalSleeps = await ImportDataWorkers.getSameSleepIntervalSleeps(userId, dreamDate, dreamDatePeriodDayBefore, dreamDatePeriodDayAfter)

            if (sameSleepIntervalSleeps.length > 0)
                return sameSleepIntervalSleeps[0].id

            return await Sleep.create({
                date: dreamDate,
                sleepTime: 1,
                sleepStart: dreamDate.set({ hour: 0, minute: 0, second: 1 }),
                sleepEnd: dreamDate.set({ hour: 1, minute: 0, second: 0 }),
                isNightSleep: true,
                userId: userId,
            }, { client: trx })
                .then(result => result.id)
        }

        // Busca-se pelo último ciclo de sono do usuário
        const lastSleepCycleId = await Sleep.query()
            .where("user_id", userId)
            .orderBy("created_at", "desc")
            .first()
            .then(result => result ? result.id : null)

        if (lastSleepCycleId)
            return lastSleepCycleId

        // Em caso de nenhum ciclo de sono cadastrado, cria-se um falso para o armazenamento dos sonhos sem informação de ciclo de sono
        const yesterday = DateTime.now().minus({ days: 1 }).set({ hour: 0, minute: 0, second: 1 })
        return await Sleep.create({
            date: yesterday.minus({ days: 1 }),
            sleepTime: 1,
            sleepStart: yesterday,
            sleepEnd: yesterday.plus({ hours: 1 }),
            isNightSleep: true,
            userId: userId,
        }).then(result => result.id)
    }

    /** Realiza a importação dos sonhos externos */
    static async importExternalDreams(userId: number, dreams: any[], emailMessages: ImportProcessEmailMessages) {
        try {
            db.transaction(async (trx) => {
                try {
                    for (const dream of dreams) {
                        try {
                            const formattedDream = ImportDataWorkers.tryParseExternalDream(dream, emailMessages)

                            if (formattedDream) {
                                if (!formattedDream.date)
                                    emailMessages.dreamsWithNoSleep = true

                                const dreamExists = await Dream
                                    .query()
                                    .innerJoin("sleeps", "sleeps.id", "dreams.sleep_id")
                                    .where("dreams.title", formattedDream.title)
                                    .andWhere("sleeps.user_id", userId)
                                    .first()
                                    .then(result => result != null)

                                if (dreamExists)
                                    throw new Error("Sonho já existente.")

                                const sleepId = await ImportDataWorkers.searchOrCreateSleepCycleForDream(trx, userId, null, formattedDream.date)

                                const dreamId = await Dream.create({
                                    title: formattedDream.title,
                                    description: formattedDream.description,
                                    climate: {
                                        ameno: false,
                                        calor: false,
                                        garoa: false,
                                        chuva: false,
                                        tempestade: false,
                                        nevoa: false,
                                        neve: false,
                                        multiplos: false,
                                        outro: false,
                                        indefinido: true,
                                    },
                                    isComplete: true,
                                    dreamOriginId: 3,
                                    dreamPointOfViewId: 1,
                                    dreamHourId: 5,
                                    dreamDurationId: 1,
                                    dreamLucidityLevelId: 1,
                                    dreamTypeId: 1,
                                    dreamRealityLevelId: 1,
                                    sleepId: sleepId,
                                }, { client: trx }).then(result => result.id)

                                if (formattedDream.tags.length > 0)
                                    await ImportDataWorkers.manageTags(formattedDream.tags, dreamId, trx)

                                continue
                            }
                            emailMessages.errorOnDreamCreation = true
                        }
                        catch {
                            emailMessages.errorOnDreamCreation = true
                        }
                    }
                    await trx.commit()
                }
                catch {
                    await trx.rollback()
                }
            })
        }
        catch { }
    }

    /** Buca e trata um sonho externo do usuário */
    static tryParseExternalDream(dreamData: any, emailMessages: ImportProcessEmailMessages): ExternalDreamType | null {
        try {
            let date: string | null = null
            let title: string | null = null
            let description: string | null = null
            let tags : string[] = []

            if ("date" in dreamData) date = dreamData["date"]
            else if ("createdAt" in dreamData) date = dreamData["createdAt"]
            else if ("created" in dreamData) date = dreamData["created"]
            else if ("updatedAt" in dreamData) date = dreamData["updatedAt"]
            else if ("updated" in dreamData) date = dreamData["updated"]
            else date = null

            if ("title" in dreamData) title = dreamData["title"]
            else title = null

            if ("description" in dreamData) description = dreamData["description"]
            else if ("text" in dreamData) description = dreamData["text"]
            else description = null

            try {
                if ("tags" in dreamData) {
                    if (Array.isArray(dreamData["tags"])) {
                        tags = dreamData["tags"]
                    }
                }
                else if ("dreamTags" in dreamData) {
                    if (Array.isArray(dreamData["dreamTags"])) {
                        tags = dreamData["dreamTags"]
                    }
                }
            }
            catch {
                emailMessages.dreamsWithNoTags = true
            }

            let parsedDate: DateTime | null = null
            if (date) {
                try {
                    parsedDate = DateTime.fromISO(date)
                } catch { }
                // TRATAMENTO ESPECIAL PARA DATA NA EXPORTAÇÃO DO DREAM CATCHER
                try {
                    if (parsedDate) {
                        if (!parsedDate.isValid) {
                            const splitedDate = date.split(" ")
                            const splitedTime = splitedDate[1].split("-")
                            parsedDate = DateTime.fromISO(`${ splitedDate[0] }T${ splitedTime[0] }-03:00`)
                        }
                    }
                } catch { }
            }

            if (!title && !description) {
                emailMessages.errorOnDreamCreation = true
                throw new Error()
            }

            return {
                date: parsedDate,
                title: title ?? cuid(),
                description: description ?? cuid(),
                tags,
            }
        }
        catch {
            return null
        }
    }

    /** Busca o caminho dos sonhos no arquivo informado pelo usuário */
    static tryParseExternalDreamsImportPath(data: string, dreamsPath: string): any[] {
        try {
            const dreamsPathList = dreamsPath.split("/")
            let parsedData = JSON.parse(data)

            dreamsPathList.map(path => {
                parsedData = parsedData[path]
            })

            return parsedData
        }
        catch {
            throw new Error("Não foi possível encontrar os sonhos no arquivo de importação.")
        }
    }

    /** Monta a mensagem de finalização da importação para o email do usuário */
    static mountEmailMessage(userName: string, success: boolean, emailMessages: ImportProcessEmailMessages): string {
        const {
            totalDreams,
            totalSleeps,
            errorOnSleepCreation,
            errorOnDreamCreation,
            dreamsWithNoSleep,
            dreamsWithNoTags,
        } = emailMessages
        const messages: string[] = []

        messages.push(
            success
                ? `Olá ${ userName }, o processo de importação de dados solicitado por você finalizou com sucesso!`
                : `Olá ${ userName }, ocorreu um erro no processo de importação de dados solicitado por você.`
        )

        messages.push(`Um total de ${ totalDreams } sonhos e ${ totalSleeps } ciclos de sono foram catalogados no arquivo de importação.`)

        if (success) {
            const errorDuringImportProcess = errorOnSleepCreation || errorOnDreamCreation || dreamsWithNoSleep || dreamsWithNoTags

            if (errorDuringImportProcess) {
                messages.push("Apesar do sucesso na importação, alguns problemas ocorreram, são eles:")

                if (errorOnSleepCreation)
                    messages.push("Ocorreu um erro ao criar um ou mais ciclos de sono, é possível que você não veja alguns destes registros.")
                if (errorOnDreamCreation)
                    messages.push("Ocorreu um erro ao criar um ou mais sonhos, é possível que você não veja alguns destes registros.")
                if (dreamsWithNoSleep)
                    messages.push("Não foi possível encontrar um ciclo de sono para um ou mais sonhos, portanto, um ou mais sonhos foram anexados ao último ciclo de sono cadastrado por você, por favor, verifique.")
                if (dreamsWithNoTags)
                    messages.push("Não foi possível importar as tags de um ou mais sonhos, será necessário adicioná-las manualmente, por favor, verifique.")

                messages.push("Se ainda desejar importar os registros que não foram importados, por favor, verifique os mesmos no seu arquivo de importação e tente novamente, edite se necessário.")
                messages.push("Em caso de dúvidas ou problemas, entre em contato com o suporte e armazene seu arquivo de importação em um local seguro.")
            }
        }
        else {
            messages.push("Houve uma falha geral na importação e nenhum registro foi importado, por favor, verifique seu arquivo de importação, a configuração de importação ou tente novamente mais tarde.")
            messages.push("Caso essa não seja sua primeira tentativa de importação com erro, solicite suporte e armazene seu arquivo de importação em um local seguro.")
        }

        let finalMessage = ""

        messages.map((message, i) => {
            finalMessage += `${ message }${ i === messages.length - 1 ? "" : "\n" }`
        })

        return finalMessage
    }
}

export default ImportDataWorkers