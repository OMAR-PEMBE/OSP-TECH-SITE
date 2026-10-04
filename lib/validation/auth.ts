import { z } from "zod";

/** Login (API.md 8). Shared by the form and the action. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  /* Deliberately only "required" here. A minimum length on *login* tells an
     attacker when a guess is the wrong shape, and legitimate old passwords
     must still work. The strength rule belongs on set/reset, below. */
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export type LoginValues = z.infer<typeof loginSchema>;

/**
 * Password strength, applied when a password is *set* (security.md 2).
 *
 * Length is the rule that matters; composition rules push people toward
 * "Password1!" and are not required by current NIST guidance.
 */
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That password is too long.");

export const changePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "The two passwords do not match.",
    path: ["confirm"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
