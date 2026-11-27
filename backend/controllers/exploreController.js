import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const limitFor = (value) => Math.min(Math.max(Number.parseInt(value, 10) || 20, 1), 50);

const paginate = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

export const getExploreDomains = asyncHandler(async (req, res) => {
  const CareerDomain = mongoose.model("CareerDomain");
  const Role = mongoose.model("Role");
  const domains = await CareerDomain.find().sort({ displayOrder: 1, name: 1 }).lean();
  const counts = await Role.aggregate([
    { $match: { domainId: { $ne: null } } },
    { $group: { _id: "$domainId", count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((item) => [String(item._id), item.count]));
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, domains.map((domain) => ({
    ...domain,
    roleCount: countById.get(String(domain._id)) || 0,
  })), "Explore domains fetched"));
});

export const getExploreDomain = asyncHandler(async (req, res) => {
  const CareerDomain = mongoose.model("CareerDomain");
  const CareerSubdomain = mongoose.model("CareerSubdomain");
  const Role = mongoose.model("Role");
  const domain = await CareerDomain.findOne({ slug: req.params.slug }).lean();
  if (!domain) return res.status(404).json(new ApiResponse(404, null, "Domain not found"));
  const subdomains = await CareerSubdomain.find({ domainId: domain._id }).sort({ displayOrder: 1, name: 1 }).lean();
  const subdomainIds = subdomains.map((item) => item._id);
  const counts = await Role.aggregate([
    { $match: { subdomainId: { $in: subdomainIds } } },
    { $group: { _id: "$subdomainId", count: { $sum: 1 } } },
  ]);
  const countById = new Map(counts.map((item) => [String(item._id), item.count]));
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, {
    domain,
    subdomains: subdomains.map((subdomain) => ({
      ...subdomain,
      roleCount: countById.get(String(subdomain._id)) || 0,
    })),
  }, "Explore domain fetched"));
});

const buildObjectIdFilter = (query) => {
  const filter = {};
  for (const [source, target] of [["domain", "domainId"], ["subdomain", "subdomainId"], ["role", "roleId"]]) {
    if (query[source] && mongoose.isValidObjectId(query[source])) filter[target] = new mongoose.Types.ObjectId(query[source]);
  }
  return filter;
};

export const getExploreRoles = asyncHandler(async (req, res) => {
  const Role = mongoose.model("Role");
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = limitFor(req.query.limit);
  const filter = buildObjectIdFilter(req.query);
  if (req.query.q) filter.title = { $regex: req.query.q.trim().slice(0, 100), $options: "i" };
  if (req.query.stage) filter.educationStages = req.query.stage;
  if (req.query.branch) {
    const Branch = mongoose.model("Branch");
    const branch = await Branch.findOne({ name: req.query.branch.trim().toUpperCase() }).select("_id").lean();
    if (branch) filter.branchIds = branch._id;
  }
  const [rows, total] = await Promise.all([
    Role.find(filter)
      .select("title slug description educationStages verification reality subdomainId domainId branchIds")
      .populate("subdomainId", "name slug")
      .populate("domainId", "name slug")
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Role.countDocuments(filter),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, { data: rows, pagination: paginate(page, limit, total) }, "Explore roles fetched"));
});

export const getExploreResources = asyncHandler(async (req, res) => {
  const Resource = mongoose.model("Resource");
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = limitFor(req.query.limit);
  const filter = { isActive: true };
  if (mongoose.isValidObjectId(req.query.domain)) filter.domainIds = new mongoose.Types.ObjectId(req.query.domain);
  if (mongoose.isValidObjectId(req.query.subdomain)) filter.subdomainIds = new mongoose.Types.ObjectId(req.query.subdomain);
  if (mongoose.isValidObjectId(req.query.role)) filter.roleIds = new mongoose.Types.ObjectId(req.query.role);
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.q) filter.$text = { $search: req.query.q.trim().slice(0, 100) };
  const [rows, total] = await Promise.all([
    Resource.find(filter).select("title description type url provider difficulty educationStages").sort(req.query.q ? { score: { $meta: "textScore" } } : { title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Resource.countDocuments(filter),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, { data: rows, pagination: paginate(page, limit, total) }, "Explore resources fetched"));
});

export const getExploreOpportunities = asyncHandler(async (req, res) => {
  const Opportunity = mongoose.model("Opportunity");
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = limitFor(req.query.limit);
  const filter = { isActive: true };
  if (req.query.kind === "EXAM" || req.query.kind === "OPPORTUNITY") filter.kind = req.query.kind;
  if (mongoose.isValidObjectId(req.query.domain)) filter.domainIds = new mongoose.Types.ObjectId(req.query.domain);
  if (mongoose.isValidObjectId(req.query.subdomain)) filter.subdomainIds = new mongoose.Types.ObjectId(req.query.subdomain);
  if (mongoose.isValidObjectId(req.query.role)) filter.roleIds = new mongoose.Types.ObjectId(req.query.role);
  const [rows, total] = await Promise.all([
    Opportunity.find(filter).select("kind title category organizer mode applyUrl startDate deadline educationLevels eligibility cost").sort({ deadline: 1, title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Opportunity.countDocuments(filter),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, { data: rows, pagination: paginate(page, limit, total) }, "Explore opportunities fetched"));
});

export const getExploreGovernmentJobs = asyncHandler(async (req, res) => {
  const GovernmentJob = mongoose.model("GovernmentJob");
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = limitFor(req.query.limit);
  const filter = { isActive: { $ne: false } };
  const [rows, total] = await Promise.all([
    GovernmentJob.find(filter).select("title slug category subCategory level stateName department overview").sort({ title: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    GovernmentJob.countDocuments(filter),
  ]);
  res.set("Cache-Control", "public, max-age=30");
  res.status(200).json(new ApiResponse(200, { data: rows, pagination: paginate(page, limit, total) }, "Government jobs fetched"));
});
