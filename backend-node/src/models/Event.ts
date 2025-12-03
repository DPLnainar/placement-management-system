import { Document, Schema, model } from 'mongoose';

export type EventType =
  | 'pre_placement_talk'
  | 'aptitude_test'
  | 'technical_interview'
  | 'hr_interview'
  | 'group_discussion'
  | 'coding_test'
  | 'workshop'
  | 'seminar'
  | 'deadline'
  | 'orientation'
  | 'result_announcement'
  | 'document_verification'
  | 'other';

export type LocationType = 'physical' | 'online' | 'hybrid';
export type TargetAudience = 'all_students' | 'eligible_students' | 'applied_students' | 'shortlisted_students' | 'specific_students' | 'staff_only';
export type RegistrationStatus = 'registered' | 'confirmed' | 'attended' | 'absent' | 'cancelled';
export type EventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ReminderType = 'email' | 'notification' | 'sms';

export interface ILocation {
  type: LocationType;
  venue?: string;
  room?: string;
  building?: string;
  onlineLink?: string;
  platform?: string;
}

export interface IRegistration {
  student?: Schema.Types.ObjectId;
  registeredAt: Date;
  status: RegistrationStatus;
}

export interface IReminder {
  type: ReminderType;
  minutesBefore: number;
  sent: boolean;
  sentAt?: Date;
}

export interface IAttachment {
  name?: string;
  url?: string;
  type?: string;
  uploadedAt: Date;
}

export interface IEligibilityCriteria {
  branches?: string[];
  years?: number[];
  minCGPA?: number;
  maxBacklogs?: number;
}

export interface IUpdate {
  message?: string;
  updatedBy?: Schema.Types.ObjectId;
  updatedAt: Date;
}

export interface IOrganizer {
  type: Schema.Types.ObjectId;
  ref: 'User';
}

export interface IEvent extends Document {
  college: Schema.Types.ObjectId;
  title: string;
  description: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
  location: ILocation;
  relatedJob?: Schema.Types.ObjectId;
  relatedDrive?: Schema.Types.ObjectId;
  company?: { name?: string; logo?: string };
  organizers: Schema.Types.ObjectId[];
  targetAudience: TargetAudience;
  specificStudents: Schema.Types.ObjectId[];
  eligibilityCriteria: IEligibilityCriteria;
  capacity?: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  registeredStudents: IRegistration[];
  reminders: IReminder[];
  attachments: IAttachment[];
  status: EventStatus;
  isPublished: boolean;
  color: string;
  priority: Priority;
  notes?: string;
  updates: IUpdate[];
  createdBy: Schema.Types.ObjectId;
  lastModifiedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;

  isStudentEligible(student: any): boolean;
  isStudentRegistered(studentId: Schema.Types.ObjectId): boolean;
  getRegistrationStatus(studentId: Schema.Types.ObjectId): RegistrationStatus | null;
  canRegister(): boolean;
}

