/**
 * SOURCE: preyeah-main/server/utils/ApiResponse.js (App B)
 * Standardized response format for all endpoints.
 */

export class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
