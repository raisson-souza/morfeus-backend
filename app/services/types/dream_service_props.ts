import { DateTime } from "luxon"
import { DreamCompleteUpdateInput, DreamListedByUser, DreamWithTags, ListDreamsByUser, CreateDreamModel } from "../../types/dreamTypes.js"
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import BaseProps from "./base_props.js"
import Dream from "#models/dream"

export default interface DreamServiceProps extends BaseProps<Dream, CreateDreamModel, DreamCompleteUpdateInput> {
    // /** Cria um sonho incompleto */
    // CreateUncomplete(entity: CreateDreamModel): Promise<Dream>
    /** Lista sonhos pelo usuário */
    ListByUser(listingProps: ListDreamsByUser): Promise<DreamListedByUser[]>
    /** Cria / Atualiza as tags de um sonho */
    ManageTags(newTags: string[], dreamId: number, trx: TransactionClientContract): Promise<void>
    /** Lista sonhos de um sono com tags */
    ListDreamsBySleep(sleepId: number, date: DateTime): Promise<DreamWithTags[]>
    GetUserDream(dreamId: number, userId: number): Promise<Dream | null>
}