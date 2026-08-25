import express, { type Express, type Request, type Response } from "express";

const app: Express = express();

app.get("/health", (req: Request, res: Response) => {
	console.info("[INFO] ENDPOINT: `/health`", { health: "OK" });
	res.status(200).send("OK");
});

app.listen(3000, () => {
	console.log("Remittance server status: STARTED");
});
