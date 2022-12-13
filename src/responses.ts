import jwt = require('jsonwebtoken');
import moment = require('moment');

const failure = "failure";
const success = "success";

export const responses = {
    new: {
        invalidUserInfo: (errs: string[]) => { return {
            result: failure,
            msg: "invalid user info : "+ errs.join(" , ")
        }},
        usernameAlreadyExists: {
            result: failure,
            msg: "username already exists"
        },
        sucessful: {
            result: success,
            msg: "successfully created a new user"
        },
        dbException: {
            result: failure,
            msg: "cannot create a new user"
        }
    },
    login: {
        successful: (username: string) => { return {
            result: success,
            token: jwt.sign({
                                 username: username,
                                 expiresOn: moment().add(1,'day').toDate()
                                },
                                process.env.JWTSECRET!!)
            
        }},
        noSuchUser: (username: string) => { return {
            result: failure,
            msg: `no such user ${username} or wrong password`
        }},
        dbException: {
            result: failure,
            msg: "cannot login"
        }
    }
}