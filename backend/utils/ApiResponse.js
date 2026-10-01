/**
 * Standardized success response shape sent from controllers.
 * Usage: res.status(200).json(new ApiResponse(200, data, "Roles fetched"));
 */
class ApiResponse {
  constructor(statusCode, data = null, message = "Success", meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta; // pagination info, counts, etc.
  }
}

export default ApiResponse;
