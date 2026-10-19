import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { or } from '@prisma/orm-postgres/orm-client';
import { db } from '../prisma/db.js';
import { loginSchema, registerSchema } from '../validation/auth.schema.js';

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request data', details: parsed.error.issues });
            return;
        }

        const { name, email, phNumber, password } = parsed.data;
        const existingUser = await db.orm.public.User
            .where((user) => or(user.email.eq(email), user.phNumber.eq(phNumber)))
            .select('id')
            .first();

        if (existingUser) {
            res.status(409).json({ error: 'Email or phone number is already registered' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await db.orm.public.User.create({ name, email, phNumber, password: passwordHash });
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: user.id, name: user.name, email: user.email, phNumber: user.phNumber },
        });
    } catch (error) {
        const dbError = error as { kind?: string; sqlState?: string };
        if (dbError.kind === 'sql_query' && dbError.sqlState === '23505') {
            res.status(409).json({ error: 'Email or phone number is already registered' });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid request data', details: parsed.error.issues });
            return;
        }

        const user = await db.orm.public.User.where({ email: parsed.data.email }).first();
        if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
            res.status(401).json({ error: 'Invalid email or password' });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        const token = jwt.sign({ userId: user.id }, secret);
        res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, phNumber: user.phNumber },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
