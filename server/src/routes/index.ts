import { Router } from "express";
import * as auth from "../controllers/authController";
import * as fu from "../controllers/followUpController";
import * as patients from "../controllers/patientController";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

// Public
router.post("/auth/login", auth.loginHandler);
router.get("/patient-portal/:token", patients.patientPortal);

// Everything below requires a valid JWT
router.use(authenticate);
router.get("/auth/me", auth.meHandler);

router.get("/dashboard", fu.dashboard);

router.post("/patients", patients.createPatient);
router.get("/patients", patients.listPatients);
router.get("/patients/:id", patients.getPatient);
router.post("/patients/:id/contact-attempts", patients.addContactAttempt);

router.post("/follow-up-plans", fu.createPlan);
router.get("/follow-up-plans/:id", fu.getPlan);
router.post("/follow-up-plans/:id/generate", fu.generatePlan);
router.put("/follow-up-plans/:id/draft", fu.saveDraft);
router.post("/follow-up-plans/:id/approve", requireRole("coordinator"), fu.approvePlan);
router.post("/follow-up-plans/:id/notes", fu.addNote);

router.get("/follow-up-tasks", fu.listTasks);
router.patch("/follow-up-tasks/:id", fu.updateTask);

router.get("/calendar", fu.calendar);

export default router;
