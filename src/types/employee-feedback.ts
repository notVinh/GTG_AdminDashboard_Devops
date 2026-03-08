export const FeedbackPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type FeedbackPriority = typeof FeedbackPriority[keyof typeof FeedbackPriority];

export const FeedbackStatus = {
  PENDING: 'pending',
  REPLIED: 'replied',
} as const;

export type FeedbackStatus = typeof FeedbackStatus[keyof typeof FeedbackStatus];

export const FeedbackVisibility = {
  PUBLIC: 'public',
  ADMIN_ONLY: 'admin_only',
} as const;

export type FeedbackVisibility = typeof FeedbackVisibility[keyof typeof FeedbackVisibility];

export interface EmployeeFeedback {
  id: number;
  factoryId: number;
  employeeId: number;
  title: string;
  content: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  attachments: string[];
  repliedByEmployeeId: number | null;
  replyContent: string | null;
  repliedAt: string | null;
  isAnonymous: boolean;
  visibility: FeedbackVisibility;
  viewedByAdmin: boolean;
  viewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  employee?: {
    id: number;
    user: {
      id: number;
      fullName: string;
      email: string | null;
      phone: string | null;
    };
    department?: {
      id: number;
      name: string;
    };
  };
  repliedByEmployee?: {
    id: number;
    user: {
      id: number;
      fullName: string;
    };
  };
}

export interface CreateEmployeeFeedbackDto {
  factoryId: number;
  employeeId: number;
  title: string;
  content: string;
  priority?: FeedbackPriority;
  attachments?: string[];
  isAnonymous?: boolean;
  visibility?: FeedbackVisibility;
}

export interface UpdateEmployeeFeedbackDto {
  title?: string;
  content?: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  attachments?: string[];
  replyContent?: string;
  repliedByEmployeeId?: number;
}

export interface QueryEmployeeFeedbackDto {
  page?: number;
  limit?: number;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  employeeId?: number;
  factoryId?: number;
  unviewedOnly?: boolean;
}
