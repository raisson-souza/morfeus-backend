import { DateTime } from "luxon"
import { DreamCompleteInput, DreamCompleteUpdateInput, DreamUncompleteInput, DreamWithTags } from "../../types/dreamTypes.js"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import BaseProps from "./base_props.js"
import Dream from "#models/dream"

export default interface DreamServiceProps extends BaseProps<Dream, DreamCompleteInput, DreamCompleteUpdateInput> {
    CreateUncomplete(entity: DreamUncompleteInput): Promise<Dream>
    ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Dream>>
    /** Cria / Atualiza as tags de um sonho */
    CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void>
    /** Lista sonhos de um sono com tags */
    ListDreamsBySleep(sleepId: number, date: DateTime): Promise<DreamWithTags[]>
}