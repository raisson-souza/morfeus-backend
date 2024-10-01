import { LucidRow, ModelPaginatorContract } from "@adonisjs/lucid/types/model"
import { Pagination } from "../../types/pagiation.js"

export default interface BaseProps<Entity extends LucidRow, CreateEntity, UpdateEntity> {
    /** Cria a entidade */
    Create: (_ : CreateEntity, validate: boolean) => Promise<Entity>
    /** Atualiza a entidade */
    Update: (_ : UpdateEntity, validate: boolean) => Promise<Entity>
    /** Valida a criação / atualização de uma entidade */
    Validate: (_ : CreateEntity) => Promise<void>
    /** Captura uma entidade */
    Get: (id : number) => Promise<Entity | null>
    /** Deleta uma entidade */
    Delete: (id : number) => void
    /** Lista entidades */
    List(pagination : Pagination) : Promise<ModelPaginatorContract<Entity>>
}