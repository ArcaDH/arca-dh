// Postgres error code for breaking a unique rule
const UNIQUE_VIOLATION = "23505";

export const isUniqueViolation = (error: unknown): boolean => {
  const failure = error as { code?: string; cause?: { code?: string } } | null;
  return (failure?.code ?? failure?.cause?.code) === UNIQUE_VIOLATION;
};
