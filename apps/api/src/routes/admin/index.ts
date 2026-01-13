import express from "express";
import { authenticateAdmin } from "./middleware/authenticateAdmin";
import * as patientsController from "./controllers/patients.controller";
import * as relativesController from "./controllers/relatives.controller";
import * as statisticsController from "./controllers/statistics.controller";
import * as sharedController from "./controllers/shared.controller";

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(authenticateAdmin);

// Patient routes
router.get("/patients", patientsController.getPatients);
router.get("/patients/:id", patientsController.getPatientDetails);
router.delete("/patients/:id", patientsController.deletePatient);

// Relative routes
router.get("/patients-with-relative-requests", relativesController.getPatientsWithRelativeRequests);
router.post("/create-relative-account", relativesController.createRelativeAccount);
router.post("/resend-relative-invitation", relativesController.resendRelativeInvitation);
router.get("/relatives", relativesController.getAllRelatives);

// Statistics routes
router.get("/statistics", statisticsController.getStatistics);

// Shared routes
router.get("/search", sharedController.searchPatients);

export default router;