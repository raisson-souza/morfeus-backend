export default interface BaseProps<Entity, CreateEntity, UpdateEntity> {
    Create: (_ : CreateEntity) => void
    Update: (_ : UpdateEntity) => void
    Get: (id : number) => Promise<Entity | null>
    List: () => Promise<Entity[]>
}