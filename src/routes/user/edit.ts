import {Request, Response} from 'express';
import {ensureValidEditUserInfo} from '../../validations/user/edituserinfo';
import {responses} from '../../responses';
import {sql} from '../../dbinit';

export default async (req: Request, res: Response) => {
    const {isValid,errs,info} = ensureValidEditUserInfo(req.body);
    if(!isValid) {
      res.status(500);
      res.json(responses.users.edit.invalidEditUserInfo(errs));
      return;
    }
    const infoo = info!!; const authedUsername = infoo.authedUsername;
    const dbcolNamesToValues = {'"birthdate"': infoo.birthdate,'"firstname"'   :infoo.firstname  , '"lastname"':infoo.lastname,
                                '"gender"'   : infoo.gender   ,'"nationality"' :infoo.nationality, '"password"':infoo.password};
  
    let query = 'UPDATE "Users" SET ';
    let numEdits = 0;
    let values : string[] = [];
    Object.entries(dbcolNamesToValues).forEach(([dbcolName, value]) => {
      if(value != undefined) {
        numEdits++ ;
        if(numEdits != 1) query += ','
        query += `${dbcolName} = $${numEdits}`;
        values.push(value);
      }
    });
    //All properties were undefined, that means the request object was empty and no db access is needed
    const allUndefined = numEdits == 0;
    if(allUndefined) {
      res.status(200); //The opertion is "successful" trivially, since nothing needs to be done
      res.json(responses.users.edit.noEditsRequested);
      return ;
    }
    
    query += ' WHERE "username" = $'+ (numEdits+1);
    values.push(authedUsername);
    
    const client = await sql.connect();
    try {
      await client.query(query,values);
      res.status(200);
      res.json(responses.users.edit.successful(authedUsername));
    } 
    catch (error) {
      res.status(500);
      res.json(responses.users.edit.dbException(authedUsername));
      console.log(error);
    }
    finally {
      client.release();
    }
  }