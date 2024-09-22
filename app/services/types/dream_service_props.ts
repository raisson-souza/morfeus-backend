import { DreamCompleteInput, DreamOutput, DreamUncompleteInput } from "../../types/dreamTypes.js"
import { ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"
import BaseProps from "./base_props.js"
import Dream from "#models/dream"

export default interface DreamServiceProps extends BaseProps<Dream, DreamCompleteInput, DreamOutput> {
    CreateUncomplete(entity: DreamUncompleteInput): Promise<Dream>
    ListByUser(pagination: Pagination, userId: number): Promise<ModelPaginatorContract<Dream>>
}