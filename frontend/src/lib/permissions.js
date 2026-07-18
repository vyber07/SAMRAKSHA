export const ROLES = {
  ADMIN: 'admin',
  SHO: 'sho',
  DCP: 'dcp',
  IO: 'io',
  CONSTABLE: 'constable',
};

export const ROLE_HIERARCHY = {
  admin: 3,
  sho: 3,
  dcp: 2,
  io: 1,
  constable: 0,
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  sho: 'Station House Officer (SHO)',
  dcp: 'Deputy Commissioner (DCP)',
  io: 'Investigation Officer (IO)',
  constable: 'Constable',
};

export const ROLE_PERMISSIONS = {
  admin: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: true,
    canDeleteIncidents: true,
    canAssignCases: true,
    canViewSensitiveData: true,
  },
  sho: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: false,
    canDeleteIncidents: false,
    canAssignCases: true,
    canViewSensitiveData: true,
  },
  dcp: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: false,
    canDeleteIncidents: false,
    canAssignCases: true,
    canViewSensitiveData: true,
  },
  io: {
    canViewAnalytics: false,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: false,
    canManageUsers: false,
    canDeleteIncidents: false,
    canAssignCases: false,
    canViewSensitiveData: false,
  },
  constable: {
    canViewAnalytics: false,
    canViewMap: true,
    canEditIncidents: false,
    canViewReports: false,
    canManageUsers: false,
    canDeleteIncidents: false,
    canAssignCases: false,
    canViewSensitiveData: false,
  },
};

export const isHighRankOfficer = (role) => {
  return role && ['admin', 'sho', 'dcp'].includes(role);
};

export const isLowRankOfficer = (role) => {
  return role && ['io', 'constable'].includes(role);
};

export const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

export const canAccess = (userRole, feature) => {
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;

  const featureMap = {
    analytics: permissions.canViewAnalytics,
    map: permissions.canViewMap,
    editIncidents: permissions.canEditIncidents,
    reports: permissions.canViewReports,
    userManagement: permissions.canManageUsers,
    deleteIncidents: permissions.canDeleteIncidents,
    assignCases: permissions.canAssignCases,
    sensitiveData: permissions.canViewSensitiveData,
  };

  return featureMap[feature] || false;
};

export const getDashboardType = (role) => {
  return isHighRankOfficer(role) ? 'analytics' : 'field';
};

export const getAccessLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

export const canPerformAction = (userRole, targetUserRole, action) => {
  const userLevel = getAccessLevel(userRole);
  const targetLevel = getAccessLevel(targetUserRole);

  if (action === 'edit' || action === 'manage') {
    return userLevel > targetLevel;
  }

  if (action === 'delete') {
    return userLevel > targetLevel && userRole === ROLES.ADMIN;
  }

  return false;
};

export const getRoleColor = (role) => {
  const colors = {
    admin: '#2563eb',
    sho: '#f97316',
    dcp: '#06b6d4',
    io: '#16a34a',
    constable: '#f97316',
  };
  return colors[role] || '#94a3b8';
};

export const getRoleBadgeStyle = (role) => {
  const color = getRoleColor(role);
  return {
    background: `${color}15`,
    border: `1px solid ${color}40`,
    color: `${color}`,
  };
};

export const createPermissionGuard = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

export const isAuthorizedToView = (userRole, resource) => {
  const roleAccessMatrix = {
    analytics: ['admin', 'sho', 'dcp'],
    fullReports: ['admin', 'sho', 'dcp'],
    fieldMap: ['admin', 'sho', 'dcp', 'io', 'constable'],
    userManagement: ['admin'],
    sensitiveIncidents: ['admin', 'sho', 'dcp'],
  };

  return (roleAccessMatrix[resource] || []).includes(userRole);
};
