import CareerDomain from "../models/CareerDomain.js";
import CareerSubdomain from "../models/CareerSubdomain.js";
import Role from "../models/Role.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const populateContext = (query) =>
  query.populate({ path: "domainId", select: "name slug" });

export const getCareerSubdomains = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.domainId) filter.domainId = req.query.domainId;
  const subdomains = await populateContext(
    CareerSubdomain.find(filter).sort({ displayOrder: 1, name: 1 })
  );
  res.status(200).json(new ApiResponse(200, subdomains, "Career subdomains fetched"));
});

export const createCareerSubdomain = asyncHandler(async (req, res) => {
  const domainExists = await CareerDomain.exists({ _id: req.body.domainId });
  if (!domainExists) throw ApiError.notFound("Career domain not found");

  const subdomain = await CareerSubdomain.create({
    name: req.body.name,
    slug: req.body.slug,
    description: req.body.description,
    domainId: req.body.domainId,
    displayOrder: req.body.displayOrder,
  });
  const populated = await populateContext(CareerSubdomain.findById(subdomain._id));
  res.status(201).json(new ApiResponse(201, populated, "Career subdomain created"));
});

export const updateCareerSubdomain = asyncHandler(async (req, res) => {
  const subdomain = await CareerSubdomain.findById(req.params.id);
  if (!subdomain) throw ApiError.notFound("Career subdomain not found");

  ["name", "slug", "description", "displayOrder"].forEach((field) => {
    if (req.body[field] !== undefined) subdomain[field] = req.body[field];
  });
  await subdomain.save();

  const populated = await populateContext(CareerSubdomain.findById(subdomain._id));
  res.status(200).json(new ApiResponse(200, populated, "Career subdomain updated"));
});

export const deleteCareerSubdomain = asyncHandler(async (req, res) => {
  const subdomain = await CareerSubdomain.findById(req.params.id);
  if (!subdomain) throw ApiError.notFound("Career subdomain not found");
  if (await Role.exists({ subdomainId: subdomain._id })) {
    throw ApiError.conflict("This subdomain is assigned to roles; move those roles before deleting it");
  }

  await subdomain.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Career subdomain deleted"));
});
