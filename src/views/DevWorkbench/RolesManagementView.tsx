import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth, HARDCODED_ADMIN_DISCORD_IDS, getDiscordAvatar, isAdmin, isSupervisor } from '../../context/AuthContext.tsx';
import { apiRequest } from '../../api/client.ts';

export interface DatabaseUser {
  id: string;
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  role: string;
  createdAt?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  category: 'Administration' | 'Supervision' | 'Production' | 'Community' | 'Custom';
  color: string;
  description: string;
  isBuiltIn: boolean;
}

const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    category: 'Administration',
    color: '#ef4444',
    description: 'Full root access to round lifecycles, database entries, and role elevations.',
    isBuiltIn: true,
  },
  {
    id: 'moderator',
    name: 'Moderator',
    category: 'Administration',
    color: '#f59e0b',
    description: 'Content review, AI detector audit verification, and report management.',
    isBuiltIn: true,
  },
  {
    id: 'supervisor_story',
    name: 'Story Supervisor',
    category: 'Supervision',
    color: '#94a3b8',
    description: 'Pitch approval, script sign-off, narrative continuity, and dialogue review.',
    isBuiltIn: true,
  },
  {
    id: 'supervisor_art',
    name: 'Art Supervisor',
    category: 'Supervision',
    color: '#60a5fa',
    description: 'Color palette validation, shader profiles, and block asset blueprints.',
    isBuiltIn: true,
  },
  {
    id: 'supervisor_animation',
    name: 'Animation Supervisor',
    category: 'Supervision',
    color: '#2dd4bf',
    description: 'Shot dispatcher review, rig mechanics, and camera lens certification.',
    isBuiltIn: true,
  },
  {
    id: 'supervisor_post',
    name: 'Post Supervisor',
    category: 'Supervision',
    color: '#c084fc',
    description: 'Assembly cuts, timeline pacing, color grading, and final render masters.',
    isBuiltIn: true,
  },
  {
    id: 'supervisor_audio',
    name: 'Audio Supervisor',
    category: 'Supervision',
    color: '#fb923c',
    description: 'Voice stems, Foley sound effects, mix mastering, and musical score balance.',
    isBuiltIn: true,
  },
  {
    id: 'senior_contributor',
    name: 'Senior Contributor',
    category: 'Production',
    color: '#38bdf8',
    description: 'Proven animators with multi-shot reservation privileges.',
    isBuiltIn: true,
  },
  {
    id: 'contributor',
    name: 'Contributor',
    category: 'Production',
    color: '#a3e635',
    description: 'Blender animators and artists claiming production GrabBox shots.',
    isBuiltIn: true,
  },
  {
    id: 'voter',
    name: 'Voter',
    category: 'Community',
    color: '#64748b',
    description: 'Community members participating in ranked-choice ballot rounds.',
    isBuiltIn: true,
  },
];

const LOCAL_CUSTOM_ROLES_KEY = 'mcs_custom_roles_registry_v1';

