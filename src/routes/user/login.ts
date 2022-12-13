import {Request, Response} from 'express';
import {ensureValidLoginInfo} from '../../validations/user/logininfo';
import {responses} from '../../responses';
import {sql} from '../../dbinit';


export default async (req: Request, res: Response) => {
    const {isValid,errs,info} = ensureValidLoginInfo(req.body);
    if(!isValid) {
      res.status(500);
      res.json(responses.users.login.invalidLoginInfo(errs));
      return;
    }
  
    const {username,password} = info!!;
  
    const client = await sql.connect();
  
    try {
      const result = await client.query('SELECT 1 FROM "Users" WHERE "username"=$1 AND "password"=$2',[username,password]);
  
      if(result.rowCount == 1) {
        res.status(200);
        res.json(responses.users.login.successful(username));  
      } else {
        res.status(500);
        res.json(responses.users.login.noSuchUser(username));
      }
    }
    catch(error) {
        res.status(500);
        res.json(responses.users.login.dbException);
        console.log(error);
    }
    finally {
      client.release();
    }
  }