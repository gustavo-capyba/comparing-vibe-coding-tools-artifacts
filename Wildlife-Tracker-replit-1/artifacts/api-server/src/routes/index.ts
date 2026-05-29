import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import sightingsRouter from "./sightings";
import subscriptionsRouter from "./subscriptions";
import notificationsRouter from "./notifications";
import emergenciesRouter from "./emergencies";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(sightingsRouter);
router.use(subscriptionsRouter);
router.use(notificationsRouter);
router.use(emergenciesRouter);

export default router;
