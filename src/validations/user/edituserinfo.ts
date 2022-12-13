import Joi = require('joi');
import {nationalities} from './userinfo';

interface EditUserInfo {
    authedUsername:string,
    password?: string, 
    firstname?: string, 
    lastname?:  string, 
    birthdate?: string,
    gender?: "male"|"female",
    nationality?: string
}

interface EditUserInfoValdationResult {
    isValid: boolean,
    errs: string[],
    info?: EditUserInfo
}
const editSchema = Joi.object({
    /************************ */
    authedUsername: Joi.string()
                 .optional(),
    /************************ */
    password: Joi.string()
                 .min(8)
                 .optional(),
    /************************ */
    firstname: Joi.string()
                  .optional(),
    /************************ */
    lastname: Joi.string()
                 .optional(),
    /************************ */
    birthdate: Joi.date()
                  .less('now')
                  .optional(),
    /************************ */
    gender: Joi.string()
               .lowercase()
               .valid('male','female')
               .optional(),
    /************************ */
    nationality: Joi.string()
                    .insensitive()
                    .valid(...nationalities)
                    .optional()
});
export default function ensureValidEditUserInfo(reqBody: any) : EditUserInfoValdationResult {
    const {value,error} = editSchema.validate(reqBody,
                                              {abortEarly: false});
    if(error) {
        return {
        isValid: false,
        errs: error.details.map((errItem) => errItem.message)
        };
    }
    return {isValid: true, errs: [],
            info: value as EditUserInfo};

}