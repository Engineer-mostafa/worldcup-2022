import jwt = require('jsonwebtoken')
import Joi = require('joi');
import moment = require('moment');

interface JwtTokenValidationResult {
    isValid: boolean,
    isExpired: boolean,
    username: string
}
export function ensureValidToken(jwtTok : string|undefined): JwtTokenValidationResult {
    if(!jwtTok) return {isValid:false,isExpired:false,username:""};

    try {
        const {expiresOn,username} = jwt.verify(jwtTok,process.env.JWTSECRET!!) as {expiresOn:Date,username:string};

        if(expiresOn >= new Date()) return {isValid:true,isExpired:true,username:""};

        return {isValid: true,
                isExpired: false,
                username: username};
    }
    catch(error) {
        console.log(error);
        return {isValid:false,isExpired:false,username:""};
    }
}


const nationalities = ['Afghan','Albanian','Algerian','American','Andorran','Angolan','Antiguans and Barbudan','Argentine','Armenian','Aruban','Australian','Austrian','Azerbaijani',
'Bahamian','Bahraini','Bangladeshi','Barbadian','Basque','Belarusian','Belgian','Belizean','Beninese','Bermudian','Bhutanese','Bolivian','Bosniak','Bosnians and Herzegovinian','Botswana',
'Brazilian','Breton','British','British Virgin Islander','Bruneian','Bulgarian','Macedonian Bulgarian','Burkinabé','Burmese','Burundian','Cambodian','Cameroonian','Canadian','Catalan',
'Cape Verdean','Caymanian','Chaldean','Chadian','Chilean','Chinese','Colombian','Comorian','Congolese (DRC)','Congolese (RotC)','Costa Rican','Croat','Cuban','Cypriot','Czech','Dane',
'Greenlander','Djiboutian','Dominicans (Commonwealth)','Dominicans (Republic)','Dutch','East Timorese','Ecuadorian','Egyptian','Emirati','English','Equatoguinean','Eritrean','Estonian',
'Ethiopian','Falkland Islander','Faroese','Fijian','Finn','Finnish Swedish','Filipino','French citizen','Gabonese','Gambian','Georgian','German','Baltic German','Ghanaian','Gibraltarian',
'Greek','Greek Macedonian','Grenadian','Guatemalan','Guianese (French)','Guinean','Guinea-Bissau national','Guyanese','Haitian','Honduran','Hong Konger','Hungarian','Icelander','I-Kiribati',
'Indian','Indonesian','Iranian','Iraqi','Irish','Israeli','Italian','Ivoirian','Jamaican','Japanese','Jordanian','Kazakh','Kenyan','Korean','Kosovar','Kuwaiti','Kyrgyz','Lao','Latvian' ,
'Lebanese','Liberian','Libyan','Liechtensteiner','Lithuanian','Luxembourger','Macao','Macedonian','Malagasy','Malawian','Malaysian','Maldivian','Malian','Maltese','Manx','Marshallese' ,
'Mauritanian','Mauritian','Mexican','Micronesian','Moldovan','Monégasque','Mongolian','Montenegrin','Moroccan','Mozambican','Namibian','Nauruan','Nepalese','New Zealander','Nicaraguan',
'Nigerien','Nigerian','Norwegian','Omani','Pakistani','Palauan','Palestinian','Panamanian','Papua New Guinean','Paraguayan','Peruvian','Pole','Portuguese','Puerto Rican','Qatari','Quebecer',
'Réunionnai','Romanian','Russian','Baltic Russian','Rwandan','Saint Kitts and Nevi','Saint Lucian','Salvadoran','Sammarinese','Samoan','São Tomé and Príncipe','Saudi','Scot','Senegalese',
'Serb','Seychelloi','Sierra Leonean','Singaporean','Slovak','Slovene','Solomon Islander','Somali','Somalilander','Sotho','South African','Spaniard','Sri Lankan','Sudanese','Surinamese',
'Swazi','Swede','Swis','Syriac','Syrian','Taiwanese','Tamil','Tajik','Tanzanian','Thai','Tibetan','Tobagonian','Togolese','Tongan','Trinidadian','Tunisian','Turk','Tuvaluan','Ugandan',
'Ukrainian','Uruguayan','Uzbek','Vanuatuan','Venezuelan','Vietnamese']
const userSchema = Joi.object({
    /************************ */
    username: Joi.string()
                 .required(),
    /************************ */
    password: Joi.string()
                 .min(8)
                 .required(),
    /************************ */
    firstname: Joi.string()
                  .required(),
    /************************ */
    lastname: Joi.string()
                 .required(),
    /************************ */
    birthdate: Joi.date()
                  .less('now')
                  .required(),
    /************************ */
    gender: Joi.string()
               .lowercase()
               .valid('male','female')
               .required(),
    /************************ */
    nationality: Joi.string()
                    .insensitive()
                    .valid(...nationalities)
                    .optional(),
    /************************ */
    email: Joi.string()
              .email()
              .required(),
    /************************ */
    role: Joi.string()
             .lowercase()
             .valid('fan','manager')
             .required()
});


interface UserInfo {
    username: string,
    password: string, 
    firstname: string, 
    lastname:  string, 
    birthdate: string,
    email: string,
    gender: "male"|"female",
    role: "fan"|"manager",
    nationality?: string
}
interface UserInfoValidationResult {
    isValid: boolean,
    errs: string[],
    info?: UserInfo
}

export function ensureValidUserInfo(reqBody : object) : UserInfoValidationResult {
    const {value,error} = userSchema.validate(reqBody,
                                              {abortEarly: false});
    
    if(error) {
        return {
            isValid: false,
            errs: error.details.map((errItem) => errItem.message)
        };
    }

    return {isValid: true, errs: [],
            info: value as UserInfo};
}