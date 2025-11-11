import express from "express";
import doctorCreationRouter from "./registration";
import doctorManagementRouter from "./management";
import doctorEmailRouter from "./doctorEmail";
import doctorPatientRouter from "./doctorPatient";
import doctorProfileRouter from "./profileCompletion";

const router = express.Router();

// Mount all doctor-related routes with proper paths
router.use("/register", doctorCreationRouter);        // POST /api/doctors/register
router.use("/manage", doctorManagementRouter);        // GET /api/doctors/manage
router.use("/email", doctorEmailRouter);              // POST /api/doctors/email/send-reset-email
router.use("/patients", doctorPatientRouter);         // GET /api/doctors/patients/:id/assigned-patients
router.use("/profile", doctorProfileRouter);          // GET/POST /api/doctors/profile/*

export default router;