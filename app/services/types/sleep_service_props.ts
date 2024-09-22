import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"
import { SleepInput, SleepOutput } from "../../types/sleepTypes.js"
import BaseProps from "./base_props.js"
import Sleep from "#models/sleep"

export default interface SleepServiceProps extends BaseProps<Sleep, SleepInput, SleepOutput> {
    ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Sleep>>
}