import express, { type NextFunction, type Request,type Response} from 'express';
import cors from "cors"
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { PORT } from './config/config.service.js';
import { AppError, GlobalErrorHadnling } from './common/utils/globalErrorHandling.js';
import authRouter from './modules/auth/auth.controller.js';
import userRouter from './modules/user/user.controller.js';
import ConnectionDB from './DB/connectionDB.js';
import redisService from "./DB/connection.redis.js";
import { pipeline } from "node:stream/promises";
import { S3Service } from './common/service/s3.service.js';
import {  ALLOW_ORIGINS } from './config/config.service.js';
const app = express();
const port = PORT;
const limiter= rateLimit({
    windowMs:60 * 5 * 1000,
    limit:20,
    message:{
        success:false,
        message: "u reached limit of requests at this time pleas try again later "
    },
    standardHeaders:true,
    legacyHeaders: false,
    statusCode:429,
})
const bootstrap = async()=>{
    
    app.use(
  express.json(),
  cors({
    origin: ALLOW_ORIGINS.length ? ALLOW_ORIGINS : "*",
  }),
  helmet(),
  limiter
);

    await ConnectionDB()
    await redisService.connect();

    app.get("/",(req:Request,res:Response,next:NextFunction)=>{
    res.status(200).json({message:"hello to my app"})
})
    app.use("/auth",authRouter)
    app.use("/user", userRouter);

    // Generate pre-signed upload URL
  app.get("/upload/pre-signed/*path", async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as { path: string[] };
        const Key = path.join("/");
        const { download } = req.query as {download: string};
        const url = await new S3Service().getPreSignedUrl({
          Key,
          download,
        });
        res.status(200).json({ url });
    }
  );
  // Download files from S3
  app.get("/upload/*path",async (req: Request, res: Response, next: NextFunction) => {
        const { path } = req.params as { path: string[] };
        const Key = path.join("/");
        const { download } = req.query 
        const result = await new S3Service().getFile(Key);
        if (!result.Body) {
          throw new AppError("File not found", 404);
        }
        const stream = result.Body as NodeJS.ReadableStream;
        res.setHeader("Content-Type", result.ContentType || "application/octet-stream");
        res.setHeader(
          "cross-origin-resource-policy",
          "cross-origin"
        );
        if (download === "true") {
          const fileName = Key.split("/").pop() || "download";
          res.setHeader( "Content-Disposition",`attachment; filename="${fileName}"`);
        }
        await pipeline(stream, res);
      
    }
  );
    app.use("{/*demo}",(req:Request,res:Response,next:NextFunction)=>{
       throw new AppError(`url:${req.originalUrl} with method: ${req.method} not found `, 404)
    })


    app.use(GlobalErrorHadnling)
    app.listen(port,()=>console.log(`server is running on port ${port}!`))
}
export default bootstrap