import { z } from 'zod';

const amountSchema = z.union([z.number(), z.string()])
    .transform(String)
    .refine((value) => /^\d{1,17}(?:\.\d{1,2})?$/.test(value));

export const depositSchema = z.object({
    amount: amountSchema,
}).strict();

export const withdrawSchema = z.object({
    amount: amountSchema,
    password: z.string().min(1).max(72),
}).strict();
