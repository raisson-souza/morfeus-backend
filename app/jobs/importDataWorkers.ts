import { DateTime } from 'luxon'
import { ExportUserData, ExportUserDataDreams, ExportUserDataSleeps } from '../types/userTypes.js'
import { ImportDataJob } from './types/importDataTypes.js'
import { Job, Worker } from 'bullmq'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import Dream from '#models/dream'
import EmailSender from '../utils/EmailSender.js'
import File from '#models/file'
import fs from 'node:fs/promises'
import redisConnection from '#config/queue'
import Sleep from '#models/sleep'
import User from '#models/user'

type ImportProcessEmailMessages = {
    errorOnSleepCreation: boolean
    errorOnDreamCreation: boolean
    dreamsWithNoSleep: boolean
    totalFailureOnImportProcess: boolean
}

class ImportDataWorkers {
    constructor() {
        new Worker<ImportDataJob, any, string>("importData", this.importData, { connection: redisConnection })
    }

    private async importData(job: Job<ImportDataJob, any, string>) {
        const emailMessages: ImportProcessEmailMessages = {
            errorOnSleepCreation: false,
            errorOnDreamCreation: false,
            dreamsWithNoSleep: false,
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

            const absolutePath = app.makePath('uploads', file.fileName)

            await fs.readFile(absolutePath, "utf8")
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
        catch {
            const emailMessage = ImportDataWorkers.mountEmailMessage(false, emailMessages)
            await EmailSender.Send({
                subject: "Finalização da importação de dados",
                text: `Olá ${ user.name }, o processo de importação de dados solicitado acabou de finalizar.\n${ emailMessage }`,
                to: user.email,
            })
        }
    }

    static async importSleeps(userId: number, sleeps: ExportUserDataSleeps[], dreams: ExportUserDataDreams[], emailMessages: ImportProcessEmailMessages) {
        await db.transaction(async trx => {
            for (const sleep of sleeps) {
                try {
                    sleep.date = DateTime.fromISO(sleep.date as any)
                    sleep.sleepStart = DateTime.fromISO(sleep.sleepStart as any)
                    sleep.sleepEnd = DateTime.fromISO(sleep.sleepEnd as any)

                    sleep.sleepTime = ImportDataWorkers.calculateSleepTime(sleep.sleepStart, sleep.sleepEnd)

                    const sameSleepIntervalSleeps = await ImportDataWorkers.getSameSleepIntervalSleeps(userId, sleep.date, sleep.sleepStart, sleep.sleepEnd)

                    if (sameSleepIntervalSleeps.length > 0) {
                        dreams.map((dream, i) => {
                            if (dream.sleepId === sleep.id)
                                dreams[i].sleepId = sameSleepIntervalSleeps[0].id
                        })
                        continue
                    }

                    const { id, ...sleepModel } = sleep

                    await Sleep.create({ ...sleepModel, userId: userId }, { client: trx })
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
        await db.transaction(async trx => {
            const dreamsNoSleep: ExportUserDataDreams[] = []

            for (const dream of dreams) {
                try {
                    const isDreamInDb = await Dream.query()
                        .where("title", dream.title)
                        .select("id")
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

                        await Dream.create(dreamModel, { client: trx })

                        // TODO: Utilizar ManageTags de DreamService
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
                .orderBy("id", "desc")
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
                    await Dream.create(dreamModel, { client: trx })
                }
                catch {
                    emailMessages.errorOnDreamCreation = true
                }
            }
        })
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
            emailMessages.dreamsWithNoSleep
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
        }

        let finalMessage = ""

        messages.map((message, i) => {
            finalMessage += `${ message }${ i === messages.length - 1 ? "" : "\n" }`
        })

        return finalMessage
    }
}

export default ImportDataWorkers