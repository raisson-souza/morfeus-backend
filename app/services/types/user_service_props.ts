import { AccessToken } from "@adonisjs/auth/access_tokens"
import { UserInput, UserOutput } from "../../types/userTypes.js"
import BaseProps from "./base_props.js"
import User from "#models/user"

export default interface UserServiceProps extends BaseProps<User, UserInput, UserOutput> {
    /** Realiza o login */
    Login(email: string, password: string): Promise<AccessToken>
}