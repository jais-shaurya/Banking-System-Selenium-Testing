import { z } from 'zod';

export const updateProfileSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()).optional(),
    phNumber: z.string().regex(/^[0-9]{10}$/).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field is required',
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
