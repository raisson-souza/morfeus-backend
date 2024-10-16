import { DateTime } from "luxon"
import { TagOutput, TagWithQuantity } from "../../types/TagTypes.js"
import Dream from "#models/dream"

export default interface TagServiceProps {
    /** 
     * Lista tags presentes em sonhos dentro do mês de uma determinada data  
     * Apresenta a quantidade de tags registradas também
    */
    List(date: DateTime): Promise<TagWithQuantity[]>
    /** Lista tags de um determinado sonho */
    ListByDream(dreamId: number): Promise<TagOutput[]>
    /** Lista sonhos que possuem uma determinada tag */
    ListDreamsByTag(tagId: number): Promise<Dream[]>
}