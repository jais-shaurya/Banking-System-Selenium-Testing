import type { Request, Response } from 'express';
import { db } from '../prisma/db.js';
import { updateProfileSchema } from '../validation/user.schema.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const user = await db.orm.public.User
            .where({ id: userId })
            .select('id', 'name', 'email', 'phNumber')
            .first();
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json({ message: 'Profile fetched successfully', user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request data', details: parsed.error.issues });
            return;
        }

        const updateData: { name?: string; email?: string; phNumber?: string } = {};
        if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
        if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
        if (parsed.data.phNumber !== undefined) updateData.phNumber = parsed.data.phNumber;
        const updated = await db.orm.public.User.where({ id: userId }).update(updateData);
        if (!updated) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { password: _password, ...user } = updated;
        res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
        const dbError = error as { kind?: string; sqlState?: string };
        if (dbError.kind === 'sql_query' && dbError.sqlState === '23505') {
            res.status(409).json({ error: 'Email or phone number is already registered' });
            return;
        }
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
