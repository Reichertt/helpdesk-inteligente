import 'dotenv/config';
import { z } from 'zod';

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CORS_ORIGIN: z.string().default('*'),
    LOG_LEVEL: z.string().default('info'),
    AI_PROVIDER: z.enum(['fake', 'groq']).default('fake'),
    GROQ_API_KEY: z.string().optional(),
    GROQ_MODEL: z.string().default('llama3-8b-8192'),
    GROQ_BASE_URL: z.string().url().default('https://api.groq.com/openai/v1/chat/completions'),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  })
  .refine((e) => e.AI_PROVIDER !== 'groq' || Boolean(e.GROQ_API_KEY), {
    message: 'GROQ_API_KEY é obrigatória quando AI_PROVIDER=groq',
    path: ['GROQ_API_KEY'],
  });

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  const problemas = resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${problemas}`);
}

export const env = resultado.data;
