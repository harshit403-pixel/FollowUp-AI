import { idParam } from "../schemas/common";
import {
  approveBody,
  calendarQuery,
  createPlanBody,
  draftSchema,
  listTasksQuery,
  noteBody,
  updateTaskBody,
} from "../schemas/followUp";
import { getCalendar } from "../services/follow-ups/calendarService";
import { getDashboard } from "../services/follow-ups/dashboardService";
import * as plans from "../services/follow-ups/planService";
import * as tasks from "../services/follow-ups/taskService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const createPlan = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const body = createPlanBody.parse(req.body);
  res.status(201).json(await plans.createPlan(body.patientId, body.instructions, req.user));
});

export const getPlan = asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await plans.getPlanDetail(id));
});

// Gemini integration arrives in Phase 5. Until then staff can author a draft via PUT /draft.
export const generatePlan = asyncHandler(async (req, _res) => {
  idParam.parse(req.params);
  throw new ApiError(501, "AI plan generation is not enabled yet");
});

export const saveDraft = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = idParam.parse(req.params);
  res.json(await plans.saveDraft(id, draftSchema.parse(req.body), req.user));
});

export const approvePlan = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = idParam.parse(req.params);
  const { acknowledgeFlags } = approveBody.parse(req.body ?? {});
  res.json(await plans.approvePlan(id, req.user, acknowledgeFlags));
});

export const addNote = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = idParam.parse(req.params);
  res.status(201).json(await plans.addNote(id, noteBody.parse(req.body), req.user));
});

export const listTasks = asyncHandler(async (req, res) => {
  res.json({ tasks: await tasks.listTasks(listTasksQuery.parse(req.query)) });
});

export const updateTask = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = idParam.parse(req.params);
  res.json(await tasks.updateTask(id, updateTaskBody.parse(req.body), req.user));
});

export const calendar = asyncHandler(async (req, res) => {
  res.json(await getCalendar(calendarQuery.parse(req.query).month));
});

export const dashboard = asyncHandler(async (_req, res) => {
  res.json(await getDashboard());
});
