export enum UserRole {
  USER = "user",
  AUTHOR = "author",
  EDITOR = "editor",
  ADMIN = "admin",
}

export interface IUser extends Document {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  role: UserRole;
  photo?: String;
  active: boolean;
  password: string;
  confirmPassword?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: String;
  passwordResetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
