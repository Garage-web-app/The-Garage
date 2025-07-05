import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

const router: Router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).send("Hello World!");
});

export { router };
