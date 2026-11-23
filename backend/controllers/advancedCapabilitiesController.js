import { CareerOutcome, UserReport, UserBlock, VerificationSubmission } from "../models/SafetyAndOutcomes.js";
import Role from "../models/Role.js";
import Student from "../models/Student.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { callGroqChat } from "../services/groqService.js";

/**
 * CAPABILITY 6: Financial ROI & Career Cost Comparison
 * POST /api/career-intelligence/financial-roi
 */
export const calculateFinancialRoi = asyncHandler(async (req, res) => {
  const { educationCostMin, educationCostMax, startingSalary, timeToPaybackYears = 3 } = req.body;

  const totalEstCost = ((Number(educationCostMin) || 0) + (Number(educationCostMax) || 0)) / 2;
  const annualSalary = Number(startingSalary) || 500000;
  const estimatedSavingsPerYear = annualSalary * 0.35; // 35% estimated savings towards recovery

  const estPaybackMonths = estimatedSavingsPerYear > 0 ? Math.ceil((totalEstCost / estimatedSavingsPerYear) * 12) : 36;

  res.status(200).json(
    new ApiResponse(200, {
      totalEstimatedInvestment: totalEstCost,
      annualStartingIncomeEstimate: annualSalary,
      estimatedAnnualSavingsRate: estimatedSavingsPerYear,
      estimatedPaybackMonths: estPaybackMonths,
      disclaimer: "Figures are realistic approximations based on user inputs and industry averages. Preyeahh never guarantees specific placement or starting remuneration.",
    }, "Financial ROI calculated")
  );
});

/**
 * CAPABILITY 8: Career Outcome & Alumni Milestone Tracking
 */
export const recordCareerOutcome = asyncHandler(async (req, res) => {
  const { outcomeType, title, organizationOrInstitution, roleOrDegree, outcomeDate, verificationEvidenceUrl, isPublic, storySummary } = req.body;
  if (!outcomeType || !title) throw ApiError.badRequest("Outcome type and title are required");

  const outcome = await CareerOutcome.create({
    student: req.user.id,
    outcomeType,
    title,
    organizationOrInstitution: organizationOrInstitution || "",
    roleOrDegree: roleOrDegree || "",
    outcomeDate: outcomeDate ? new Date(outcomeDate) : new Date(),
    verificationEvidenceUrl: verificationEvidenceUrl || "",
    isPublic: isPublic !== false,
    storySummary: storySummary || "",
  });

  res.status(201).json(new ApiResponse(201, outcome, "Career outcome recorded successfully"));
});

export const getPublicOutcomes = asyncHandler(async (req, res) => {
  const outcomes = await CareerOutcome.find({ isPublic: true })
    .populate("student", "name branch")
    .sort({ outcomeDate: -1 })
    .limit(25)
    .lean();

  res.status(200).json(new ApiResponse(200, outcomes, "Public career outcomes and alumni milestones fetched"));
});

/**
 * CAPABILITY 7: Verified Information System Submissions
 */
export const submitInformationForVerification = asyncHandler(async (req, res) => {
  const { entityType, title, sourceName, sourceUrl, dataPayload } = req.body;
  if (!entityType || !title || !sourceUrl) {
    throw ApiError.badRequest("Entity type, title and source URL are required");
  }

  const submission = await VerificationSubmission.create({
    submittedBy: req.user.id,
    submitterRole: req.user.role,
    entityType,
    title,
    sourceName: sourceName || "Official Source",
    sourceUrl,
    dataPayload: dataPayload || {},
    status: "PENDING_REVIEW",
  });

  res.status(201).json(new ApiResponse(201, submission, "Information submitted for review"));
});

/**
 * CAPABILITY 12: Trust & Safety: User Reporting and Blocking
 */
export const submitReport = asyncHandler(async (req, res) => {
  const { reportedUserId, reason, details } = req.body;
  if (!reportedUserId || !reason) throw ApiError.badRequest("Reported user ID and reason are required");

  const report = await UserReport.create({
    reporter: req.user.id,
    reporterModel: req.user.role === "guide" ? "Guide" : "Student",
    reportedUser: reportedUserId,
    reason,
    details: details || "",
    status: "PENDING",
  });

  res.status(201).json(new ApiResponse(201, report, "Safety report filed and queued for moderation review"));
});

export const blockUser = asyncHandler(async (req, res) => {
  const { targetUserId, reason } = req.body;
  if (!targetUserId) throw ApiError.badRequest("Target user ID is required");

  const block = await UserBlock.findOneAndUpdate(
    { blocker: req.user.id, blockedUser: targetUserId },
    { blocker: req.user.id, blockedUser: targetUserId, reason: reason || "" },
    { upsert: true, new: true }
  );

  res.status(200).json(new ApiResponse(200, block, "User blocked"));
});
