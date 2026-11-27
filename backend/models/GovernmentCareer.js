import mongoose from "mongoose";
import { verificationMetadataSchema } from "./CareerIntelligence.js";
import { normalizeEducationStages } from "../constants/educationStages.js";

/**
 * Government Job Syllabus Paper Schema
 */
const syllabusSubjectSchema = new mongoose.Schema(
  {
    subjectName: { type: String, required: true },
    weightageMarks: { type: Number, default: 0 },
    topics: [
      {
        topicName: { type: String, required: true },
        subtopics: { type: [String], default: [] },
      },
    ],
  },
  { _id: false }
);

const syllabusPaperSchema = new mongoose.Schema(
  {
    paperName: { type: String, required: true },
    durationMinutes: { type: Number, default: 120 },
    totalMarks: { type: Number, default: 100 },
    questionType: {
      type: String,
      enum: ["Objective (MCQ)", "Descriptive / Written", "Skill / Practical Test", "Interview / Viva"],
      default: "Objective (MCQ)",
    },
    negativeMarking: { type: String, default: "0.25 marks per wrong answer" },
    languages: { type: [String], default: ["English", "Hindi"] },
    subjects: [syllabusSubjectSchema],
  },
  { _id: false }
);

/**
 * Government Career & Job Role Schema
 */
const governmentJobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", default: null, index: true },
    subdomainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerSubdomain", default: null, index: true },
    examIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Opportunity" }],
    category: {
      type: String,
      required: true,
      enum: [
        "Civil Services & Administration",
        "Banking & Finance",
        "Railways",
        "Defence & Paramilitary",
        "Staff Selection Commission",
        "Education & Research",
        "Engineering & Technical",
        "Medical & Healthcare",
        "State Government Jobs",
        "Public Sector Undertakings",
        "Other Government Careers",
      ],
      index: true,
    },
    subCategory: { type: String, default: "" },
    level: {
      type: String,
      enum: ["Central Government", "State Government", "Public Sector Undertaking (PSU)", "Judiciary", "Autonomous Body"],
      default: "Central Government",
      index: true,
    },
    stateName: { type: String, default: "", index: true },
    department: { type: String, required: true },
    ministry: { type: String, default: "" },
    group: {
      type: String,
      enum: ["Group A", "Group B", "Group C", "Group D", "Officer Cadre", "Executive"],
      default: "Group B",
    },
    gazettedStatus: {
      type: String,
      enum: ["Gazetted", "Non-Gazetted"],
      default: "Non-Gazetted",
    },
    tenureType: {
      type: String,
      enum: ["Permanent", "Contractual", "Deputation", "Short Service Commission"],
      default: "Permanent",
    },
    overview: { type: String, required: true },
    responsibilities: { type: [String], default: [] },
    workEnvironment: { type: String, default: "" },
    postingLocations: { type: String, default: "" },
    transferPolicy: { type: String, default: "" },

    // Eligibility Criteria
    eligibility: {
      minimumEducation: {
        type: String,
        enum: [
          "Class 10",
          "Class 12",
          "Diploma",
          "Bachelor's Degree",
          "Master's Degree",
          "PhD",
          "MBBS",
          "B.Tech / B.E.",
          "LLB",
          "B.Ed / D.El.Ed",
          "Any Graduate",
        ],
        required: true,
        index: true,
      },
      requiredSpecialization: { type: String, default: "Any discipline from a recognized University" },
      minAge: { type: Number, default: null },
      maxAge: { type: Number, default: null },
      ageRelaxations: [
        {
          category: { type: String }, // e.g. "OBC: 3 years", "SC/ST: 5 years", "PwD: 10 years"
          relaxationYears: { type: Number },
        },
      ],
      finalYearEligible: { type: Boolean, default: true },
      nationality: { type: String, default: "Citizen of India (or subject of Nepal/Bhutan as per rules)" },
      physicalStandards: {
        required: { type: Boolean, default: false },
        minHeightMaleCm: { type: Number, default: null },
        minHeightFemaleCm: { type: Number, default: null },
        chestMaleCm: { type: String, default: "" },
        visualAcuity: { type: String, default: "" },
        physicalEfficiencyTest: { type: String, default: "" },
        notes: { type: String, default: "" },
      },
      medicalStandards: { type: String, default: "Must meet standard Central/State government physical fitness criteria." },
      experienceRequired: { type: String, default: "" },
    },

    // Examination & Selection Procedure
    examination: {
      examName: { type: String, required: true },
      conductingBody: {
        type: String,
        enum: [
          "UPSC",
          "SSC",
          "IBPS",
          "SBI",
          "RBI",
          "RRB",
          "NTA",
          "State PSC",
          "Indian Army / Navy / Air Force",
          "Public Sector Board",
          "Other Official Body",
        ],
        required: true,
      },
      selectionStages: { type: [String], default: ["Preliminary Examination", "Main Examination", "Personal Interview / Document Verification"] },
      examFrequency: { type: String, default: "" },
      attemptsAllowed: {
        general: { type: mongoose.Schema.Types.Mixed, default: null },
        obc: { type: mongoose.Schema.Types.Mixed, default: null },
        scSt: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    },

    // Detailed Multi-Level Syllabus
    syllabus: {
      overview: { type: String, default: "" },
      officialSyllabusUrl: { type: String, default: "" },
      papers: [syllabusPaperSchema],
    },

    // Salary Structure & 7th CPC Matrix
    salary: {
      payLevel: { type: String, default: "" },
      payScale: { type: String, default: "" },
      basicPay: { type: Number, default: null },
      gradePay: { type: Number, default: null },
      approxGrossMonthly: {
        classXCity: { type: Number, default: 75000 }, // Tier 1 metro
        classYCity: { type: Number, default: 68000 }, // Tier 2
        classZCity: { type: Number, default: 63000 }, // Tier 3 / Rural
      },
      approxInHandMonthly: {
        min: { type: Number, default: 58000 },
        max: { type: Number, default: 68000 },
      },
      allowances: { type: [String], default: ["Dearness Allowance (DA at prevailing rate)", "House Rent Allowance (HRA: 9% - 27%)", "Transport Allowance (TA)", "Medical Allowance (CGHS)"] },
      benefits: { type: [String], default: ["National Pension System (NPS) with 14% Govt contribution", "Gratuity and Leave Encashment", "Leave Travel Concession (LTC)", "Government Quarters / Accommodation eligibility", "Job Security and Tenure Protection"] },
      deductionsBreakdown: { type: String, default: "10% of (Basic + DA) for NPS + Income Tax (TDS) + CGEGIS + CGHS contribution." },
      cityVariationNote: { type: String, default: "In-hand salary varies based on city classification (X: 27% HRA, Y: 18% HRA, Z: 9% HRA)." },
    },

    // Career Growth & Promotion Ladder
    careerProgression: [
      {
        levelOrder: { type: Number, required: true },
        designation: { type: String, required: true },
        typicalTimeYears: { type: String, default: "3-5 years" },
        payLevel: { type: String, default: "" },
      },
    ],

    // Education Stages relevance for discovery
    educationStages: {
      type: [String],
      default: ["Undergraduate", "Postgraduate"], // "Class 6-8", "Class 9-10", "Class 11-12", "Diploma", "Undergraduate", "Postgraduate", "PhD"
      set: normalizeEducationStages,
      index: true,
    },

    // Verification & Official Transparency
    verification: {
      sourceName: { type: String, required: true, default: "Official Gazette Notification" },
      sourceUrl: { type: String, required: true },
      status: {
        type: String,
        enum: ["VERIFIED OFFICIAL", "AWAITING VERIFICATION", "OUTDATED", "ARCHIVED"],
        default: "VERIFIED OFFICIAL",
      },
      lastVerifiedDate: { type: Date, default: Date.now },
      recruitmentYear: { type: String, default: "2026" },
      verifiedByAdmin: { type: String, default: "Preyeahh Career Intelligence Cell" },
    },

    isActive: { type: Boolean, default: true },
    popularityScore: { type: Number, default: 85 },
  },
  { timestamps: true }
);

