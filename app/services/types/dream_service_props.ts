import { DateTime } from "luxon"
import { DreamCompleteInput, DreamCompleteUpdateInput, DreamListedByUser, DreamUncompleteInput, DreamWithTags, ListDreamsByUser } from "../../types/dreamTypes.js"
import { TransactionClientContract } from "@adonisjs/lucid/types/database"
import BaseProps from "./base_props.js"
import Dream from "#models/dream"

export default interface DreamServiceProps extends BaseProps<Dream, DreamCompleteInput, DreamCompleteUpdateInput> {
    /** Cria um sonho incompleto */
    CreateUncomplete(entity: DreamUncompleteInput): Promise<Dream>
    /** Lista sonhos pelo usuário */
    ListByUser(listingProps: ListDreamsByUser): Promise<DreamListedByUser[]>
    /** Cria / Atualiza as tags de um sonho */
    CreateTags(tags: string[], dreamId: number, trx: TransactionClientContract): Promise<void>
    /** Lista sonhos de um sono com tags */
    ListDreamsBySleep(sleepId: number, date: DateTime): Promise<DreamWithTags[]>
}