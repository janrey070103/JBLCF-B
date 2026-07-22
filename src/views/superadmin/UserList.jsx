import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../components/Button.jsx';
import Card from '../../components/Card.jsx';
import Input from '../../components/Input.jsx';
import Table from '../../components/Table.jsx';
import { fetchApi } from '../../api/client.js';

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user?.id;
  const [values, setValues] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'professor',
    phone: user?.phone ?? '',
    password: '',
    isActive: user?.isActive ?? true,
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!values.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!values.email.trim()) errs.email = 'Email is required.';
    if (!isEdit && !values.password) errs.password = 'Password is required for new users.';
    if (values.password && values.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setApiError('');
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      if (isEdit) {
        await fetchApi(`/api/admin/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      } else {
        await fetchApi('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(values),
        });
      }
      onSaved();
    } catch (err) {
      setApiError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-primary-900/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg rounded-container border border-primary-100 bg-white shadow-elevated animate-fade-up">
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
          <h2 id="user-modal-title" className="text-base font-semibold text-primary">
            {isEdit ? 'Edit User' : 'Add User'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-nested p-1 text-primary-400 hover:text-primary hover:bg-primary-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-5 py-4 space-y-4">
            <Input
              label="Full Name"
              value={values.fullName}
              onChange={setField('fullName')}
              error={errors.fullName}
            />
            <Input
              label="Email"
              type="email"
              value={values.email}
              onChange={setField('email')}
              error={errors.email}
            />
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Role</label>
              <select
                value={values.role}
                onChange={setField('role')}
                className="block w-full rounded-nested border border-primary-200 bg-white px-3 py-2 text-base text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="professor">Professor</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <Input
              label="Phone Number"
              mask="phone"
              value={values.phone}
              onChange={setField('phone')}
            />
            <Input
              label={isEdit ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              value={values.password}
              onChange={setField('password')}
              error={errors.password}
            />
            
            {isEdit && (
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={values.isActive}
                  onChange={setField('isActive')}
                  className="w-4 h-4 rounded border-primary-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-primary-900">Active Account</span>
              </label>
            )}

            {apiError && (
              <div className="rounded-nested border border-error/40 bg-error-light px-4 py-3 text-sm text-error">
                <span className="font-semibold">Error: </span>{apiError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-primary-100 px-5 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="tertiary" onClick={onClose} disabled={saving} fullWidth>
              Cancel
            </Button>
            <Button type="submit" loading={saving} fullWidth>
              {saving ? 'Saving...' : 'Save User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchApi('/api/admin/users', { method: 'GET' });
      setUsers(list || []);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleSaved = () => {
    setModalUser(undefined);
    load();
  };

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Name',
        render: (row) => (
          <div>
            <p className="font-medium text-primary">{row.fullName}</p>
            <p className="text-xs text-primary-400">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => (
          <span className="inline-flex rounded-pill border border-primary-100 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 capitalize">
            {row.role}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          row.isActive ? (
            <span className="text-success text-xs font-semibold">Active</span>
          ) : (
            <span className="text-error text-xs font-semibold">Inactive</span>
          )
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (row) => (
          <Button type="button" variant="ghost" size="sm" onClick={() => setModalUser(row)}>
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      {modalUser !== undefined && (
        <UserModal user={modalUser} onClose={() => setModalUser(undefined)} onSaved={handleSaved} />
      )}

      <div className="space-y-4 animate-fade-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">System Users</h1>
            <p className="text-sm text-primary-400 mt-0.5">Manage professors and superadmins</p>
          </div>
          <Button onClick={() => setModalUser(null)}>Add User</Button>
        </div>

        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-nested border border-primary-200 bg-white pl-9 pr-3 py-2 text-base text-primary-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {loading ? (
          <Card>
            <div className="space-y-3 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-nested bg-primary-50 animate-pulse" />
              ))}
            </div>
          </Card>
        ) : (
          <div className="max-h-[65svh] overflow-y-auto rounded-container">
            <Table columns={columns} rows={filtered} rowKey={(row) => row.id} emptyText="No users found." />
          </div>
        )}
      </div>
    </>
  );
}
