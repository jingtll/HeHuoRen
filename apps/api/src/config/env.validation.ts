import Joi from "joi";

export interface EnvironmentVariables {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
}

const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
}).unknown(true);

export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const { error, value } = environmentSchema.validate(config, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    throw error;
  }

  return value as EnvironmentVariables;
}
