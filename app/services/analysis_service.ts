import { ClimateCountAnalysis, DreamAnalysisInput, DreamClimatesCount, FrequentBiologicalOccurenceAnalysis, FrequentHumorAnalysis, LongestDreamTitleAnalysis, SleepAnalysisBiologicalOccurencesCount, SleepAnalysisInput, SleepHumorCount } from "../types/analysisTypes.js"
import { DateTime } from "luxon"
import { DreamOutputWithTags } from "../types/dreamTypes.js"
import { SleepWithDreamsIds } from "../types/sleepTypes.js"
import AnalysisServiceProps from "./types/analysis_service_props.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import DreamAnalysis from "#models/dream_analysis"
import SleepAnalysis from "#models/sleep_analysis"
import Tag from "#models/tag"
import User from "#models/user"

export default class AnalysisService implements AnalysisServiceProps {
    async GetDreamAnalysis(userId: number, { month, year }: DateTime): Promise<DreamAnalysis> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "Não existem estatísticas de data maior que a atual.")

        const dreamAnalysis = await DreamAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('*')
            .orderBy('id', 'desc')
            .first()

        if (!dreamAnalysis)
            throw new CustomException(404, "Análise de sonhos não criada.")

        return dreamAnalysis
    }

    async GetSleepAnalysis(userId: number, { month, year }: DateTime): Promise<SleepAnalysis> {
        if (!await User.find(userId))
            throw new CustomException(404, "Usuário não encontrado.")

        if (month > DateTime.now().month && year > DateTime.now().year)
            throw new CustomException(400, "Não existem estatísticas de data maior que a atual.")

        const sleepAnalysis = await SleepAnalysis.query()
            .where('user_id', userId)
            .andWhere('month', month)
            .andWhere('year', year)
            .select('*')
            .orderBy('id', 'desc')
            .first()

        if (!sleepAnalysis)
            throw new CustomException(404, "Análise de ciclos de sono não criada.")

        return sleepAnalysis
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

        const getUserDreams = async (): Promise<DreamOutputWithTags[]> => {
            const userDreams: DreamOutputWithTags[] = await analysisBaseQuery.clone()
                .select('dreams.*')
                .then(result => {
                    const dreamWithTags: DreamOutputWithTags[] = []
                    result.map(dream => {
                        dreamWithTags.push({
                            id: dream["id"],
                            sleepId: dream["sleep_id"],
                            title: dream["title"],
                            description: dream["description"],
                            dreamPointOfViewId: dream["dream_point_of_view_id"],
                            climate: dream["climate"],
                            dreamHourId: dream["dream_hour_id"],
                            dreamDurationId: dream["dream_duration_id"],
                            dreamLucidityLevelId: dream["dream_lucidity_level_id"],
                            dreamTypeId: dream["dream_type_id"],
                            dreamRealityLevelId: dream["dream_reality_level_id"],
                            eroticDream: dream["erotic_dream"],
                            hiddenDream: dream["hidden_dream"],
                            personalAnalysis: dream["personal_analysis"],
                            dreamOriginId: dream["dream_origin_id"],
                            isComplete: dream["is_complete"],
                            tags: [],
                        })
                    })
                    return dreamWithTags
                })

            let i = 0
            for (const dream of userDreams) {
                const tags = await Tag.query()
                    .innerJoin('dream_tags', 'dream_tags.tag_id', 'tags.id')
                    .innerJoin('dreams', 'dreams.id', 'dream_tags.dream_id')
                    .where('dreams.id', dream.id)
                    .select('tags.id', 'tags.title')
                tags.map(tag => {
                    userDreams[i].tags.push({ tagId: tag.id, tagTitle: tag.title })
                })
                i++
            }

            return userDreams
        }
        const userDreams = await getUserDreams()

        if (userDreams.length === 0)
            throw new CustomException(500, "Não há sonhos o suficiente para a criação da estatística.")

        // TODO: futuramente aproveitar a busca geral de sonhos.
        // adicionar todos os innerJoins e incluir o ID e descrição da chave estrangeira
        // criar novo type para isso
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

        const mostClimateOccurence = (): string | null => {
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

            userDreams.map(dream => {
                if (dream.climate.ameno) climatesCount.ameno++
                if (dream.climate.calor) climatesCount.calor++
                if (dream.climate.garoa) climatesCount.garoa++
                if (dream.climate.chuva) climatesCount.chuva++
                if (dream.climate.tempestade) climatesCount.tempestade++
                if (dream.climate.nevoa) climatesCount.nevoa++
                if (dream.climate.neve) climatesCount.neve++
                if (dream.climate.multiplos) climatesCount.multiplos++
                if (dream.climate.outro) climatesCount.outro++
                if (dream.climate.indefinido) climatesCount.indefinido++
            })

            return Object.entries(climatesCount)
                .reduce((climatesCountAnalysisControl, [climate, count]) => {
                        return count > climatesCountAnalysisControl.count ? { climate, count } : climatesCountAnalysisControl
                    },
                    { climate: null, count: 0 } as ClimateCountAnalysis
                ).climate
        }

        const totalDreamsCount: number = userDreams.length

        const eroticDreamsAverage: number = (userDreams.filter(dream => dream.eroticDream).length / totalDreamsCount) * 100

        const longestDreamTitle: string = userDreams.reduce((longestDreamTitleAnalysisControl, dream) => {
            return dream.title.length > longestDreamTitleAnalysisControl.title.length ? { title: dream.title, count: dream.title.length } : longestDreamTitleAnalysisControl
        }, { title: userDreams[0].title, count: userDreams[0].title.length } as LongestDreamTitleAnalysis)
        .title

        const tagPerDreamAverage = (): number => {
            let totalTags = 0
            userDreams.map(dream => {
                totalTags += dream.tags.length
            })
            return totalTags / userDreams.length
        }

        const dreamAnalysisModel: DreamAnalysisInput = {
            month: month,
            year: year,
            mostPointOfViewOccurence: mostPointOfViewOccurence,
            mostClimateOccurence: mostClimateOccurence(),
            mostHourOccurence: mostHourOccurence,
            mostDurationOccurence: mostDurationOccurence,
            mostLucidityLevelOccurence: mostLucidityLevelOccurence,
            mostDreamTypeOccurence: mostDreamTypeOccurence,
            mostRealityLevelOccurenceOccurence: mostRealityLevelOccurenceOccurence,
            eroticDreamsAverage: eroticDreamsAverage,
            tagPerDreamAverage: tagPerDreamAverage(),
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
            .fullOuterJoin('dreams', 'dreams.sleep_id', 'sleeps.id')
            .fullOuterJoin('users', 'users.id', 'sleeps.user_id')
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
                            isNightSleep: sleep["is_night_sleep"],
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

        if (userSleeps.length === 0)
            throw new CustomException(500, "Não há sonos o suficiente para a criação da estatística.")

        // TODO: validar fazer um map geral e com ifs capturar todos os dados de busca
        // evitar multiplos maps e filters

        const dreamsCount: number = await analysisBaseQuery.clone()
            .count('dreams.id')
            .first()
            .then(result => { return Number.parseInt(result["count"]) })

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

            const mostFrequentWakeUpHumor = Object.entries(biologicalOccurencesCount)
                .reduce((biologicalOccurenceControl, [biologicalOccurence, count]) => {
                        return count < biologicalOccurenceControl.count ? { biologicalOccurence: biologicalOccurence, count } : biologicalOccurenceControl
                    },
                    { biologicalOccurence: null, count: 0 } as FrequentBiologicalOccurenceAnalysis
                )

            return mostFrequentWakeUpHumor.biologicalOccurence
        }

        const defaultLeastSleepDurationControlValue = userSleeps.filter(sleep =>
            sleep.sleepTime != undefined
        )[0].sleepTime!

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
            leastSleepDuration: defaultLeastSleepDurationControlValue,
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