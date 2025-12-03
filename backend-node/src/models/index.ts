/**
 * Models Index
 * Central export file for all Mongoose models
 */

export { default as User, IUser } from './User';
export { default as Job, IJob, IEligibilityCriteria } from './Job';
export { default as Application, IApplication, ApplicationStatus } from './Application';
export { default as StudentData, IStudentData } from './StudentData';
export { default as College, ICollege } from './College';
export { default as Company, ICompany } from './Company';
export { default as Event, IEvent } from './Event';
export { default as Announcement, IAnnouncement } from './Announcement';
export { default as Invitation, IInvitation } from './Invitation';
export { default as PlacementDrive, IPlacementDrive } from './PlacementDrive';
export { default as AuditLog, IAuditLog } from './AuditLog';
