import express = require('express');
import { Express, Request, Response } from 'express';
import { Client, Pool } from 'pg';
import ensureValidToken  from './validations';
import dotenv = require('dotenv');
import jwt = require('jsonwebtoken')

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

app.post(apiroot+ 'users/new', async (req: Request, res: Response) => {
  const client = await sql.connect();
  try {
    const {username,password,firstname,lastname,
           birthdate,gender,nationality,email,role} = req.body;
    
    await client.query(`INSERT INTO "Users"("username","password","firstname","lastname","birthdate","gender","nationality","email","role")
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[username,password,firstname,lastname,birthdate,gender,nationality,email,role]);
  
    res.status(200);
    res.json({
      result: "success",
      msg: "successfully created a new user"
    });
  } 
  catch (error) {
    res.status(500);
    res.json({
      result: "failure",
      msg: "cannot create a new user"
    });
    console.log(error);
  }
  finally {
    client.release();
  }
});

app.post(apiroot+ 'users/login',async (req: Request, res: Response) => {
  const client = await sql.connect();
  try {
    const {username,password} = req.body;
    
    const result = await client.query('SELECT 1 FROM "Users" WHERE "username"=$1 AND "password"=$2',[username,password]);
    if(result.rowCount == 1) {
      res.status(200);
      res.json({
        result: "success",
        token: jwt.sign({username: username},
                        process.env.JWTSECRET!!)
        });  
    }
    else {
      res.status(500);
      res.json({
        result: "failure",
        msg: `no such user ${username} or wrong password`
      });
    }
  }
  catch(error) {
      res.status(500);
      res.json({
        result: "failure",
        msg: "cannot login"
      });
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

app.post(apiroot+ 'users/edit', async (req: Request, res: Response) => {
  const {isValid,isExpired,username} = ensureValidToken(req.get('authorization'));
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

  res.status(200);
  res.json({
    
  })


});

app.listen(serverPort, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${serverPort}`);
});