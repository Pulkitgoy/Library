import * as z from 'zod'

export const SignUpSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Please enter a valid email address'),
  universityId: z.coerce.number({ message: 'University ID must be a number' }).int().positive('University ID must be a positive number'),
  universityCard: z.string().min(1, 'Please upload or select a university ID card'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const SignInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})