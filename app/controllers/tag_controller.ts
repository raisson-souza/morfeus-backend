import { DateTime } from "luxon"
import { HttpContext } from "@adonisjs/core/http"
import { inject } from "@adonisjs/core"
import { listDreamsByTagValidator, listTagsByDreamValidator, listTagsValidator } from "#validators/tag"
import { TagOutput } from "../types/TagTypes.js"
import Dream from "#models/dream"
import ResponseSender from "../functions/core/ResponseMessage.js"
import TagService from "#services/tag_service"

@inject()
export default class TagController {
    constructor(protected tagService: TagService) { }

    async list({ request, response }: HttpContext) {
        try {
            const { date } = await request.validateUsing(listTagsValidator)
            const tagsList = await this.tagService.List(DateTime.fromJSDate(date))
            ResponseSender<TagOutput[]>({ response, data: tagsList })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listByDream({ request, response }: HttpContext) {
        try {
            const { dreamId } = await request.validateUsing(listTagsByDreamValidator)
            const tagsListByDream = await this.tagService.ListByDream(dreamId)
            ResponseSender<TagOutput[]>({ response, data: tagsListByDream })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }

    async listDreamsByTag({ request, response }: HttpContext) {
        try {
            const { tagId } = await request.validateUsing(listDreamsByTagValidator)
            const dreamsListByTag = await this.tagService.ListDreamsByTag(tagId)
            ResponseSender<Dream[]>({ response, data: dreamsListByTag })
        }
        catch (ex) {
            ResponseSender<string>({ response, data: ex as Error })
        }
    }
}