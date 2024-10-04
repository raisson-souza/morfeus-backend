import { CreateSimpleSleepProps, GetSimpleSleepProps, SleepCreationInput, SleepOutput } from "../../types/sleepTypes.js"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"
import BaseProps from "./base_props.js"
import Sleep from "#models/sleep"

export default interface SleepServiceProps extends BaseProps<Sleep, SleepCreationInput, SleepOutput> {
    /** Lista sonos pelo usuário */
    ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Sleep>>
    /** Cria um sono simples */
    CreateSimpleSleep(simpleSleep: CreateSimpleSleepProps): Promise<void>
    /** Retorna true se o sono da data anterior à referente não existe ou se existe e não tem hora inicial ou final de sono */
    AskSimpleSleep(userId: number, date?: Date): Promise<boolean>
    /** Retorna informações simples do sono anterior */
    GetSimpleSleep(userId: number, date?: Date): Promise<GetSimpleSleepProps>
}