//SERVER 
import express = require('express');
import { Express, NextFunction, Request, Response } from 'express';
//CONFIG
import dotenv = require('dotenv');
//JSON RESPONSES
import { responses } from './responses';
//VALIDATIONS
import ensureValidToken from './validations/user/tokens';
import {ensureValidUserInfo} from './validations/user/userinfo';
import ensureValidLoginInfo from './validations/user/logininfo';
import ensureValidAuthorizationInfo from './validations/user/authorizationinfo';
import ensureValidEditUserInfo from './validations/user/edituserinfo';

dotenv.config();

const app = express();
const serverPort = process.env.PORT || 5000; 
const apiroot = process.env.APIROOT;

app.use(express.json());

const nonAuthedRoutes = [
  'users/new',
  'users/login',
  /* Those are very sensitive routes only available to the app's admin, but their way of authentication is an encrypted secret phrase in the request's body, not a signed JWT token */
  'users/authorize',
  'users/remove',
  'users/list',
].map((route) => apiroot+route); 

app.use((req: Request, res: Response, next: NextFunction) => {
  if(nonAuthedRoutes.includes(req.path)) {
    return next();
  } 

  const {isValid,isExpired,username} = ensureValidToken(req.get('authorization')?.split(' ')[1]);
  if(!isValid) {
    res.status(500);
    res.json(responses.middleware.auth.invalidToken);
    return;
  }
  if(isExpired) {
    res.status(500);
    res.json(responses.middleware.auth.expiredToken)
    return;
  }

  req.body.authedUsername = username;
  next();
});

app.post(apiroot+ 'users/new', async (req: Request, res: Response) => {
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
                        [username,password,firstname,lastname,birthdate,gender,nationality ,email,role]);
    
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
});

app.post(apiroot+ 'users/login',async (req: Request, res: Response) => {
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
});

app.post(apiroot+ 'users/authorize', async (req: Request, res: Response) => {
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
});

app.post(apiroot+ 'users/remove', async (req: Request, res: Response) => {
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
});


//AUTHED 
app.post(apiroot+ 'users/edit', async (req: Request, res: Response) => {
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
});

app.listen(serverPort, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${serverPort}`);
});