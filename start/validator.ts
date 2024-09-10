import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
    // Applicable for all fields
    'required': 'O campo {{ field }} é obrigatório',
    'string': 'O campo {{ field }} deve ser uma string',
    'email': 'O campo deve ser um email',

    // // Error message for the username field
    // 'username.required': 'Please choose a username for your account',
})
