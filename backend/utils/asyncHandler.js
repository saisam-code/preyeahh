/**
 * SOURCE: preyeah-main/server/utils/asyncHandler.js (App B)
 * Wraps async route handlers to catch errors and pass to next().
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
