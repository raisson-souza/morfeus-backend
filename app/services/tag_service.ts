import { DateTime } from "luxon"
import { TagOutput, TagWithQuantity } from "../types/TagTypes.js"
import CustomException from "#exceptions/custom_exception"
import db from "@adonisjs/lucid/services/db"
import Dream from "#models/dream"
import Tag from "#models/tag"
import TagServiceProps from "./types/tag_service_props.js"

export default class TagService implements TagServiceProps {
    async List(date: DateTime): Promise<TagWithQuantity[]> {
        if (date > DateTime.now())
            throw new CustomException(404, "Data de filtragem de tags não pode ser maior que a atual.")

        const tags: TagWithQuantity[] = await db.query()
            .from("tags")
            .innerJoin("dream_tags", "tags.id", "dream_tags.tag_id")
            .innerJoin("dreams", "dreams.id", "dream_tags.dream_id")
            .innerJoin("sleeps", "sleeps.id", "dreams.sleep_id")
            .select("tags.id", "tags.title")
            .count("* as quantity")
            .whereRaw("EXTRACT(YEAR FROM sleeps.date) = ?", [date.year])
            .andWhereRaw("EXTRACT(MONTH FROM sleeps.date) = ?", [date.month])
            .groupBy("tags.id", "tags.title")
            .then(result => {
                return result.map(tag => {
                    return {
                        id: tag.id,
                        title: tag.title,
                        quantity: Number.parseInt(tag.quantity)
                    } as TagWithQuantity
                })
            })

        return tags
    }

    async ListByDream(dreamId: number): Promise<TagOutput[]> {
        const dreamExists = await Dream.find(dreamId).then(result => { return result != null })
        if (!dreamExists)
            throw new CustomException(404, "Sonho não encontrado.")

        const tags: TagOutput[] = await Tag.query()
            .innerJoin("dream_tags", "dream_tags.tag_id", "tags.id")
            .innerJoin("dreams", "dreams.id", "dream_tags.dream_id")
            .where("dream_id", dreamId)
            .select("tags.*")
            .orderBy("tags.id")
            .then(result => {
                return result.map(tag => {
                    return {
                        id: tag.id,
                        title: tag.title,
                    } as TagOutput
                })
            })

        return tags
    }

    async ListDreamsByTag(tagId: number): Promise<Dream[]> {
        const tagExists = await Tag.find(tagId).then(result => { return result != null })
        if (!tagExists)
            throw new CustomException(404, "Tag não encontrada.")

        const dreams: Dream[] = await Dream.query()
            .from("dreams")
            .innerJoin("dream_tags", "dream_tags.dream_id", "dreams.id")
            .innerJoin("tags", "tags.id", "dream_tags.tag_id")
            .where("dream_tags.tag_id", tagId)
            .select("dreams.*")
            .orderBy("dreams.id")

        return dreams
    }
}