import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const ROLES = ['ADMIN', 'DIRECTOR', 'EQUIPO', 'SOLICITANTE'];

const rolColors = {
  ADMIN: 'bg-red-100 text-red-700',
  DIRECTOR: 'bg-purple-100 text-purple-700',
  EQUIPO: 'bg-blue-100 text-blue-700',
  SOLICITANTE: 'bg-green-100 text-green-700',
};

const rolAvatarColors = {
  ADMIN: 'bg-red-200 text-red-700',
  DIRECTOR: 'bg-purple-200 text-purple-700',
  EQUIPO: 'bg-blue-200 text-blue-700',
  SOLICITANTE: 'bg-green-200 text-green-700',
};

const rolLabels = {
  ADMIN: 'Admin',
  DIRECTOR: 'Director',
  EQUIPO: 'Equipo',
  SOLICITANTE: 'Solicitante',
};

const LIMIT = 15;

export default function GestionUsuarios() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({ nombre: '', email: '', cargo: '', password: '', rol: 'SOLICITANTE' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (rolFilter) params.set('rol', rolFilter);
      params.set('page', page);
      params.set('limit', LIMIT);
      const data = await api.get(`/users?${params.toString()}`);
      setUsers(data.data);
      setTotal(data.total);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, rolFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const totalPages = Math.ceil(total / LIMIT);
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

  // ─── Handlers ──────────────────────────────────────────

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users', formData);
      setSuccess('Usuario creado exitosamente');
      setShowCreateModal(false);
      setFormData({ nombre: '', email: '', cargo: '', password: '', rol: 'SOLICITANTE' });
      fetchUsers();
    } catch (err) {
      setError(err.data?.error || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError('');
    try {
      const body = {};
      if (formData.nombre) body.nombre = formData.nombre;
      if (formData.email) body.email = formData.email;
      if (formData.cargo) body.cargo = formData.cargo;
      await api.patch(`/users/${editingUser.id}`, body);
      setSuccess('Usuario actualizado exitosamente');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.data?.error || 'Error al actualizar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRol) => {
    if (!window.confirm(`¿Cambiar el rol de este usuario a ${rolLabels[newRol]}?`)) return;
    try {
      await api.patch(`/users/${userId}/rol`, { rol: newRol });
      setSuccess('Rol actualizado');
      fetchUsers();
    } catch (err) {
      setError(err.data?.error || 'Error al cambiar rol');
    }
  };

  const handleDelete = async (userId, nombre) => {
    if (!window.confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setSuccess('Usuario eliminado');
      fetchUsers();
    } catch (err) {
      setError(err.data?.error || 'Error al eliminar usuario');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ nombre: user.nombre, email: user.email, cargo: user.cargo, password: '', rol: user.rol });
    setShowEditModal(true);
  };

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">
            {total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ nombre: '', email: '', cargo: '', password: '', rol: 'SOLICITANTE' });
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={rolFilter}
          onChange={(e) => { setRolFilter(e.target.value); setPage(1); }}
          className="input-field w-full sm:w-48"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{rolLabels[r]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No se encontraron usuarios
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* User info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${rolAvatarColors[user.rol] || 'bg-gray-200 text-gray-600'}`}>
                          {user.nombre?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.nombre}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Cargo */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">{user.cargo}</span>
                    </td>
                    {/* Rol */}
                    <td className="px-4 py-3">
                      <select
                        value={user.rol}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border-0 cursor-pointer ${rolColors[user.rol] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{rolLabels[r]}</option>
                        ))}
                      </select>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.nombre)}
                          className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Mostrando {startItem}-{endItem} de {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-white rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-white rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Create Modal ─────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Nuevo Usuario
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo <span className="text-red-500">*</span></label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="input-field" required placeholder="Ej: Prof. Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico <span className="text-red-500">*</span></label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" required placeholder="correo@iudc.edu.co" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cargo <span className="text-red-500">*</span></label>
                <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="input-field" required placeholder="Ej: Docente - Facultad de Ingeniería" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contraseña <span className="text-red-500">*</span></label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input-field" required minLength={6} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
                <select value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })} className="input-field">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{rolLabels[r]}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Creando...' : 'Crear usuario'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ───────────────────────────────────── */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                Editar Usuario
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre completo</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="input-field" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Correo electrónico</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="correo@iudc.edu.co" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cargo</label>
                <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })} className="input-field" placeholder="Cargo o área" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
