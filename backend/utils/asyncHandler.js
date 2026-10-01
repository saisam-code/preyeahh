/**
 * Wraps an async Express route/controller so rejected promises
 * are forwarded to next(err) instead of crashing the process
 * or requiring a try/catch in every controller.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
