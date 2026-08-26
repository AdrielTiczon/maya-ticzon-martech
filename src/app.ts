import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";

import openApiSpec from "../docs/openapi.json" with { type: "json" };

import usersController from "./controllers/users.controller.ts";
import {
  apiKeyAuthMiddleware,
  errorHandlerMiddleware,
  emptyRoutesMiddleware,
} from "./middlewares/index.ts";

const app: Express = express();

// -- Middleware --
app.use(express.json()); // Used for POST requests that utilizes body

app.get("/health", (req: Request, res: Response) => {
  console.info("[INFO] ENDPOINT: `/health`", { health: "OK" });
  res.status(200).send("OK");
});

app.use("/users", apiKeyAuthMiddleware, usersController);
// TODO: auth
// TODO: remittance controller
// app.use("/remittance", jwtAuthMiddleware, remittanceController)

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// -- Error Middlewares --
app.use(emptyRoutesMiddleware); // Handles routes that do not exist
app.use(errorHandlerMiddleware); // Handles error catching

export default app;
