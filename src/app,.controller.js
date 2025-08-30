import  express from 'express';
import { connectDB } from "./modules/DB/db.connection.js";
import { globalErrorHandler } from './modules/utilities/response/response.js';
import authcontroller from './modules/auth/auth.controller.js';
import usercontroller from './modules/users/user.controller.js';
import messagecontroller from './modules/message/message.controller.js';
import { asynchandler } from './modules/utilities/response/response.js';
import * as dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';

dotenv.config({  });

const app = express();  
const port = process.env.PORT 
export const bootstrap =async () => {
  await connectDB();

    app.use(express.json());
  
  
 app.use('/auth', authcontroller);
  app.use('/user', usercontroller);
    app.use('/messages', messagecontroller);

  app.use(cors());
   app.use (globalErrorHandler);
// app.use(asynchandler)
  return app.listen(port, () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);
  });
};
