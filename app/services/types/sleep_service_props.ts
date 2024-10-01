import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"
import { SleepCreationInput, SleepOutput } from "../../types/sleepTypes.js"
import BaseProps from "./base_props.js"
import Sleep from "#models/sleep"

export default interface SleepServiceProps extends BaseProps<Sleep, SleepCreationInput, SleepOutput> {
    /** Lista sonos pelo usuário */
    ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Sleep>>
}