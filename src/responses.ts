import jwt = require('jsonwebtoken');
import moment = require('moment');

const failure = "failure";
const success = "success";

export const responses = {
    middleware: {
        auth: {
            expiredToken: {
                result: failure,
                msg: "invalid token : token expired, login again to obtain a fresh token"
              },
            invalidToken: {
                result: failure,
                msg: "invalid token : token is not signed with a trusted secret key, i.e. is cryptographically invalid"
              }
        }
    },
    users: {
        new: {
            invalidUserInfo: (errs: string[]) => { return {
                result: failure,
                msg: "invalid user info : "+ errs.join(" , ")
            }},
            usernameAlreadyExists: {
                result: failure,
                msg: "username already exists"
            },
            successful: {
                result: success,
                msg: "successfully created a new user"
            },
            dbException: {
                result: failure,
                msg: "cannot create a new user"
            }
        },
        login: {
            invalidLoginInfo: (errs: string[]) => { return {
                result: failure,
                msg: "invalid login info : "+ errs.join(" , ")
            }},
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
        },
        authorize: {
            invalidAuthorizationInfo: (errs: string[]) => { return {
                result: failure,
                msg: "invalid authorization info : "+ errs.join(" , ")
            }},
            invalidAdminSecret: {
                result: failure,
                msg: "invalid admin secret, cannot authorize approval"
            },
            successful: {
                result: success,
                msg: "user was approved as a manager"
            },
            nonPendingUserCannotBeApproved: {
                result: failure,
                msg: "cannot approve a non-pending user as a manager (user is either a fan or already a manager)"
            },
            noSuchUser: (authorizedId: string) => { return {
                result: failure,
                msg:"no such user with id "+authorizedId
            }},
            dbException: {
                result: failure,
                msg:"cannot approve the user"
            }
        },
        remove: {
            successful:{
                result: success,
                msg: "user removed"
            },
            dbException: {
                result: failure,
                msg: "cannot remove the user"
            },
            invalidAdminSecret: {
                result: failure,
                msg: "invalid admin secret, cannot authorize removal"
            },
            noSuchUser: (authorizedId: string) => { return {
                result: failure,
                msg:"no such user with id "+authorizedId
            }}
        },
        edit: {
            invalidEditUserInfo:(errs: string[]) => { return {
                result: failure,
                msg: "invalid edit info : "+ errs.join(" , ")
            }},
            noEditsRequested: {
                result: success,
                msg: "no edits requested, no edits done"
            },
            successful: (authedUsername: string) => { return {
                result: success,
                msg: "successfully edited user "+ (authedUsername)
            }},
            dbException: (authedUsername: string) => { return {
                result: failure,
                msg: "cannot edit user "+ (authedUsername as string)
            }}
        }
    }
}