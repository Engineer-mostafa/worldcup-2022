import Joi = require('joi');

const authorizationSchema = Joi.object({
    authorizedId: Joi.string().pattern(/^[0-9]{1,19}$/).required(),
    adminSecret: Joi.string().required()
});

interface AuthorizationInfoValidationResult {
    isValid: boolean,
    errs: string[],
    info?: {adminSecret: string, authorizedId: string}
}


export function ensureValidAuthorizationInfo(reqBody: any) : AuthorizationInfoValidationResult {
    const {value,error} = authorizationSchema.validate(reqBody,
                                                       {abortEarly: false});
    
    if(error) {
        return {
            isValid: false,
            errs: error.details.map((errItem) => errItem.message)
        };
    }
    return {isValid: true, errs: [],
            info: value as {authorizedId: string, adminSecret: string}};  
    
    
}