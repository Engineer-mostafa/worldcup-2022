
import {Request, Response} from 'express';
import {ensureValidAuthorizationInfo} from '../../validations/user/authorizationinfo';
import {responses} from '../../responses';
import {sql} from '../../dbinit';

export default async (req: Request, res: Response) => {
    const {isValid,errs,info} = ensureValidAuthorizationInfo(req.body);
    if(!isValid) {
      res.status(500);
      res.json(responses.users.authorize.invalidAuthorizationInfo(errs));
      return;
    }
  
    const {adminSecret,authorizedId} = info!!;
    
    if(adminSecret != process.env.ADMINSECRET) {
      res.status(500);
      res.json(responses.users.authorize.invalidAdminSecret);
      return;
    }
  
    const client = await sql.connect();
  
    try {
      const result = await client.query('SELECT 1 FROM "Users" WHERE "id"=$1',[authorizedId]);
      
      if(result.rowCount == 1) {
        const result = await client.query('UPDATE "Users" SET "role"=\'manager\' WHERE "id"=$1 AND "role"=\'unapprovedManager\'',[authorizedId]);
        
        if(result.rowCount == 1) {
          res.status(200);
          res.json(responses.users.authorize.successful);
        } else {
          res.status(500);
          res.json(responses.users.authorize.nonPendingUserCannotBeApproved);
        }
      } else {
        res.status(500);
        res.json(responses.users.authorize.noSuchUser(authorizedId));
      }
    }
    catch (error) {
      res.status(500);
      res.json(responses.users.authorize.dbException);
      console.log(error);
    }
    finally {
      client.release();
    }
}