import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string()
        .trim()
        .min(1, 'Name is required')
        .max(100, 'Name must be at most 100 characters'),

    email: z.string()
        .trim()
        .email('Invalid email address')
        .max(254, 'Email is too long')
        .transform((email) => email.toLowerCase()),

    phNumber: z.string()
        .regex(/^[0-9]{10}$/, 'Phone number must contain exactly 10 digits'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters long')
        .max(72, 'Password must be at most 72 characters'),
}).strict();

export const loginSchema = z.object({
    email: z.string()
        .trim()
        .email('Invalid email address')
        .max(254, 'Email is too long')
        .transform((email) => email.toLowerCase()),

    password: z.string()
        .min(1, 'Password is required')
        .max(72, 'Password is too long'),
}).strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
