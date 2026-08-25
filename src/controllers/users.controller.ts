import { Router } from "express";
import type { Request, Response } from "express";
import UsersService from "../services/users.service.ts";

const usersController = Router();
const usersService = new UsersService();

usersController.get("/", async (_: Request, res: Response) => {
  res.status(200).send({
    data: [{ id: "john doe", mobileNumber: "09212345678" }],
  });
});

usersController.post(
  "/:id",
  (req: Request<{ id: string; test: string }>, res: Response) => {
    res.status(201).send();
  },
);

usersController.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response) => {
    const data = await usersService.getUser(req.params.id);

    res.status(200).send({
      data: data,
    });
  },
);

export default usersController;
