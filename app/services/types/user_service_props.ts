import { AccessToken } from "@adonisjs/auth/access_tokens"
import { DateTime } from "luxon"
import { ExportUserData, UserInput, UserModalAccountRecovery, UserOutput } from "../../types/userTypes.js"
import { MultipartFile } from "@adonisjs/core/bodyparser"
import BaseProps from "./base_props.js"
import User from "#models/user"

export default interface UserServiceProps extends BaseProps<User, UserInput, UserOutput> {
    /** Realiza o login */
    Login(email: string, password: string): Promise<AccessToken>
    /** Realiza a exclusão de dados do usuário */
    DataDeletion(userId: number): Promise<string>
    /** Realiza a criação do processo de recuperação de conta */
    CreateAccountRecovery(email: string): Promise<void>
    /** Realiza a verificação de um processo de recuperação de conta */
    CheckAccountRecovery(code: string): Promise<string>
    /** Realiza a finalização do processo de recuperação de conta */
    FinishAccountRecovery(userModel: UserModalAccountRecovery): Promise<string>
    /** Realiza a exportação dos dados do usuário */
    ExportUserData(userId: number, startDate: DateTime<true>, endDate: DateTime<true>): Promise<ExportUserData>
    /** Realiza a importação dos dados do usuário */
    ImportUserData(userId: number, file: MultipartFile | null, fileContent: string | null, isSameOriginImport: boolean, dreamsPath: string | null, sendEmailOnFinish: boolean): Promise<string>
    /** Realiza a sincronização dos dados do usuário */
    SyncRecords(userId: number, monthDate: DateTime<true> | null): Promise<ExportUserData>
}