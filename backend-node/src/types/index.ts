import { Document } from 'mongoose';
import { Request } from 'express';

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

/**
 * Extended Express Request with authenticated user
 */
export interface IAuthRequest extends Request {
  user?: {
    _id: string;
    username?: string;
    name?: string;
    email: string;
    role: string;
    collegeId?: any;
    college?: any;
    department?: string;
    status?: string;
  };
  collegeId?: any;
  college?: any;
  isSuperAdmin?: boolean;
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
  count?: number;
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
