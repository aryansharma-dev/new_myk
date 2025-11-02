// Normalizes boolean-like inputs from forms/query params into actual booleans.
export const toBool = (value) => value === true || value === "true" || value === 1 || value === "1";