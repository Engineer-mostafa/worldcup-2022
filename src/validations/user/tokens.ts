import jwt = require('jsonwebtoken')

interface JwtTokenValidationResult {
    isValid: boolean,
    isExpired: boolean,
    username: string
}

export default function ensureValidToken(jwtTok : string|undefined): JwtTokenValidationResult {
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


