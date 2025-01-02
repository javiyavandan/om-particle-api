import express, { RequestHandler, Response } from "express";
import http from "http";
import { DB_HOST, DB_NAME, PORT } from "./env.var";
import routes from "../routes/index.route";
import { bodyDecipher } from "../middlewares/req-res-encoder";
import dbConnection from "./dbContext";
import { tokenVerification } from "../middlewares/authenticate";
import adminRouter from "../routes/admin/index.route";
import userRouter from "../routes/user/index.route";
const cors = require("cors");

export default ({ app }: { app: express.Application }) => {
  app.use(express.json());
  app.use(
    cors({
      origin: "*",
    })
  );
  app.use(express.static("public"));

  app.use("/api/v1", [bodyDecipher,tokenVerification], routes());
  app.use("/api/v1/admin", [bodyDecipher, tokenVerification], adminRouter());
  app.use("/api/v1/user", [bodyDecipher, tokenVerification], userRouter());

  startServer(app);
  dbConnection;
};

const startServer = (app: express.Application) => {
  let port = PORT.toString();
  app.set("port", port);

  let server = http.createServer(app);
  server.listen(port);

  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe  ${addr}` : `port-${port} db: ${DB_NAME} host: ${DB_HOST}`;
  console.log(`🛡️   Server listening on ${bind} 🛡️ `);
};

