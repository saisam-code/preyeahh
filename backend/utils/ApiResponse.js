export class ApiResponse {
  // FIX: careerRole.controller.js's getRoles() calls
  // `new ApiResponse(200, roles, "Roles fetched", { page, limit, total, totalPages })`
  // — the old constructor only took 3 params, so pagination info was silently dropped.
  constructor(statusCode, data, message = "Success", meta = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (meta) this.meta = meta;
  }
}