const eventSchema = new Schema<IEvent>(
  {
    college: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    eventType: {
      type: String,
      enum: [
        'pre_placement_talk',
        'aptitude_test',
        'technical_interview',
        'hr_interview',
        'group_discussion',
        'coding_test',
        'workshop',
        'seminar',
        'deadline',
        'orientation',
        'result_announcement',
        'document_verification',
        'other',
      ],
      required: true,
      index: true,
    },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    isAllDay: { type: Boolean, default: false },
    location: {
      type: {
        type: String,
        enum: ['physical', 'online', 'hybrid'],
        default: 'physical',
      },
      venue: { type: String },
      room: { type: String },
      building: { type: String },
      onlineLink: { type: String },
      platform: { type: String },
    },
    relatedJob: { type: Schema.Types.ObjectId, ref: 'Job' },
    relatedDrive: { type: Schema.Types.ObjectId, ref: 'PlacementDrive' },
    company: {
      name: { type: String },
      logo: { type: String },
    },
    organizers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    targetAudience: {
      type: String,
      enum: [
        'all_students',
        'eligible_students',
        'applied_students',
        'shortlisted_students',
        'specific_students',
        'staff_only',
      ],
      default: 'all_students',
    },
    specificStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    eligibilityCriteria: {
      branches: { type: [String] },
      years: { type: [Number] },
      minCGPA: { type: Number },
      maxBacklogs: { type: Number },
    },
    capacity: { type: Number, min: 0 },
    registrationRequired: { type: Boolean, default: false },
    registrationDeadline: { type: Date },
    registeredStudents: [
      {
        student: { type: Schema.Types.ObjectId, ref: 'User' },
        registeredAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['registered', 'confirmed', 'attended', 'absent', 'cancelled'],
          default: 'registered',
        },
      },
    ],
    reminders: [
      {
        type: { type: String, enum: ['email', 'notification', 'sms'], default: 'notification' },
        minutesBefore: { type: Number, default: 60 },
        sent: { type: Boolean, default: false },
        sentAt: { type: Date },
      },
    ],
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed'],
      default: 'scheduled',
      index: true,
    },
    isPublished: { type: Boolean, default: false },
    color: { type: String, default: '#3B82F6' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    notes: { type: String },
    updates: [
      {
        message: { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastModifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ college: 1, startDate: 1 });
eventSchema.index({ college: 1, eventType: 1, status: 1 });
eventSchema.index({ college: 1, isPublished: 1, startDate: 1 });
eventSchema.index({ relatedJob: 1 });
eventSchema.index({ relatedDrive: 1 });

eventSchema.virtual('duration').get(function (this: IEvent) {
  if (this.startDate && this.endDate) {
    return Math.round(
      (this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60)
    );
  }
  return 0;
});

eventSchema.virtual('isPast').get(function (this: IEvent) {
  return this.endDate < new Date();
});

eventSchema.virtual('isUpcoming').get(function (this: IEvent) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return this.startDate > now && this.startDate <= sevenDaysFromNow;
});

eventSchema.virtual('attendanceRate').get(function (this: IEvent) {
  if (this.registeredStudents.length === 0) return 0;
  const attended = this.registeredStudents.filter(
    (r) => r.status === 'attended'
  ).length;
  return Math.round((attended / this.registeredStudents.length) * 100);
});

eventSchema.methods.isStudentEligible = function (student: any): boolean {
  if (this.targetAudience === 'all_students') return true;
  if (this.targetAudience === 'staff_only') return false;

  if (this.targetAudience === 'specific_students') {
    return this.specificStudents.some(
      (s: any) => s.toString() === student._id.toString()
    );
  }

  if (this.eligibilityCriteria) {
    const criteria = this.eligibilityCriteria;

    if (criteria.branches && criteria.branches.length > 0) {
      if (!criteria.branches.includes(student.branch)) return false;
    }

    if (criteria.years && criteria.years.length > 0) {
      if (!criteria.years.includes(student.year)) return false;
    }

    if (criteria.minCGPA && student.cgpa < criteria.minCGPA) return false;
    if (
      criteria.maxBacklogs !== undefined &&
      student.currentBacklogs > criteria.maxBacklogs
    )
      return false;
  }

  return true;
};

eventSchema.methods.isStudentRegistered = function (studentId: Schema.Types.ObjectId): boolean {
  return this.registeredStudents.some(
    (r: any) => r.student.toString() === studentId.toString()
  );
};

eventSchema.methods.getRegistrationStatus = function (
  studentId: Schema.Types.ObjectId
): RegistrationStatus | null {
  const registration = this.registeredStudents.find(
    (r: any) => r.student.toString() === studentId.toString()
  );
  return registration ? registration.status : null;
};

eventSchema.methods.canRegister = function (): boolean {
  if (!this.registrationRequired) return false;
  if (this.status !== 'scheduled') return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline)
    return false;
  if (this.capacity && this.registeredStudents.length >= this.capacity)
    return false;
  return true;
};

eventSchema.pre('save', function (next) {
  if (this.endDate <= this.startDate) {
    return next(
      new Error('End date must be after start date')
    );
  }

  if (
    this.registrationDeadline &&
    this.registrationDeadline >= this.startDate
  ) {
    return next(
      new Error('Registration deadline must be before event start date')
    );
  }

  if (this.capacity && this.registeredStudents.length > this.capacity) {
    return next(new Error('Registered students exceed capacity'));
  }

  next();
});

eventSchema.pre('save', function (next) {
  const now = new Date();

  if (this.status === 'scheduled') {
    if (now >= this.startDate && now <= this.endDate) {
      this.status = 'ongoing';
    } else if (now > this.endDate) {
      this.status = 'completed';
    }
  }

  next();
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

export default model<IEvent>('Event', eventSchema);
