import env from "#start/env"
import nodemailer from "nodemailer"
import SMTPTransport from "nodemailer/lib/smtp-transport/index.js"

type EmailSenderSendProps = {
    subject: string
    text: string
    to: string
}

abstract class EmailSender
{
    private static NodeMailer = nodemailer.createTransport(
        {
            service: env.get("EMAILSENDER_EMAILSERVICE"),
            auth: {
                user: env.get("EMAILSENDER_EMAIL"),
                pass: env.get("EMAILSENDER_PASSWORD"),
            }
        }
    )

    static async Send({
        subject,
        text,
        to
    }: EmailSenderSendProps): Promise<SMTPTransport.SentMessageInfo> {
        return await this.NodeMailer.sendMail({
            to: to,
            subject: `Morfeus - ${ subject }`,
            text: `${ text }\n\nPor favor, não responda este email.`,
        })
    }
}

export default EmailSender