import { CreateSimpleSleepProps, GetSimpleSleepProps, ListSleepsByUserProps, SleepCreationInput, SleepUpdateProps } from "../../types/sleepTypes.js"
import { DateTime } from "luxon"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import BaseProps from "./base_props.js"
import Sleep from "#models/sleep"

export default interface SleepServiceProps extends BaseProps<Sleep, SleepCreationInput, SleepUpdateProps> {
    /** Lista sonos pelo usuário */
    ListByUser(date: DateTime, userId: number): Promise<ListSleepsByUserProps[]>
    /** Cria e edita um sono simples */
    CreateSimpleSleep(simpleSleep: CreateSimpleSleepProps): Promise<void>
    /** Retorna informações simples do sono anterior */
    GetSimpleSleep(userId: number): Promise<GetSimpleSleepProps>
    /** Valida a criação de um sono */
    ValidateSleepCreation(userId: number, sleepDate: DateTime<boolean>, sleepStart: DateTime<boolean>, sleepEnd: DateTime<boolean>): Promise<void>
    ListSleepsForDreamCreation(userId: number, pageNumber: number): Promise<ModelPaginatorContract<Sleep>>
    GetUserSleep(sleepId: number, userId: number): Promise<Sleep | null>
}