governmentJobSchema.index({ category: 1, "eligibility.minimumEducation": 1 });
governmentJobSchema.index({ "examination.examName": 1 });

/**
 * Official Government Recruitment Notification Schema
 */
const governmentNotificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    jobRole: { type: mongoose.Schema.Types.ObjectId, ref: "GovernmentJob", default: null },
    category: { type: String, required: true, index: true },
    conductingBody: { type: String, required: true },
    notificationNumber: { type: String, default: "" },
    recruitmentYear: { type: String, default: "2026" },
    totalVacancies: { type: Number, default: null },
    officialNotificationPdfUrl: { type: String, default: "" },
    applyOnlineUrl: { type: String, default: "" },
    officialWebsiteUrl: { type: String, required: true },

    importantDates: {
      notificationDate: { type: Date, default: null },
      applicationStartDate: { type: Date, default: null },
      applicationEndDate: { type: Date, default: null },
      admitCardReleaseDate: { type: Date, default: null },
      examDate: { type: Date, default: null },
      resultDate: { type: Date, default: null },
    },

    status: {
      type: String,
      enum: [
        "UPCOMING",
        "APPLICATIONS_OPEN",
        "APPLICATIONS_CLOSED",
        "EXAM_SCHEDULED",
        "RESULTS_DECLARED",
        "ARCHIVED",
      ],
      default: "APPLICATIONS_OPEN",
      index: true,
    },

    eligibilitySummary: { type: String, required: true },
    ageLimitSummary: { type: String, required: true },
    applicationFee: { type: String, default: "₹100 (Exempt for SC/ST/PwD/Women candidates)" },

    verification: {
      sourceName: { type: String, default: "Official Employment News / Portal" },
      sourceUrl: { type: String, required: true },
      status: {
        type: String,
        enum: ["VERIFIED OFFICIAL", "AWAITING VERIFICATION", "OUTDATED", "ARCHIVED"],
        default: "VERIFIED OFFICIAL",
      },
      lastVerifiedDate: { type: Date, default: Date.now },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GovernmentJob = mongoose.model("GovernmentJob", governmentJobSchema);
export const GovernmentNotification = mongoose.model("GovernmentNotification", governmentNotificationSchema);
