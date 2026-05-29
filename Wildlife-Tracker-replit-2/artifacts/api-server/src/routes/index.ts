import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sightingsRouter from "./sightings";
import notificationsRouter from "./notifications";
import emergenciesRouter from "./emergencies";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(sightingsRouter);
router.use(notificationsRouter);
router.use(emergenciesRouter);
router.use(statsRouter);

export default router;