export const RolesManagementView: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Custom Mutable Roles Registry
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_CUSTOM_ROLES_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  });

  // Modal State for Adding Custom Role
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleColor, setNewRoleColor] = useState<string>('#3b82f6');
  const [newRoleDescription, setNewRoleDescription] = useState<string>('');

  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);

  const canManageRoles = isAdmin(user?.role) || isSupervisor(user?.role) || (user?.discordId ? HARDCODED_ADMIN_DISCORD_IDS.has(user.discordId) : false);

  // Combined Roles List (System + Mutable Custom)
  const allRoles = useMemo(() => {
    return [...DEFAULT_SYSTEM_ROLES, ...customRoles];
  }, [customRoles]);

  // 1. Fetch Registered Users Directly From Live PostgreSQL Database
  const {
    data: users = [],
    isLoading: isUsersLoading,
    refetch: refetchUsers,
  } = useQuery<DatabaseUser[]>({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      try {
        const res = await apiRequest<DatabaseUser[] | { data: DatabaseUser[] }>('/users');
        if (Array.isArray(res)) return res;
        if (res && Array.isArray((res as any).data)) return (res as any).data;
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 10,
  });

  // Extract Discord IDs for presence polling
  const discordIds = useMemo(() => {
    const list = users.map((u) => u.discordId).filter(Boolean);
    HARDCODED_ADMIN_DISCORD_IDS.forEach((id) => {
      if (!list.includes(id)) list.push(id);
    });
    return list;
  }, [users]);

  // 2. Fetch Live Discord Presence (Online, Idle, DND, Offline)
  const { data: presenceMap = {} } = useQuery<Record<string, 'online' | 'idle' | 'dnd' | 'offline'>>({
    queryKey: ['discord', 'presence', discordIds.join(',')],
    queryFn: async () => {
      if (discordIds.length === 0) return {};
      try {
        const res = await apiRequest<{ data: Record<string, 'online' | 'idle' | 'dnd' | 'offline'> } | Record<string, any>>(
          `/users/presence?ids=${encodeURIComponent(discordIds.join(','))}`
        );
        return (res as any)?.data || res || {};
      } catch {
        return {};
      }
    },
    enabled: discordIds.length > 0,
    refetchInterval: 10000,
  });

  // 3. Mutation: Update User Role in Live Database
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNotice(`Updated role to "${vars.role}" for user.`);
      setTimeout(() => setNotice(null), 3000);
    },
    onError: (err: any) => {
      setNotice(`Failed to update role: ${err?.message || 'Server error'}`);
      setTimeout(() => setNotice(null), 4000);
    },
  });

  // Handle Role Creation
  const handleCreateCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    const cleanId = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (allRoles.some((r) => r.id === cleanId)) {
      alert('A role with this name already exists.');
      return;
    }
    const newRole: RoleDefinition = {
      id: cleanId,
      name: trimmed,
      category: 'Custom',
      color: newRoleColor,
      description: newRoleDescription.trim() || 'Custom department role.',
      isBuiltIn: false,
    };
    const updated = [...customRoles, newRole];
    setCustomRoles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(updated));
    }
    setNewRoleName('');
    setNewRoleDescription('');
    setIsCreateRoleOpen(false);
    setNotice(`Created mutable role "${trimmed}".`);
    setTimeout(() => setNotice(null), 3500);
  };

  // Handle Custom Role Deletion
  const handleDeleteCustomRole = (roleId: string) => {
    const updated = customRoles.filter((r) => r.id !== roleId);
    setCustomRoles(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_CUSTOM_ROLES_KEY, JSON.stringify(updated));
    }
    setNotice(`Deleted custom role "${roleId}".`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Filtered Users Roster
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery === '' ||
        u.discordUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.discordId?.includes(searchQuery) ||
        u.role?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRoleFilter === 'all' ||
        (selectedRoleFilter === 'admin' && (u.role === 'admin' || HARDCODED_ADMIN_DISCORD_IDS.has(u.discordId))) ||
        (selectedRoleFilter === 'supervisor' && u.role.startsWith('supervisor')) ||
        (selectedRoleFilter === 'contributor' && (u.role === 'contributor' || u.role === 'senior_contributor')) ||
        (selectedRoleFilter === 'voter' && u.role === 'voter') ||
        u.role === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);

  // Presence Color & Label Helper
  const getPresenceBadge = (discordId: string) => {
    const status = presenceMap[discordId] || 'offline';
    switch (status) {
      case 'online':
        return { color: '#10b981', label: 'Online', glow: '0 0 8px #10b981' };
      case 'idle':
        return { color: '#f59e0b', label: 'Idle', glow: '0 0 8px #f59e0b' };
      case 'dnd':
        return { color: '#ef4444', label: 'Do Not Disturb', glow: '0 0 8px #ef4444' };
      default:
        return { color: '#64748b', label: 'Offline', glow: 'none' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header Banner */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)' }}>Roles</div>
              <span className="badge badge-engine mono">{users.length} USERS</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => refetchUsers()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh Users</span>
            </button>

            {canManageRoles && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsCreateRoleOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add Custom Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {!canManageRoles && (
        <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f59e0b', fontSize: '13px', fontWeight: 700 }}>
          Moderator Read-Only Mode: Viewing staff and community members. Administrator privileges are required to modify user roles or create custom departments.
        </div>
      )}

      {notice && (
        <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)', fontSize: '13px', fontWeight: 700 }}>
          {notice}
        </div>
      )}

      {/* 2. Mutable Role System Registry */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
            Definitions
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {allRoles.map((role) => {
            const isHovered = hoveredRoleId === role.id;
            return (
              <div
                key={role.id}
                onMouseEnter={() => setHoveredRoleId(role.id)}
                onMouseLeave={() => setHoveredRoleId(null)}
                title={role.description}
                style={{
                  position: 'relative',
                  padding: '10px 14px',
                  background: isHovered ? 'var(--bg-card-hover)' : 'var(--bg-card-muted)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>
                    {role.name}
                  </span>
                </div>

                {!role.isBuiltIn ? (
                  canManageRoles ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 6px', fontSize: '10px', color: '#ef4444' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomRole(role.id);
                      }}
                      title="Delete custom role"
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="badge badge-light" style={{ fontSize: '9px', padding: '2px 6px' }}>
                      CUSTOM
                    </span>
                  )
                ) : (
                  <span className="badge badge-light" style={{ fontSize: '9px', padding: '2px 6px' }}>
                    {role.category.toUpperCase()}
                  </span>
                )}

                {/* Details Floating Tooltip on Hover */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(12px)',
                      color: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                      zIndex: 100,
                      pointerEvents: 'none',
                      width: 'max-content',
                      maxWidth: '260px',
                      fontSize: '11px',
                      lineHeight: 1.45,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: role.color, marginBottom: 2 }}>
                      {role.name} ({role.category})
                    </div>
                    <div style={{ color: '#cbd5e1' }}>
                      {role.description}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Signed-up Users & Live Discord Presence Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-main)' }}>
              Users
            </div>
                      </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search by username, Discord ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 240, fontSize: '12px', padding: '6px 12px' }}
            />

            <select
              className="select-field"
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="supervisor">Supervisors</option>
              <option value="contributor">Contributors</option>
              <option value="voter">Voters</option>
              {customRoles.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Discord ID</th>
                <th>Presence</th>
                <th>Role</th>
                <th style={{ textAlign: 'right', minWidth: 200 }}>Assign</th>
              </tr>
            </thead>
            <tbody>
              {isUsersLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    Loading live users from database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    {users.length === 0 ? 'No users registered in database yet.' : 'No users matching filter.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const presence = getPresenceBadge(u.discordId);
                  const isBuiltInAdmin = HARDCODED_ADMIN_DISCORD_IDS.has(u.discordId);

                  return (
                    <tr key={u.id || u.discordId}>
                      {/* Avatar & Username */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ position: 'relative', width: 36, height: 36 }}>
                            <img
                              src={getDiscordAvatar({ discordId: u.discordId, discordAvatar: u.discordAvatar || undefined })}
                              alt={u.discordUsername}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                            {/* Live Discord Presence Indicator Dot */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: -1,
                                right: -1,
                                width: 11,
                                height: 11,
                                borderRadius: '50%',
                                background: presence.color,
                                boxShadow: presence.glow,
                              }}
                              title={`Discord Status: ${presence.label}`}
                            />
                          </div>

                          <div>
                            <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-main)' }}>
                              {u.discordUsername || 'Discord User'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {isBuiltInAdmin ? 'Root Platform Administrator' : 'Platform Member'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Discord ID */}
                      <td>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {u.discordId}
                        </span>
                      </td>

                      {/* Discord Live Presence */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: presence.color }} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: presence.color }}>
                            {presence.label}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: `${allRoles.find((r) => r.id === u.role)?.color || '#3b82f6'}22`,
                            color: allRoles.find((r) => r.id === u.role)?.color || '#3b82f6',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          {(allRoles.find((r) => r.id === u.role)?.name || u.role).toUpperCase()}
                        </span>
                      </td>

                      {/* Role Assignment Dropdown */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
                          <select
                            className="select-field"
                            value={u.role || 'voter'}
                            disabled={!user || (user.role !== 'admin' && !HARDCODED_ADMIN_DISCORD_IDS.has(user.discordId))}
                            onChange={(e) => {
                              const newRole = e.target.value;
                              updateRoleMutation.mutate({ userId: u.id, role: newRole });
                            }}
                            style={{ fontSize: '12px', padding: '4px 10px', minWidth: 160 }}
                          >
                            <optgroup label="Core Administration">
                              <option value="admin">Administrator</option>
                              <option value="moderator">Moderator</option>
                            </optgroup>

                            <optgroup label="Department Supervisors">
                              <option value="supervisor_story">Story Supervisor</option>
                              <option value="supervisor_art">Art Supervisor</option>
                              <option value="supervisor_animation">Animation Supervisor</option>
                              <option value="supervisor_post">Post Supervisor</option>
                              <option value="supervisor_audio">Audio Supervisor</option>
                            </optgroup>

                            <optgroup label="Production & Community">
                              <option value="senior_contributor">Senior Contributor</option>
                              <option value="contributor">Contributor</option>
                              <option value="voter">Voter</option>
                            </optgroup>

                            {customRoles.length > 0 && (
                              <optgroup label="Custom Department Roles">
                                {customRoles.map((cr) => (
                                  <option key={cr.id} value={cr.id}>
                                    {cr.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Add Custom Mutable Role */}
      {isCreateRoleOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 12px 0' }}>
              Create Custom Mutable Role
            </h3>

            <form onSubmit={handleCreateCustomRole} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Role Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. VFX Lead, Lore Master"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Badge Color
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={newRoleColor}
                    onChange={(e) => setNewRoleColor(e.target.value)}
                    style={{ width: 44, height: 36, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <span className="mono" style={{ fontSize: '12px' }}>{newRoleColor}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Description / Responsibilities
                </label>
                <textarea
                  className="input-field"
                  placeholder="Responsibilities for this role..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsCreateRoleOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
