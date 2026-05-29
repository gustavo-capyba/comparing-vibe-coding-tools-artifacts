import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import sightingsRouter from "./sightings";
import subscriptionsRouter from "./subscriptions";
import notificationsRouter from "./notifications";
import emergenciesRouter from "./emergencies";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(sightingsRouter);
router.use(subscriptionsRouter);
router.use(notificationsRouter);
router.use(emergenciesRouter);
router.use(statsRouter);

export default router;
