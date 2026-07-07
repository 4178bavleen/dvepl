import { z } from "zod";

export const loginSchema = z
    .object({
        email: z.email({ message: "Invalid email address" }),
        password: z
            .string()
            .min(6, { message: "Password must be at least 8 characters long" })
            .max(100, { message: "Password must not exceed 100 characters" })
            .regex(
                /^[a-zA-Z0-9!@#$%^&*(),.?":{}|<>[\]\\;'`~_=+-/]+$/,
                "Password contains invalid characters"
            ), // Updated syntax
    })
    .strict();
