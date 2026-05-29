// Pure Custom Database Client (No Supabase)
const BACKEND_URL = 'http://localhost:5000/api/db';

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.query = { select: '*', filters: [], order: [] };
    this.action = 'select';
    this.payload = null;
  }
  select(columns = '*', options = {}) { 
    if (this.action === 'select') {
      this.action = 'select'; 
    }
    this.query.select = typeof columns === 'string' ? columns : { ...columns, ...options };
    if (options.head) this.query.options = { ...this.query.options, head: true };
    return this; 
  }
  eq(col, val) { this.query.filters.push({ type: 'eq', col, val }); return this; }
  ilike(col, val) { this.query.filters.push({ type: 'ilike', col, val }); return this; }
  in(col, valArr) { this.query.filters.push({ type: 'in', col, val: valArr }); return this; }
  insert(data) { this.action = 'insert'; this.payload = Array.isArray(data) ? data : [data]; return this; }
  update(data) { this.action = 'update'; this.payload = data; return this; }
  upsert(data, options) { this.action = 'upsert'; this.payload = Array.isArray(data) ? data : [data]; this.query.options = options; return this; }
  order(col, options = { ascending: true }) { this.query.order.push({ col, ascending: options?.ascending !== false }); return this; }
  or(filters) { this.query.filters.push({ type: 'or', val: filters }); return this; }
  single() { this.query.options = { ...this.query.options, single: true }; return this; }
  maybeSingle() { this.query.options = { ...this.query.options, single: true }; return this; }
  limit(n) { this.query.options = { ...this.query.options, limit: n }; return this; }
  async execute() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/query`, {
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ table: this.table, action: this.action, query: this.query, payload: this.payload })
      });
      const result = await response.json();
      return { data: result.data, count: result.count, error: result.error ? new Error(result.error) : null };
    } catch (err) { return { data: null, count: null, error: err }; }
  }
  then(resolve, reject) { return this.execute().then(resolve).catch(reject); }
}

export const db = {
  from: (table) => new QueryBuilder(table),
  rpc: async (fn, params) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/rpc`, {
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ fn, params })
      });
      const result = await response.json();
      return { data: result.data, error: result.error ? new Error(result.error) : null };
    } catch (err) { return { data: null, error: err }; }
  },
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const result = await response.json();
        if (result.error) return { data: null, error: new Error(result.error) };
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        return { data: { user: result.user }, error: null };
      } catch (err) { return { data: null, error: err }; }
    },
    signUp: async ({ email, password, options }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/signup`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, data: options?.data })
        });
        const result = await response.json();
        if (result.error) return { data: null, error: new Error(result.error) };
        return { data: { user: result.user }, error: null };
      } catch (err) { return { data: null, error: err }; }
    },
    signOut: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { error: null };
    },
    getUser: async () => {
      const user = localStorage.getItem('user');
      return { data: { user: user ? JSON.parse(user) : null }, error: null };
    },
    getSession: async () => {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return { data: { session: user ? { user: JSON.parse(user), access_token: token } : null }, error: null };
    }
  },
  storage: {
    from: (bucket) => ({
      upload: async (path, file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);
        formData.append('bucket', bucket);
        try {
          const response = await fetch(`${BACKEND_URL}/storage/upload`, {
            method: 'POST', body: formData
          });
          const result = await response.json();
          return { data: result.data, error: result.error ? new Error(result.error) : null };
        } catch (err) { return { data: null, error: err }; }
      },
      getPublicUrl: (path) => ({ data: { publicUrl: `http://localhost:5000/uploads/${bucket}/${path}` } }),
      remove: async (paths) => {
        try {
          const response = await fetch(`${BACKEND_URL}/storage/remove`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket, paths })
          });
          const result = await response.json();
          return { data: result.data, error: result.error ? new Error(result.error) : null };
        } catch (err) { return { data: null, error: err }; }
      }
    })
  }
};
