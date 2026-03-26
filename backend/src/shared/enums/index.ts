// User Roles
export enum UserRole {
  MASTER_ADMIN = 'master_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MANAGER = 'manager',
  FINANCE = 'finance',
}

// Lead Status Pipeline (Sales)
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  WON = 'won',
  LOST = 'lost',
  ARCHIVED = 'archived',
}

// Contact Status (Communication/Call Center)
export enum ContactStatus {
  NEW_REQUEST = 'new_request',
  MISSED_CALL = 'missed_call',
  CALLBACK_SCHEDULED = 'callback_scheduled',
  CALLED_ONCE = 'called_once',
  NO_ANSWER = 'no_answer',
  CONTACTED = 'contacted',
  AWAITING_REPLY = 'awaiting_reply',
  FOLLOW_UP_REQUIRED = 'follow_up_required',
  CONVERTED = 'converted',
  LOST_UNREACHABLE = 'lost_unreachable',
}

// Call Result
export enum CallResult {
  ANSWERED = 'answered',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  VOICEMAIL = 'voicemail',
  WRONG_NUMBER = 'wrong_number',
  CALLBACK_REQUESTED = 'callback_requested',
  NOT_INTERESTED = 'not_interested',
  DEAL_DISCUSSED = 'deal_discussed',
}

// Communication Channel
export enum CommunicationChannel {
  PHONE = 'phone',
  SMS = 'sms',
  EMAIL = 'email',
  VIBER = 'viber',
  WHATSAPP = 'whatsapp',
}

// Automation Trigger
export enum AutomationTrigger {
  LEAD_CREATED = 'lead_created',
  LEAD_ASSIGNED = 'lead_assigned',
  LEAD_STATUS_CHANGED = 'lead_status_changed',
  CONTACT_STATUS_CHANGED = 'contact_status_changed',
  CALL_COMPLETED = 'call_completed',
  CALL_MISSED = 'call_missed',
  TASK_OVERDUE = 'task_overdue',
  TASK_COMPLETED = 'task_completed',
  DEAL_CREATED = 'deal_created',
  DEAL_STATUS_CHANGED = 'deal_status_changed',
  DEPOSIT_RECEIVED = 'deposit_received',
  DEPOSIT_PENDING = 'deposit_pending',
  NO_RESPONSE_24H = 'no_response_24h',
  NO_RESPONSE_48H = 'no_response_48h',
  // Routing triggers
  LEAD_FIRST_RESPONSE_OVERDUE = 'lead_first_response_overdue',
  LEAD_REASSIGNED = 'lead_reassigned',
}

// Automation Action
export enum AutomationAction {
  CREATE_TASK = 'create_task',
  ASSIGN_MANAGER = 'assign_manager',
  CHANGE_STATUS = 'change_status',
  SEND_NOTIFICATION = 'send_notification',
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  SEND_VIBER = 'send_viber', // Future
  ESCALATE_TO_ADMIN = 'escalate_to_admin',
  SCHEDULE_CALLBACK = 'schedule_callback',
  SCHEDULE_FOLLOW_UP = 'schedule_follow_up',
  UPDATE_CONTACT_STATUS = 'update_contact_status',
}

// Lead Source
export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  COLD_CALL = 'cold_call',
  ADVERTISEMENT = 'advertisement',
  PARTNER = 'partner',
  VEHICLE_COPART = 'vehicle_copart',
  VEHICLE_IAAI = 'vehicle_iaai',
  OTHER = 'other',
}

// Deal Status Pipeline
export enum DealStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  AWAITING_PAYMENT = 'awaiting_payment',
  PAID = 'paid',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Deposit Status Lifecycle
export enum DepositStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

// Task Status
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

// Task Priority
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Notification Type
export enum NotificationType {
  NEW_LEAD = 'new_lead',
  LEAD_ASSIGNED = 'lead_assigned',
  TASK_DUE = 'task_due',
  TASK_OVERDUE = 'task_overdue',
  DEAL_UPDATE = 'deal_update',
  DEPOSIT_RECEIVED = 'deposit_received',
  DEPOSIT_PENDING = 'deposit_pending',
  SYSTEM = 'system',
}

// Audit Action
export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  STATUS_CHANGE = 'status_change',
  EXPORT = 'export',
  VIEW = 'view',
}

// Entity Type
export enum EntityType {
  USER = 'user',
  LEAD = 'lead',
  CUSTOMER = 'customer',
  DEAL = 'deal',
  DEPOSIT = 'deposit',
  TASK = 'task',
  NOTE = 'note',
  FILE = 'file',
  DOCUMENT = 'document',
}

// Customer Type
export enum CustomerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}
