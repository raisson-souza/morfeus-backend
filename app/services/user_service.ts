import { AccessToken } from "@adonisjs/auth/access_tokens"
import { DateTime } from "luxon"
import { Exception } from "@adonisjs/core/exceptions"
import { ExportUserData, ExportUserDataDreams, ExportUserDataSleeps, UserInput, UserModalAccountRecovery, UserOutput } from "../types/userTypes.js"
import { Pagination } from "../types/pagiation.js"
import AccountRecovery from "#models/account_recovery"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import EmailSender from "../utils/EmailSender.js"
import Sleep from "#models/sleep"
import Tag from "#models/tag"
import User from "#models/user"
import userQueue from "../jobs/userQueue.js"
import UserServiceProps from "./types/user_service_props.js"

export default class UserService implements UserServiceProps {
    async Create(user: UserInput, validate = true) : Promise<User> {
        return await db.transaction(async (trx) => {
            if (validate) await this.Validate(user)
            const newUser = await User.create(user, { client: trx })
            await userQueue.sendWelcomeEmail({ userName: newUser.fullName, userEmail: user.email })
            return newUser
        })
    }

    async Update(user: UserOutput, _ = false) : Promise<User> {
        const userFound = await this.Get(user.id)
        if (!userFound) throw new CustomException(404, "Usuário não encontrado.")
        return await db.transaction(async (trx) => {
            const emailInUse = await User.query()
                .whereNot("id", user.id)
                .andWhere("email", user.email)
                .select("id")
                .then(result => result.length >= 1)

            if (emailInUse)
                throw new CustomException(400, "Email já em uso no sistema.")

            return await User.updateOrCreate({ id: user.id }, user, { client: trx })
        })
    }

    async Validate(user: UserInput): Promise<void> {
        const sameEmailUser = await User.query()
            .where("email", user.email)
            .first()
        if (sameEmailUser)
            throw new CustomException(400, "Email já em uso no sistema.")
    }

    async Get(id: number) {
        return await User.find(id)
    }

    async Delete(id: number) {
        const user = await User.find(id)
        if (!user) throw new CustomException(404, "Usuário não encontrado.")
        await user.delete()
    }

    async List({
        page,
        limit,
        orderBy,
        orderByDirection
    }: Pagination) {
        return await User.query()
            .orderBy(orderBy, orderByDirection as any)
            .paginate(page, limit)
    }

    async Login(email: string, password: string) : Promise<AccessToken> {
        try {
            const user = await User.verifyCredentials(email, password)
            const token = await User.accessTokens.create(user, ["*"], { expiresIn: "1h" })
            return token
        }
        catch (ex) {
            if ((ex as Error).message === "Invalid user credentials")
                throw new CustomException(401, "Credenciais inválidas.")
            else
                throw new Exception((ex as Error).message)
        }
    }

    async DataDeletion(userId: number): Promise<string> {
        const user = await this.Get(userId)
        if (!user) throw new CustomException(404, "Usuário não encontrado.")

        await user.delete()

        return `Usuário ${ user.fullName } deletado com sucesso.`
    }

    async CreateAccountRecovery(email: string): Promise<void> {
        // TODO: Job para atualização de restaurações de conta já vencidas

        const userId = await User.query()
            .where("email", email)
            .orderBy("id", "asc")
            .select("id")
            .first()
            .then(result => {
                return result
                    ? result["id"]
                    : null
            })

        if (!userId)
            throw new CustomException(404, "Email não encontrado no sistema.")

        const code = btoa(email)

        const pendingAccountRecovery = await this.ValidateAccountRecovery(code)

        if (pendingAccountRecovery) {
            if (!pendingAccountRecovery.expired && !pendingAccountRecovery.validated)
                throw new CustomException(400, "Já existe um processo de recuperação para essa conta")
        }

        await db.transaction(async (trx) => {
            await AccountRecovery
                .create(
                    {
                        code: code,
                        userReferenced: userId,
                        expiresAt: DateTime.now().plus({ minutes: 10 }),
                    },
                    { client: trx },
                )

            await EmailSender.Send({
                subject: "Recuperação de Conta",
                text: `Seu código de recuperação: ${ code }`,
                to: email,
            })

            await trx.commit()
        })
    }

    async CheckAccountRecovery(code: string): Promise<string> {
        const accountRecovery = await this.ValidateAccountRecovery(code)

        if (!accountRecovery)
            throw new CustomException(404, "Registro de recuperação de conta não encontrado.")

        if (accountRecovery.validated)
            throw new CustomException(400, "Recuperação de conta já concluída.")

        if (accountRecovery.expired)
            throw new CustomException(400, "Recuperação de conta expirada, tente novamente.")

        return "Recuperação de conta encontrada."
    }

