import { Router, type Request, type Response } from "express";
import AuthService from "../services/auth.service.ts";
import { ACCESS_TOKEN_TTL_SECONDS } from "../services/token.service.ts";
import { loginSchema } from "../schemas/auth.schema.ts";
import { presentUser } from "../presenters/user.presenter.ts";

const authController = Router();
const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
} as const;

authController.post("/login", async (req: Request, res: Response) => {
  const { mobileNumber, mpin } = loginSchema.parse(req.body);

  const { user, accessToken } = await authService.login(mobileNumber, mpin);

  res.cookie("access_token", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });

  res.status(200).send({ data: presentUser(user) });
});

authController.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("access_token", COOKIE_OPTIONS);
  res.status(204).send();
});

export default authController;
