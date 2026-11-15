import { adminFetch, IS_ADMIN_MOCK } from './client';
import { demoAdapter } from './mock/adapter';
import type { AdminUser, AdminUsersPage, Role, AccountStatus, UserRoleFilter } from '../types';

export const usersApi = {
  getUsers: async (params?: {
    q?: string;
    role?: UserRoleFilter;
    status?: AccountStatus;
    page?: number;
    pageSize?: number;
  }): Promise<AdminUsersPage> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getUsers(params);
    return adminFetch<AdminUsersPage>('/api/admin/users', { query: params });
  },

  approveUser: async (id: number): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserStatus(id, 'active');
    return adminFetch<AdminUser>(`/api/admin/users/${id}/approve`, { method: 'PATCH' });
  },

  rejectUser: async (id: number): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserStatus(id, 'rejected');
    return adminFetch<AdminUser>(`/api/admin/users/${id}/reject`, { method: 'PATCH' });
  },

  setUserRole: async (id: number, role: Role): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserRole(id, role);
    return adminFetch<AdminUser>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  getSettings: async (): Promise<{ showStudentRank: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.getSettings();
    return adminFetch<{ showStudentRank: boolean }>("/api/admin/users/settings");
  },
  updateSettings: async (settings: { showStudentRank: boolean }): Promise<{ showStudentRank: boolean }> => {
    if (IS_ADMIN_MOCK) return demoAdapter.updateSettings(settings);
    return adminFetch<{ showStudentRank: boolean }>("/api/admin/users/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },
  setUserStatus: async (id: number, status: AccountStatus): Promise<AdminUser> => {
    if (IS_ADMIN_MOCK) return demoAdapter.setUserStatus(id, status);
    return adminFetch<AdminUser>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
