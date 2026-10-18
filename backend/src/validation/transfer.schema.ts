import { z } from 'zod';

export const transferSchema = z.object({
    payerAccountId: z.union([z.number(), z.string()])
        .transform(Number)
        .refine((value) => Number.isSafeInteger(value) && value > 0),
    payeeAccountNumber: z.string().regex(/^\d{11}$/),
    amount: z.union([z.number(), z.string()])
        .transform(String)
        .refine((value) => /^\d{1,17}(?:\.\d{1,2})?$/.test(value)),
});

export type TransferInput = z.infer<typeof transferSchema>;
