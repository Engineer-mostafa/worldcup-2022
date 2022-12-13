
interface EditUserInfo {
    password?: string, 
    firstname?: string, 
    lastname?:  string, 
    birthdate?: string,
    gender?: "male"|"female",
    role?: "fan"|"manager",
    nationality?: string
}

interface EditUserInfoValdationResult {
    isValid: boolean,
    errs: string[],
    info: EditUserInfo
}

export default function ensureValidEditUserInfo(reqBody: any) : EditUserInfoValdationResult {

}