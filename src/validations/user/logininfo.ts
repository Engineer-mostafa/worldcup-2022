import Joi = require('joi');

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(8).required()
});

interface LoginInfoValidationResult {
    isValid: boolean,
    errs: string[],
    info?: {username: string, password: string}
}

export function ensureValidLoginInfo(reqBody: any) : LoginInfoValidationResult {
    const {value,error} = loginSchema.validate(reqBody,
                                               {abortEarly: false});
    
    if(error) {
        return {
            isValid: false,
            errs: error.details.map((errItem) => errItem.message)
        };
    }
    return {isValid: true, errs: [],
            info: value as {username: string, password: string}};                                           
}