import User from "#models/user"

export type BaseProps = {
    Create: (_ : any) => void
    Update: (_ : any) => void
    Get: (id : number) => Promise<User | null>
    List: () => Promise<User[]>
}