import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),

  // ✅ allow admin roles to be submitted during register
  // (SYSTEM_ADMIN will still be blocked in controller)
  role: z
    .enum([
      "rider",
      "driver",
      "ADMIN_TRAIN",
      "ADMIN_BUS",
      "ADMIN_PRIVATE",
      "SYSTEM_ADMIN",
    ])
    .optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
