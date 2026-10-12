// Permission management for AI Studio Applet

export type UserRole = 'admin' | 'viewer';

export function getCurrentRole(): UserRole {
  const role = localStorage.getItem('sys_user_role');
  if (role === 'viewer') return 'viewer';
  return 'admin';
}

export function setCurrentRole(role: UserRole) {
  localStorage.setItem('sys_user_role', role);
  window.dispatchEvent(new Event('role_changed'));
}

export function hasMenuPermission(menuKey: string): boolean {
  // All menus visible for now, or custom rule if needed
  return true;
}

export function hasButtonPermission(buttonKey: string): boolean {
  const role = getCurrentRole();
  if (role === 'viewer') {
    // Viewers cannot edit, save, create or delete configs
    if (['config_edit', 'config_save', 'config_create', 'config_delete'].includes(buttonKey)) {
      return false;
    }
  }
  return true;
}
