import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const frontendOriginsSchema = z
  .string()
  .default('https://auplatane.com,http://127.0.0.1:4322,http://localhost:4322')
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

const configSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(8787),
  FRONTEND_ORIGINS: frontendOriginsSchema,
  ADMIN_USERNAME: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  ADMIN_SESSION_SECRET: z.string().min(32).optional()
});

const parsedConfig = configSchema.parse(process.env);

export const config = {
  ...parsedConfig,
  ADMIN_SESSION_SECRET: parsedConfig.ADMIN_SESSION_SECRET ?? parsedConfig.ADMIN_PASSWORD
};
