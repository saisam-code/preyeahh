export function assertSeedAllowed(environment, optInVariable) {
  if (environment.NODE_ENV === "production") {
    throw new Error("Seeding is disabled in production.");
  }
  if (environment[optInVariable] !== "true") {
    throw new Error(`Set ${optInVariable}=true to explicitly enable seeding.`);
  }
}
