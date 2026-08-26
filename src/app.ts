import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";

import openApiSpec from "#docs/openapi.json" with { type: "json" };

import {
  jwtAuthMiddleware,
  errorHandlerMiddleware,
  emptyRoutesMiddleware,
} from "#middlewares/index";
import { authController, transactionsController } from "#controllers/index";

const app: Express = express();

// -- Middleware --
app.use(express.json()); // Used for POST requests that utilizes body
app.use(cookieParser());

app.get("/health", (req: Request, res: Response) => {
  console.info("[INFO] ENDPOINT: `/health`", { health: "OK" });
  res.status(200).send("OK");
});

app.use("/auth", authController);
app.use("/transactions", jwtAuthMiddleware, transactionsController);

// -- SwaggerUI (OpenAPI document) --
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// -- Error Middlewares --
app.use(emptyRoutesMiddleware); // Handles routes that do not exist
app.use(errorHandlerMiddleware); // Handles error catching

export default app;
