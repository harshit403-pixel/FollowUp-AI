import { idParam } from "../schemas/common";
import { contactAttemptBody, createPatientBody, listPatientsQuery } from "../schemas/patient";
import * as patients from "../services/patientService";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const createPatient = asyncHandler(async (req, res) => {
  res.status(201).json(await patients.createPatient(createPatientBody.parse(req.body)));
});

export const listPatients = asyncHandler(async (req, res) => {
  const { q } = listPatientsQuery.parse(req.query);
  res.json({ patients: await patients.listPatients(q) });
});

export const getPatient = asyncHandler(async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await patients.getPatientDetail(id));
});

export const addContactAttempt = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const { id } = idParam.parse(req.params);
  const body = contactAttemptBody.parse(req.body);
  res.status(201).json(await patients.addContactAttempt(id, body, req.user));
});
