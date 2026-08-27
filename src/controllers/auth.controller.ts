import { Router, type Request, type Response } from "express";
import { ACCESS_TOKEN_TTL_SECONDS, AuthService } from "#services";
import { validate } from "#middlewares";
import { loginSchema, type LoginInput } from "#schemas";
import { presentUser } from "#presenters";

const authController = Router();
const authService = new AuthService();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
} as const;

authController.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response) => {
    const { mobileNumber, mpin } = req.validated!.body as LoginInput;

    const { user, accessToken } = await authService.login(mobileNumber, mpin);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });

    res.status(200).send({ data: presentUser(user) });
  },
);

authController.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("access_token", COOKIE_OPTIONS);
  res.status(204).send();
});

export default authController;
