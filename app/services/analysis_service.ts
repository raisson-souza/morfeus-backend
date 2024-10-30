import { AnalysisMost, DreamAnalysisInput, DreamClimatesCount, FrequentBiologicalOccurenceAnalysis, FrequentHumorAnalysis, SleepAnalysisBiologicalOccurencesCount, SleepAnalysisInput, SleepHumorCount } from "../types/analysisTypes.js"
import { DateTime } from "luxon"
import { SleepWithDreamsIds } from "../types/sleepTypes.js"
import AnalysisServiceProps from "./types/analysis_service_props.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import DreamAnalysis from "#models/dream_analysis"
import SleepAnalysis from "#models/sleep_analysis"
import User from "#models/user"

export default class AnalysisService implements AnalysisServiceProps {
    async GetDreamAnalysis(userId: number, { month, year }: DateTime): Promise<DreamAnalysis | null> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "Não existem estatísticas de data maior que a atual.")

        return await DreamAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('id')
            .orderBy('id', 'desc')
            .first()
    }

    async GetSleepAnalysis(userId: number, { month, year }: DateTime): Promise<SleepAnalysis | null> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "Não existem estatísticas de data maior que a atual.")

        return await SleepAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('id')
            .orderBy('id', 'desc')
            .first()
    }

    async CreateDreamAnalysis(userId: number, { month, year }: DateTime): Promise<void> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "A data de criação da estatística de sonho não pode ser maior que a atual.")

        /** Query base para as próximas consultas */
        const analysisBaseQuery = db
            .from('dreams')
            .innerJoin('sleeps', 'sleeps.id', 'dreams.sleep_id')
            .innerJoin('users', 'users.id', 'sleeps.user_id')
            .where(query => {
                query.andWhere('sleeps.user_id', userId)
                query.andWhereRaw('EXTRACT(YEAR FROM sleeps.date) = ?', [ year ])
                query.andWhereRaw('EXTRACT(MONTH FROM sleeps.date) = ?', [ month ])
            })

        // TODO: armazenar em memória todos os sonhos da query mostPropertyBaseQuery e
        // utilizar nas queries abaixo

        /**
         * Captura a descrição da chave estrangeira em dreams de maior ocorrência
         * @param tableName Nome da tabela (SINGULAR)
        */
        const getForeignKeyDescriptionMostOccurence = async (tableName: string): Promise<string> => {
            return await analysisBaseQuery.clone()
                .innerJoin(`${ tableName }s`, `${ tableName }s.id`, `dreams.${ tableName }_id`)
                .select(`dreams.${ tableName }_id as foreign_id`, `${ tableName }s.description`)
                .count(`${ tableName }_id as count`)
                .groupBy(`dreams.${ tableName }_id`, `${ tableName }s.description`)
                .orderBy('count', 'desc')
                .first()
                .then(result => { return result["description"] as string })
        }

        const mostPointOfViewOccurence = await getForeignKeyDescriptionMostOccurence("dream_point_of_view")

        const mostHourOccurence = await getForeignKeyDescriptionMostOccurence("dream_hour")

        const mostDurationOccurence = await getForeignKeyDescriptionMostOccurence("dream_duration")

        const mostLucidityLevelOccurence = await getForeignKeyDescriptionMostOccurence("dream_lucidity_level")

        const mostDreamTypeOccurence = await getForeignKeyDescriptionMostOccurence("dream_type")

        const mostRealityLevelOccurenceOccurence = await getForeignKeyDescriptionMostOccurence("dream_reality_level")

        const mostClimateOccurence: AnalysisMost = await analysisBaseQuery.clone()
            .select("dreams.climate")
            .then(result => {
                const climatesCount: DreamClimatesCount = {
                    ameno: 0,
                    calor: 0,
                    garoa: 0,
                    chuva: 0,
                    tempestade: 0,
                    nevoa: 0,
                    neve: 0,
                    multiplos: 0,
                    outro: 0,
                    indefinido: 0,
                }
                result.map(climate => {
                    if (climate.climate["ameno"]) climatesCount.ameno++
                    if (climate.climate["calor"]) climatesCount.calor++
                    if (climate.climate["garoa"]) climatesCount.garoa++
                    if (climate.climate["chuva"]) climatesCount.chuva++
                    if (climate.climate["tempestade"]) climatesCount.tempestade++
                    if (climate.climate["nevoa"]) climatesCount.nevoa++
                    if (climate.climate["neve"]) climatesCount.neve++
                    if (climate.climate["multiplos"]) climatesCount.multiplos++
                    if (climate.climate["outro"]) climatesCount.outro++
                    if (climate.climate["indefinido"]) climatesCount.indefinido++
                })
                const _mostClimateOccurence = Object.entries(climatesCount)
                    .reduce((acc, [climate, count]) => {
                            return count > acc.count ? { climate, count } : acc
                        },
                        { climate: "", count: 0 }
                    )
                return {
                    foreignIdDescription: _mostClimateOccurence.climate,
                    foreignId: 0,
                    count: _mostClimateOccurence.count,
                }
            })

        const totalDreamsCount: number = await analysisBaseQuery.clone()
            .countDistinct('dreams.id')
            .then(result => { return Number.parseInt(result[0]["count"]) })

        const eroticDreamsAverage: number = await analysisBaseQuery.clone()
            .andWhere('dreams.erotic_dream', true)
            .countDistinct('dreams.id')
            .then(result => {
                return ((Number.parseInt(result[0]["count"]) / totalDreamsCount) || 0) * 100
            })

        const longestDreamTitle: string = await analysisBaseQuery.clone()
            .select('dreams.title')
            .orderByRaw('LENGTH(description) DESC')
            .first()
            .then(result => { return result["title"] })

        const tagPerDreamAverage: number = await analysisBaseQuery.clone()
            .innerJoin('dream_tags', 'dream_tags.dream_id', 'dreams.id')
            .innerJoin('tags', 'tags.id', 'dream_tags.tag_id')
            .countDistinct('dream_tags.id')
            .first()
            .then(result => {
                return (Number.parseInt(result["count"]) / totalDreamsCount) || 0
            })

        const dreamAnalysisModel: DreamAnalysisInput = {
            month: month,
            year: year,
            mostPointOfViewOccurence: mostPointOfViewOccurence,
            mostClimateOccurence: mostClimateOccurence.foreignIdDescription,
            mostHourOccurence: mostHourOccurence,
            mostDurationOccurence: mostDurationOccurence,
            mostLucidityLevelOccurence: mostLucidityLevelOccurence,
            mostDreamTypeOccurence: mostDreamTypeOccurence,
            mostRealityLevelOccurenceOccurence: mostRealityLevelOccurenceOccurence,
            eroticDreamsAverage: eroticDreamsAverage,
            tagPerDreamAverage: tagPerDreamAverage,
            longestDreamTitle: longestDreamTitle,
            userId: userId,
        }

        const previousDreamAnalysisId: number | undefined = await DreamAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('id')
            .orderBy('id', 'desc')
            .first()
            .then(result => { return result?.id })

        if (previousDreamAnalysisId) {
            await DreamAnalysis.updateOrCreate({ id: previousDreamAnalysisId }, dreamAnalysisModel)
            return
        }

        await DreamAnalysis.create(dreamAnalysisModel)
    }

    async CreateSleepAnalysis(userId: number, { month, year }: DateTime): Promise<void> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "A data de criação da estatística de sono não pode ser maior que a atual.")

        /** Query base para as próximas consultas */
        const analysisBaseQuery = db
            .from('sleeps')
            .innerJoin('dreams', 'dreams.sleep_id', 'sleeps.id')
            .innerJoin('users', 'users.id', 'sleeps.user_id')
            .where(query => {
                query.andWhere('sleeps.user_id', userId)
                query.andWhereRaw('EXTRACT(YEAR FROM sleeps.date) = ?', [ year ])
                query.andWhereRaw('EXTRACT(MONTH FROM sleeps.date) = ?', [ month ])
            })

        /** Consulta base de todos os sonos do usuário com ids dos sonhos na data */
        const getUserSleeps = async (): Promise<SleepWithDreamsIds[]> => {
            const userSleeps: SleepWithDreamsIds[] = []

            await analysisBaseQuery.clone()
                .select('sleeps.*')
                .then(result => {
                    result.map(sleep => {
                        userSleeps.push({
                            id: sleep["id"],
                            date: sleep["date"],
                            sleepTime: sleep["sleep_time"],
                            sleepStart: sleep["sleep_start"],
                            sleepEnd: sleep["sleep_end"],
                            wakeUpHumor: sleep["wake_up_humor"],
                            layDownHumor: sleep["lay_down_humor"],
                            biologicalOccurences: sleep["biological_occurences"],
                            userId: sleep["user_id"],
                            dreamsId: [],
                        })
                    })
                })

            for (const userSleep of userSleeps) {
                await Dream.query()
                    .where('sleep_id', userSleep.id)
                    .select('id')
                    .then(result => {
                        result.map(dream => {
                            userSleep.dreamsId.push(dream.id)
                        })
                    })
            }

            return userSleeps
        }
        const userSleeps = await getUserSleeps()

        // TODO: validar fazer um map geral e com ifs capturar todos os dados de busca
        // evitar multiplos maps e filters

        const dreamsCount: number = await analysisBaseQuery.clone()
            .count('dreams.id')
            .first()
            .then(result => { return result["count"] })

        const goodWakeUpHumorPercentage = (): number => {
            const goodWakeUpHumorCount: number = userSleeps.filter(sleep =>
                sleep.wakeUpHumor.calm ||
                sleep.wakeUpHumor.happiness
            ).length

            return (goodWakeUpHumorCount / userSleeps.length) * 100
        }

        const badWakeUpHumorPercentage = (): number => {
            const badWakeUpHumorCount: number = userSleeps.filter(sleep =>
                sleep.wakeUpHumor.anxiety ||
                sleep.wakeUpHumor.drowsiness ||
                sleep.wakeUpHumor.fear ||
                sleep.wakeUpHumor.sadness ||
                sleep.wakeUpHumor.tiredness
            ).length

            return (badWakeUpHumorCount / userSleeps.length) * 100
        }

        const goodLayDownHumorPercentage = (): number => {
            const goodLayDownHumorCount: number = userSleeps.filter(sleep =>
                sleep.layDownHumor.calm ||
                sleep.layDownHumor.happiness
            ).length

            return (goodLayDownHumorCount / userSleeps.length) * 100
        }

        const badLayDownHumorPercentage = (): number => {
            const badLayDownHumorCount: number = userSleeps.filter(sleep =>
                sleep.layDownHumor.anxiety ||
                sleep.layDownHumor.drowsiness ||
                sleep.layDownHumor.fear ||
                sleep.layDownHumor.sadness ||
                sleep.layDownHumor.tiredness
            ).length

            return (badLayDownHumorCount / userSleeps.length) * 100
        }

        const mostFrequentWakeUpHumor = () => {
            const wakeUpHumorCount: SleepHumorCount = {
                anxiety: 0,
                drowsiness: 0,
                fear: 0,
                sadness: 0,
                tiredness: 0,
                calm: 0,
                happiness: 0
            }

            userSleeps.map(sleep => {
                if (sleep.wakeUpHumor.calm) wakeUpHumorCount.calm++
                if (sleep.wakeUpHumor.happiness) wakeUpHumorCount.happiness++
                if (sleep.wakeUpHumor.anxiety) wakeUpHumorCount.anxiety++
                if (sleep.wakeUpHumor.drowsiness) wakeUpHumorCount.drowsiness++
                if (sleep.wakeUpHumor.fear) wakeUpHumorCount.fear++
                if (sleep.wakeUpHumor.sadness) wakeUpHumorCount.sadness++
                if (sleep.wakeUpHumor.tiredness) wakeUpHumorCount.tiredness++
            })

            // TODO: corrigir mostFrequentWakeUpHumor para ser um número como em mostSleepDuration
            const mostFrequentWakeUpHumor = Object.entries(wakeUpHumorCount)
                .reduce((acc, [humor, count]) => {
                        return count > acc.count ? { humor: humor, count } : acc
                    },
                    { humor: null, count: 0 } as FrequentHumorAnalysis
                )

            return mostFrequentWakeUpHumor.humor
        }

        const leastFrequentWakeUpHumor = () => {
            const wakeUpHumorCount: SleepHumorCount = {
                anxiety: 0,
                drowsiness: 0,
                fear: 0,
                sadness: 0,
                tiredness: 0,
                calm: 0,
                happiness: 0
            }

            userSleeps.map(sleep => {
                if (sleep.wakeUpHumor.calm) wakeUpHumorCount.calm++
                if (sleep.wakeUpHumor.happiness) wakeUpHumorCount.happiness++
                if (sleep.wakeUpHumor.anxiety) wakeUpHumorCount.anxiety++
                if (sleep.wakeUpHumor.drowsiness) wakeUpHumorCount.drowsiness++
                if (sleep.wakeUpHumor.fear) wakeUpHumorCount.fear++
                if (sleep.wakeUpHumor.sadness) wakeUpHumorCount.sadness++
                if (sleep.wakeUpHumor.tiredness) wakeUpHumorCount.tiredness++
            })

            // TODO: corrigir leastFrequentWakeUpHumor para ser um número como em mostSleepDuration
            const leastFrequentWakeUpHumor = Object.entries(wakeUpHumorCount)
                .reduce((acc, [humor, count]) => {
                        return count < acc.count ? { humor: humor, count } : acc
                    },
                    { humor: null, count: 0 } as FrequentHumorAnalysis
                )

            return leastFrequentWakeUpHumor.humor
        }

        const mostFrequentLayDownHumor = () => {
            const layDownHumorCount: SleepHumorCount = {
                anxiety: 0,
                drowsiness: 0,
                fear: 0,
                sadness: 0,
                tiredness: 0,
                calm: 0,
                happiness: 0
            }

            userSleeps.map(sleep => {
                if (sleep.layDownHumor.calm) layDownHumorCount.calm++
                if (sleep.layDownHumor.happiness) layDownHumorCount.happiness++
                if (sleep.layDownHumor.anxiety) layDownHumorCount.anxiety++
                if (sleep.layDownHumor.drowsiness) layDownHumorCount.drowsiness++
                if (sleep.layDownHumor.fear) layDownHumorCount.fear++
                if (sleep.layDownHumor.sadness) layDownHumorCount.sadness++
                if (sleep.layDownHumor.tiredness) layDownHumorCount.tiredness++
            })

            // TODO: corrigir mostFrequentWakeUpHumor para ser um número como em mostSleepDuration
            const mostFrequentWakeUpHumor = Object.entries(layDownHumorCount)
                .reduce((acc, [humor, count]) => {
                        return count > acc.count ? { humor: humor, count } : acc
                    },
                    { humor: null, count: 0 } as FrequentHumorAnalysis
                )

            return mostFrequentWakeUpHumor.humor
        }

        const leastFrequentLayDownHumor = () => {
            const layDownHumorCount: SleepHumorCount = {
                anxiety: 0,
                drowsiness: 0,
                fear: 0,
                sadness: 0,
                tiredness: 0,
                calm: 0,
                happiness: 0
            }

            userSleeps.map(sleep => {
                if (sleep.layDownHumor.calm) layDownHumorCount.calm++
                if (sleep.layDownHumor.happiness) layDownHumorCount.happiness++
                if (sleep.layDownHumor.anxiety) layDownHumorCount.anxiety++
                if (sleep.layDownHumor.drowsiness) layDownHumorCount.drowsiness++
                if (sleep.layDownHumor.fear) layDownHumorCount.fear++
                if (sleep.layDownHumor.sadness) layDownHumorCount.sadness++
                if (sleep.layDownHumor.tiredness) layDownHumorCount.tiredness++
            })

            // TODO: corrigir leastFrequentWakeUpHumor para ser um número como em mostSleepDuration
            const leastFrequentWakeUpHumor = Object.entries(layDownHumorCount)
                .reduce((acc, [humor, count]) => {
                        return count < acc.count ? { humor: humor, count } : acc
                    },
                    { humor: null, count: 0 } as FrequentHumorAnalysis
                )

            return leastFrequentWakeUpHumor.humor
        }

        const mostFrequentBiologicalOccurence = () => {
            const biologicalOccurencesCount: SleepAnalysisBiologicalOccurencesCount = {
                sudorese: 0,
                bruxismo: 0,
                apneiaDoSono: 0,
                ronco: 0,
                movimentosPeriodicosDosMembros: 0,
                despertaresParciais: 0,
                refluxoGastroesofagico: 0,
                sialorreia: 0,
                arritmias: 0,
                mioclonia: 0,
                parassonia: 0,
                epistaxe: 0,
                miccaoInvoluntaria: 0,
                evacuacaoInvoluntaria: 0,
                polucao: 0,
            }

            userSleeps.map(sleep => {
                if (sleep.biologicalOccurences.sudorese) biologicalOccurencesCount.sudorese
                if (sleep.biologicalOccurences.bruxismo) biologicalOccurencesCount.bruxismo
                if (sleep.biologicalOccurences.apneiaDoSono) biologicalOccurencesCount.apneiaDoSono
                if (sleep.biologicalOccurences.ronco) biologicalOccurencesCount.ronco
                if (sleep.biologicalOccurences.movimentosPeriodicosDosMembros) biologicalOccurencesCount.movimentosPeriodicosDosMembros
                if (sleep.biologicalOccurences.despertaresParciais) biologicalOccurencesCount.despertaresParciais
                if (sleep.biologicalOccurences.refluxoGastroesofagico) biologicalOccurencesCount.refluxoGastroesofagico
                if (sleep.biologicalOccurences.sialorreia) biologicalOccurencesCount.sialorreia
                if (sleep.biologicalOccurences.arritmias) biologicalOccurencesCount.arritmias
                if (sleep.biologicalOccurences.mioclonia) biologicalOccurencesCount.mioclonia
                if (sleep.biologicalOccurences.parassonia) biologicalOccurencesCount.parassonia
                if (sleep.biologicalOccurences.epistaxe) biologicalOccurencesCount.epistaxe
                if (sleep.biologicalOccurences.miccaoInvoluntaria) biologicalOccurencesCount.miccaoInvoluntaria
                if (sleep.biologicalOccurences.evacuacaoInvoluntaria) biologicalOccurencesCount.evacuacaoInvoluntaria
                if (sleep.biologicalOccurences.polucao) biologicalOccurencesCount.polucao
            })

            // TODO: corrigir mostFrequentWakeUpHumor para ser um número como em mostSleepDuration
            const mostFrequentWakeUpHumor = Object.entries(biologicalOccurencesCount)
                .reduce((acc, [biologicalOccurence, count]) => {
                        return count > acc.count ? { biologicalOccurence: biologicalOccurence, count } : acc
                    },
                    { biologicalOccurence: null, count: 0 } as FrequentBiologicalOccurenceAnalysis
                )

            return mostFrequentWakeUpHumor.biologicalOccurence
        }

        const leastFrequentBiologicalOccurence = () => {
            const biologicalOccurencesCount: SleepAnalysisBiologicalOccurencesCount = {
                sudorese: 0,
                bruxismo: 0,
                apneiaDoSono: 0,
                ronco: 0,
                movimentosPeriodicosDosMembros: 0,
                despertaresParciais: 0,
                refluxoGastroesofagico: 0,
                sialorreia: 0,
                arritmias: 0,
                mioclonia: 0,
                parassonia: 0,
                epistaxe: 0,
                miccaoInvoluntaria: 0,
                evacuacaoInvoluntaria: 0,
                polucao: 0,
            }

            userSleeps.map(sleep => {
                if (sleep.biologicalOccurences.sudorese) biologicalOccurencesCount.sudorese
                if (sleep.biologicalOccurences.bruxismo) biologicalOccurencesCount.bruxismo
                if (sleep.biologicalOccurences.apneiaDoSono) biologicalOccurencesCount.apneiaDoSono
                if (sleep.biologicalOccurences.ronco) biologicalOccurencesCount.ronco
                if (sleep.biologicalOccurences.movimentosPeriodicosDosMembros) biologicalOccurencesCount.movimentosPeriodicosDosMembros
                if (sleep.biologicalOccurences.despertaresParciais) biologicalOccurencesCount.despertaresParciais
                if (sleep.biologicalOccurences.refluxoGastroesofagico) biologicalOccurencesCount.refluxoGastroesofagico
                if (sleep.biologicalOccurences.sialorreia) biologicalOccurencesCount.sialorreia
                if (sleep.biologicalOccurences.arritmias) biologicalOccurencesCount.arritmias
                if (sleep.biologicalOccurences.mioclonia) biologicalOccurencesCount.mioclonia
                if (sleep.biologicalOccurences.parassonia) biologicalOccurencesCount.parassonia
                if (sleep.biologicalOccurences.epistaxe) biologicalOccurencesCount.epistaxe
                if (sleep.biologicalOccurences.miccaoInvoluntaria) biologicalOccurencesCount.miccaoInvoluntaria
                if (sleep.biologicalOccurences.evacuacaoInvoluntaria) biologicalOccurencesCount.evacuacaoInvoluntaria
                if (sleep.biologicalOccurences.polucao) biologicalOccurencesCount.polucao
            })

            // TODO: corrigir biologicalOccurenceControl para ser um número como em mostSleepDuration
            const mostFrequentWakeUpHumor = Object.entries(biologicalOccurencesCount)
                .reduce((biologicalOccurenceControl, [biologicalOccurence, count]) => {
                        return count < biologicalOccurenceControl.count ? { biologicalOccurence: biologicalOccurence, count } : biologicalOccurenceControl
                    },
                    { biologicalOccurence: null, count: 0 } as FrequentBiologicalOccurenceAnalysis
                )

            return mostFrequentWakeUpHumor.biologicalOccurence
        }

        /** Captura a duração do maior e menor sono */
        const sleepDurationAnalysis = userSleeps.reduce((sleepDurationControl, sleep) => {
            const currentAnalysisControl = {
                mostSleepDuration: sleepDurationControl.mostSleepDuration,
                leastSleepDuration: sleepDurationControl.leastSleepDuration,
            }

            if (sleep.sleepTime) {
                if (sleep.sleepTime > sleepDurationControl.mostSleepDuration)
                    currentAnalysisControl.mostSleepDuration = sleep.sleepTime
                else
                    currentAnalysisControl.leastSleepDuration = sleep.sleepTime
            }

            return currentAnalysisControl
        }, {
            mostSleepDuration: 0,
            leastSleepDuration: 0,
        })

        const averageDreamPerSleep = (): number => {
            let dreamsCount = 0
            userSleeps.map(sleep => { dreamsCount+= sleep.dreamsId.length })
            return dreamsCount / userSleeps.length
        }

        const sleepDurationAverage = (): number => {
            let totalSleepTime = 0
            userSleeps.map(sleep => {
                totalSleepTime+= sleep.sleepTime ?? 0
            })
            return totalSleepTime / userSleeps.length
        }

        const mostDreamsPerSleepDate = (): DateTime => {
            const mostDreamsPerSleepDate: any = userSleeps.reduce((sleepControl, currentSleep) => {
                    return currentSleep.dreamsId.length > sleepControl.mostDreamsCountPerSleepDate
                        ? { mostDreamsPerSleepDate: currentSleep.date, mostDreamsCountPerSleepDate: currentSleep.dreamsId.length }
                        : sleepControl
                }, { mostDreamsPerSleepDate: userSleeps[0].date, mostDreamsCountPerSleepDate: userSleeps[0].dreamsId.length })
                .mostDreamsPerSleepDate

            return DateTime.fromJSDate(new Date(mostDreamsPerSleepDate.toISOString()))
        }

        const sleepAnalysisModel: SleepAnalysisInput = {
            month: month,
            year: year,
            dreamsCount: dreamsCount,
            goodWakeUpHumorPercentage: goodWakeUpHumorPercentage(),
            badWakeUpHumorPercentage: badWakeUpHumorPercentage(),
            goodLayDownHumorPercentage: goodLayDownHumorPercentage(),
            badLayDownHumorPercentage: badLayDownHumorPercentage(),
            mostFrequentWakeUpHumor: mostFrequentWakeUpHumor(),
            leastFrequentWakeUpHumor: leastFrequentWakeUpHumor(),
            mostFrequentLayDownHumor: mostFrequentLayDownHumor(),
            leastFrequentLayDownHumor: leastFrequentLayDownHumor(),
            mostFrequentBiologicalOccurence: mostFrequentBiologicalOccurence(),
            leastFrequentBiologicalOccurence: leastFrequentBiologicalOccurence(),
            mostSleepDuration: sleepDurationAnalysis.mostSleepDuration,
            leastSleepDuration: sleepDurationAnalysis.leastSleepDuration,
            averageDreamPerSleep: averageDreamPerSleep(),
            sleepDurationAverage: sleepDurationAverage(),
            mostDreamsPerSleepDate: mostDreamsPerSleepDate(),
            userId: userId,
        }

        const previousSleepAnalysisId: number | undefined = await SleepAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('id')
            .orderBy('id', 'desc')
            .first()
            .then(result => { return result?.id })

        if (previousSleepAnalysisId) {
            await SleepAnalysis.updateOrCreate({ id: previousSleepAnalysisId }, sleepAnalysisModel)
            return
        }

        await SleepAnalysis.create(sleepAnalysisModel)
    }
}