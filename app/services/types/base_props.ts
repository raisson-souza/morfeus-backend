import { LucidRow, ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"

export default interface BaseProps<Entity extends LucidRow, CreateEntity, UpdateEntity> {
    Create: (_ : CreateEntity, validate: boolean) => Promise<Entity>
    Update: (_ : UpdateEntity, validate: boolean) => Promise<Entity>
    Validate: (_ : CreateEntity) => Promise<void>
    Get: (id : number) => Promise<Entity | null>
    Delete: (id : number) => void
    List(pagination : Pagination) : Promise<ModelPaginatorContract<Entity>>
}