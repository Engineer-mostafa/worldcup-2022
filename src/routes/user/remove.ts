import {Request, Response} from 'express';
import {responses} from '../../responses';
import {sql} from '../../dbinit';

export default async (req: Request, res: Response) => {
    const {adminSecret,removedID} = req.body ;
  
    if(adminSecret == process.env.ADMINSECRET) {
      const client = await sql.connect();
  
      try {
        const result = await client.query('SELECT 1 FROM "Users" WHERE "id"=$1',[removedID]);
        
        if(result.rowCount == 1) {
          await client.query('DELETE FROM "Users" WHERE "id"=$1',[removedID]);
          
          res.status(200);
          res.json(responses.users.remove.successful);
        }
        else {
          res.status(500);
          res.json(responses.users.remove.noSuchUser(removedID));
        }
      }
      catch (error) {
        res.status(500);
        res.json(responses.users.remove.dbException);
        console.log(error);
      }
      finally {
      client.release();
      }
    } else {
      res.status(500);
      res.json(responses.users.remove.invalidAdminSecret);
    }
}