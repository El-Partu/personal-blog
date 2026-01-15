export enum UserRole {
  USER = "user",
  AUTHOR = "author",
  EDITOR = "editor",
  ADMIN = "admin",
}

export interface IUser extends Document {
  username: string;
  email: string;
  role: UserRole;
  photo?: String;
  active: boolean;
  password: string;
  confirmPassword?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: String;
  passwordResetTokenExpires?: Date;
  createdAt: Date;
  updatedAt?: Date;
}
