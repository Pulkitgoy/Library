import * as z from 'zod'

export const SignUpSchema = z.object({
    fullName: z.string().min(3),
    email: z.string().email(),
    universityId: z.coerce.number(),
    universityCard: z.string().nonempty("University Card is required"),
    password: z.string().min(8)
})

export const SignInSchema = z.object({
    email: z.email(),
    password: z.string().min(8)
})