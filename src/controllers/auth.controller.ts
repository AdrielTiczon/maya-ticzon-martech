import { Router, type Request, type Response } from "express";
import AuthService from "../services/auth.service.ts";

import { ACCESS_TOKEN_TTL_SECONDS } from "../services/token.service.ts";

const authController = Router();
const authService = new AuthService();

authController.post("/login", async (req: Request, res: Response) => {
  const { accessToken } = await authService.login(
    req.body.mobileNumber,
    req.body.mpin,
  );

  res.cookie("access_token", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
  res.status(201).send();
});

export default authController;
