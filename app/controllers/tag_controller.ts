import { DateTime } from "luxon"
import { HttpContext } from "@adonisjs/core/http"
import { inject } from "@adonisjs/core"
import { listDreamsByTagValidator, listTagsByDreamValidator, listTagsValidator } from "#validators/tag"
import { TagOutput } from "../types/TagTypes.js"
import Dream from "#models/dream"
import TagService from "#services/tag_service"

@inject()
export default class TagController {
    constructor(protected tagService: TagService) { }

    async list({ request }: HttpContext): Promise<TagOutput[]> {
        const { date } = await request.validateUsing(listTagsValidator)
        return await this.tagService.List(DateTime.fromJSDate(date))
    }

    async listByDream({ request }: HttpContext): Promise<TagOutput[]> {
        const { dreamId } = await request.validateUsing(listTagsByDreamValidator)
        return await this.tagService.ListByDream(dreamId)
        
    }

    async listDreamsByTag({ request }: HttpContext): Promise<Dream[]> {
        const { tagId } = await request.validateUsing(listDreamsByTagValidator)
        return await this.tagService.ListDreamsByTag(tagId)
    }
}