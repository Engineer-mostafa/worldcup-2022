//SERVER 
const express = require('express');
import { Express, NextFunction, Request, Response } from 'express';
//DATABASE
import { Pool } from 'pg';
//CONFIG
import dotenv = require('dotenv');
//JSON RESPONSES
import { responses } from './responses';
//VALIDATIONS
import ensureValidToken from './validations/tokens';
import ensureValidUserInfo from './validations/userinfo';
import ensureValidLoginInfo from './validations/logininfo';

dotenv.config();
const app: Express = express();
const serverPort = process.env.PORT || 5000; 

const dbsettings = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: +(process.env.PGPORT || 5432)
};
const sql = new Pool(dbsettings);

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
    res.json({
      result: "failure",
      msg: "invalid token : token is not signed with a trusted secret key"
    });
    return;
  }
  if(isExpired) {
    res.status(500);
    res.json({
      result: "failure",
      msg: "invalid token : token expired, login again to obtain a fresh token"
    })
    return;
  }

  req.body.authedUsername = username;
  next();
});

app.post(apiroot+ 'users/new', async (req: Request, res: Response) => {
  const {isValid,errs,info} = ensureValidUserInfo(req.body);
  if(!isValid) {
      res.status(500);
      res.json(responses.new.invalidUserInfo(errs));
      return;
  }

  const {username,password,firstname,lastname,
         birthdate,gender,nationality,email,role} = info!!;
         
  const client = await sql.connect();

  try {
    const usernameExists = (await client.query('SELECT 1 FROM "Users" WHERE "username"=$1',[username])).rowCount == 1;
    if(usernameExists) {
      res.status(500);
      res.json(responses.new.usernameAlreadyExists);
    } else {
      await client.query('INSERT INTO "Users"("username","password","firstname","lastname","birthdate","gender","nationality","email","role") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
                        [username,password,firstname,lastname,birthdate,gender,nationality ,email,role]);
    
      res.status(200);
      res.json(responses.new.sucessful);
    }
  } 
  catch (error) {
    res.status(500);
    res.json(responses.new.dbException);
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
    res.json(responses.login.invalidLoginInfo(errs));
    return;
  }

  const {username,password} = info;

  const client = await sql.connect();

  try {
    const result = await client.query('SELECT 1 FROM "Users" WHERE "username"=$1 AND "password"=$2',[username,password]);

    if(result.rowCount == 1) {
      res.status(200);
      res.json(responses.login.successful(username));  
    } else {
      res.status(500);
      res.json(responses.login.noSuchUser(username));
    }
  }
  catch(error) {
      res.status(500);
      res.json(responses.login.dbException);
      console.log(error);
  }
  finally {
    client.release();
  }
});

app.post(apiroot+ 'users/authorize', async (req: Request, res: Response) => {
  const {adminSecret,authorizedId} = req.body ;
  
  if(adminSecret == process.env.ADMINSECRET) {
    const client = await sql.connect();

    try {
      const result = await client.query('SELECT 1 FROM "Users" WHERE "id"=$1',[authorizedId]);
      
      if(result.rowCount == 1) {
        const result = await client.query('UPDATE "Users" SET "role"=\'manager\' WHERE "id"=$1 AND "role"=\'unapprovedManager\'',[authorizedId]);
        
        if(result.rowCount == 1) {
          res.status(200);
          res.json({
            result: "success",
            msg: "user was approved as a manager"
          });
        }
        else {
          res.status(500);
          res.json({
            result: "failure",
            msg: "cannot approve a non-pending user as a manager (user is either a fan or already a manager)"
          });
        }
      }
      else {
        res.status(500);
        res.json({    
          result: "failure",
          msg: "no such user with id "+authorizedId
        });
      }
    }
    catch (error) {
      res.status(500);
      res.json({
          result: "failure",
          msg:"cannot approve a user"
      });
      console.log(error);
    }
    finally {
      client.release();
    }
  }
  else {
    res.status(500);
    res.json({
      result: "failure",
      msg: "invalid admin secret, cannot authorize approval"
    });
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
        res.json({
          result: "success",
          msg: "user was removed"
        });
      }
      else {
        res.status(500);
        res.json({    
          result: "failure",
          msg: "no such user with id "+removedID
        });
      }
    }
    catch (error) {
      res.status(500);
      res.json({
        result: "failure",
        msg:"cannot remove user"
      });
      console.log(error);
    }
    finally {
    client.release();
    }
  }
  else {
    res.status(500);
    res.json({
      result: "failure",
      msg: "invalid admin secret, cannot remove user"
    });
  }
});


//AUTHED 
app.post(apiroot+ 'users/edit', async (req: Request, res: Response) => {
  const client = await sql.connect();
  try {
    const {username,password,firstname,lastname,
           birthdate,gender,nationality,email,role} = req.body;
    
    await client.query(`INSERT INTO "Users"("username","password","firstname","lastname","birthdate","gender","nationality","email","role")
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[username,password,firstname,lastname,birthdate,gender,nationality,email,role]);
  
    res.status(200);
    res.json({
      result: "success",
      msg: "successfully edited user "+ (req.body.authedUsername as string)
    });
  } 
  catch (error) {
    res.status(500);
    res.json({
      result: "failure",
      msg: "cannot edit user "+ (req.body.authedUsername as string)
    });
    console.log(error);
  }
  finally {
    client.release();
  }
});

app.listen(serverPort, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${serverPort}`);
});