// apps/api/src/routes/medicationReminders/index.ts
import express from "express";
import { authenticateUser } from "./middleware";
import { prescribeMedication } from "./controllers/prescriptionController";
import {
  getWeeklyAdherence,
  markMedicationTaken,
  markMedicationMissed,
  stopMedication
} from "./controllers/patientController";
import {
  reportSideEffect,
  updateSideEffectByDoctor,
  getSideEffects
} from "./controllers/sideEffectsController";
import {
  getDoctorPatientMedications,
  getStoppedMedicationsSummary,
  getSideEffectsDoctorSummary
} from "./controllers/doctorController";
import {
  restartMedication,
  getTodayMedications,
  getAdherenceSummary,
  getDueMedications,
  getMedicationById,
  getMedicationHistory,
  getSideEffectsSummary,
  removeSideEffect,
  deleteMedication
} from "./controllers/commonController";
import { getExpiringMedications } from './controllers/doctorController';
const router = express.Router();


router.post("/prescribe", authenticateUser, prescribeMedication);


router.get("/weekly-adherence", authenticateUser, getWeeklyAdherence);
router.post("/:medicationId/mark-taken", authenticateUser, markMedicationTaken);
router.post("/:medicationId/mark-missed", authenticateUser, markMedicationMissed);
router.post("/:medicationId/stop-taking", authenticateUser, stopMedication);
router.get(
  '/doctor/expiring',
  authenticateUser,
  getExpiringMedications
);

router.post("/:medicationId/report-side-effect", authenticateUser, reportSideEffect);
router.put("/:medicationId/side-effects/:effectId/doctor-update", authenticateUser, updateSideEffectByDoctor);
router.get("/:medicationId/side-effects", authenticateUser, getSideEffects);


router.get("/doctor-view/:patientId", authenticateUser, getDoctorPatientMedications);
router.get("/stopped-summary", authenticateUser, getStoppedMedicationsSummary);
router.get("/side-effects/doctor-summary", authenticateUser, getSideEffectsDoctorSummary);

router.post("/:medicationId/restart-taking", authenticateUser, restartMedication);
router.get("/today", authenticateUser, getTodayMedications);
router.get("/adherence-summary", authenticateUser, getAdherenceSummary);
router.get("/due", authenticateUser, getDueMedications);
router.get("/:medicationId", authenticateUser, getMedicationById);
router.get("/history/taken", authenticateUser, getMedicationHistory);
router.get("/side-effects/summary", authenticateUser, getSideEffectsSummary);
router.delete("/:medicationId/remove-side-effect", authenticateUser, removeSideEffect);
router.delete("/:medicationId", authenticateUser, deleteMedication);

export default router;