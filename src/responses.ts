const failure = "failure";
const success = "success";

export const responses = {
    new: {
        invalidUserInfo: (errs: string[]) => { return {
            result: failure,
            msg: "invalid user info : "+ errs.join(" , ")
        }},
    },
}