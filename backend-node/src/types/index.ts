import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'moderator' | 'student';
  collegeId?: string;
  status: 'active' | 'inactive' | 'pending';
  isApproved: boolean;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthRequest {
  username: string;
  email?: string;
  password: string;
}

export interface IJWTPayload {
  _id: string;
  username: string;
  email: string;
  role: string;
  collegeId?: string;
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: Partial<IUser>;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
