import {Request, Response} from 'express';
import {ensureValidUserInfo} from '../../validations/user/userinfo';
import {responses} from '../../responses';
import {sql} from '../../dbinit';

export default async (req: Request, res: Response) => {
    const {isValid,errs,info} = ensureValidUserInfo(req.body);
    if(!isValid) {
        res.status(500);
        res.json(responses.users.new.invalidUserInfo(errs));
        return;
    }
  
    const {username,password,firstname,lastname,
           birthdate,gender,nationality,email,role} = info!!;
           
    const client = await sql.connect();
  
    try {
      const usernameExists = (await client.query('SELECT 1 FROM "Users" WHERE "username"=$1',[username])).rowCount == 1;
      if(usernameExists) {
        res.status(500);
        res.json(responses.users.new.usernameAlreadyExists);
      } else {
        await client.query('INSERT INTO "Users"("username","password","firstname","lastname","birthdate","gender","nationality","email","role") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                          [username,password,firstname,lastname,birthdate,gender,nationality ,email,(role=='manager')?"unapprovedManager":role]);
      
        res.status(200);
        res.json(responses.users.new.successful);
      }
    } 
    catch (error) {
      res.status(500);
      res.json(responses.users.new.dbException);
      console.log(error);
    }
    finally {
      client.release();
    }
}