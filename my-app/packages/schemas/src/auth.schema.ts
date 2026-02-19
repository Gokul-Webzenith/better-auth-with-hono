import { z } from 'zod'

export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 chars'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email'),

  password: z
    .string()
    .min(6, 'Password must be at least 6 chars'),
})

export const patchTodoSchema = z.object({
  status: z.enum([
    'todo',
    'backlog',
    'inprogress',
    'done',
    'cancelled',
  ]).optional(),

  text: z.string().optional(),
  description: z.string().optional(),
})
