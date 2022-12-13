//SERVER 
import express = require('express');
import {NextFunction, Request, Response} from 'express';
//CONFIG
import dotenv = require('dotenv');dotenv.config();

//VALIDATION FOR AUTH MIDDLEWARE
import ensureValidToken from './validations/user/tokens'
import { responses }    from './responses';
//ROUTES
import registerUser  from './routes/user/new';
import loginUser     from './routes/user/login';
import authorizeUser from './routes/user/authorize';
import removeUser    from './routes/user/remove';
import editUserData  from './routes/user/edit';

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

//auth middleware
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

app.post(apiroot+ 'users/new'      ,registerUser);
app.post(apiroot+ 'users/login'    ,loginUser);
app.post(apiroot+ 'users/authorize',authorizeUser);
app.post(apiroot+ 'users/remove'   ,removeUser);
//AUTHED 
app.post(apiroot+ 'users/edit',editUserData);

app.listen(serverPort, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${serverPort}`);
});