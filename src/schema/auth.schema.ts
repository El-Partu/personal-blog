import { z } from "zod";

export const signupSchema = z.object({
  body: z
    .object({
      username: z.string({ message: "Please your name is required." }).min(8, {
        message: "Please user name should be atleast 8 characters",
      }),
      email: z
        .string({ message: "Email is required" })
        .email({ message: "Please provide a valid email" }),
      password: z
        .string({ message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" }),
      confirmPassword: z
        .string({ message: "Confirm password is required" })
        .min(8, { message: "Confirm password must be at least 8 characters" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Please enter your email!" })
      .email({ message: "Please provide a valid email" }),
    password: z.string({ message: "Please enter your password!" }),
  }),
});

// Type inferred automatically
export type SignupInput = z.infer<typeof signupSchema>["body"];
export type loginInput = z.infer<typeof loginSchema>["body"]
