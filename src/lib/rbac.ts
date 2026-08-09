import { UserRole } from './types';

export type PermissionAction =
  | 'course.view'
  | 'course.create'
  | 'course.edit'
  | 'course.delete'
  | 'course.publish'
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.block'
  | 'user.delete'
  | 'order.view'
  | 'order.refund'
  | 'analytics.view'
  | 'settings.edit'
  | 'qa.reply'
  | 'quiz.attempt';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'course.view', 'course.create', 'course.edit', 'course.delete', 'course.publish',
    'user.view', 'user.create', 'user.edit', 'user.block', 'user.delete',
    'order.view', 'order.refund', 'analytics.view', 'settings.edit',
    'qa.reply', 'quiz.attempt'
  ],
  ADMIN: [
    'course.view', 'course.create', 'course.edit', 'course.delete', 'course.publish',
    'user.view', 'user.create', 'user.edit', 'user.block',
    'order.view', 'order.refund', 'analytics.view', 'settings.edit',
    'qa.reply', 'quiz.attempt'
  ],
  CONTENT_MANAGER: [
    'course.view', 'course.create', 'course.edit', 'course.publish',
    'analytics.view', 'qa.reply'
  ],
  SUPPORT_STAFF: [
    'user.view', 'order.view', 'order.refund', 'qa.reply'
  ],
  INSTRUCTOR: [
    'course.view', 'course.create', 'course.edit',
    'analytics.view', 'qa.reply'
  ],
  STUDENT: [
    'course.view', 'quiz.attempt', 'qa.reply'
  ]
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}