    async FinishAccountRecovery(userModel: UserModalAccountRecovery): Promise<string> {
        const accountRecovery = await this.ValidateAccountRecovery(userModel.code)

        if (!accountRecovery)
            throw new CustomException(404, "Registro de recuperação de conta não encontrado.")

        if (accountRecovery.validated || accountRecovery.expired)
            throw new CustomException(400, "Recuperação de conta já concluída ou expirada, tente novamente.")

        const user = await this.Get(accountRecovery.userReferenced)

        if (!user)
            throw new CustomException(404, "Usuário não encontrado.")

        await db.transaction(async (trx) => {
            const emailInUse = await User.query()
                .whereNot("id", user.id)
                .andWhere("email", user.email)
                .select("id")
                .then(result => result.length >= 1)

            if (emailInUse)
                throw new CustomException(400, "Email já em uso no sistema.")

            await User.updateOrCreate(
                { id: user.id },
                {
                    id: user.id,
                    fullName: user.fullName,
                    email: userModel.email,
                    password: userModel.password,
                },
                { client: trx },
            )

            await AccountRecovery.updateOrCreate(
                { id: accountRecovery.id },
                {
                    ...accountRecovery.toJSON(),
                    validated: true,
                },
                { client: trx },
            )

            trx.commit()
        })

        return "Conta recuperada com sucesso."
    }

    async ExportUserData(userId: number, startDate: DateTime<true>, endDate: DateTime<true>): Promise<ExportUserData> {
        if (startDate > endDate)
            throw new CustomException(400, "Intervalo de tempo inválido para exportação.")

        if (endDate.diff(startDate, "days").days > 360)
            throw new CustomException(400, "Intervalo de tempo para a exportação é muito longo, escolha um intervalo menor.")

        startDate = startDate.set({ day: 1, hour: 0, minute: 0, second: 0 })
        endDate = endDate.set({ day: endDate.daysInMonth, hour: 23, minute: 59, second: 59 })

        const dreams: ExportUserDataDreams[] = []
        const sleeps: ExportUserDataSleeps[] = []

        await Dream.query()
            .innerJoin("sleeps", "sleeps.id", "dreams.sleep_id")
            .where("sleeps.user_id", userId)
            .andWhere("sleeps.date", ">=", startDate.toISO())
            .andWhere("sleeps.date", "<=", endDate.toISO())
            .orderBy("dreams.id", "asc")
            .select("dreams.*")
            .then(result => {
                result.map(async (dream) => {
                    const dreamTags: string[] = await Tag.query()
                        .innerJoin("dream_tags", "dream_tags.tag_id", "tags.id")
                        .where("dream_tags.dream_id", dream.id)
                        .select("*")
                        .then(tags => tags.map(tag => tag.title))

                    dreams.push({
                        id: dream.id,
                        title: dream.title,
                        description: dream.description,
                        climate: dream.climate,
                        eroticDream: dream.eroticDream,
                        hiddenDream: dream.hiddenDream,
                        personalAnalysis: dream.personalAnalysis,
                        dreamOriginId: dream.dreamOriginId,
                        dreamPointOfViewId: dream.dreamPointOfViewId,
                        dreamHourId: dream.dreamHourId,
                        dreamDurationId: dream.dreamDurationId,
                        dreamLucidityLevelId: dream.dreamLucidityLevelId,
                        dreamTypeId: dream.dreamTypeId,
                        dreamRealityLevelId: dream.dreamRealityLevelId,
                        sleepId: dream.sleepId,
                        dreamTags: dreamTags,
                    })
                })
            })

        await Sleep.query()
            .where("user_id", userId)
            .andWhere("date", ">=", startDate.toISO())
            .andWhere("date", "<=", endDate.toISO())
            .orderBy("id", "asc")
            .select("*")
            .then(result => {
                result.map(sleep => {
                    sleeps.push({
                        id: sleep.id,
                        date: sleep.date,
                        sleepTime: sleep.sleepTime,
                        sleepStart: sleep.sleepStart,
                        sleepEnd: sleep.sleepEnd,
                        isNightSleep: sleep.isNightSleep,
                        wakeUpHumor: sleep.wakeUpHumor,
                        layDownHumor: sleep.layDownHumor,
                        biologicalOccurences: sleep.biologicalOccurences,
                    })
                })
            })

        return { sleeps, dreams }
    }

    private async ValidateAccountRecovery(code: string): Promise<AccountRecovery | null> {
        const accountRecovery = await AccountRecovery.query()
            .where("code", code)
            .select("*")
            .orderBy("id", "desc")
            .first()

        if (accountRecovery) {
            if (!accountRecovery.expired) {
                // Realiza o tratamento do registro no momento da busca para maior acertividade
                const diff = accountRecovery.expiresAt.diffNow("minutes").minutes * -1
                if (diff >= 10) {
                    await AccountRecovery
                        .updateOrCreate(
                            { id: accountRecovery.id },
                            {
                                ...accountRecovery.toJSON(),
                                expired: true,
                            },
                        )
                    accountRecovery.expired = true
                }
            }
            return accountRecovery
        }
        return null
    }
}