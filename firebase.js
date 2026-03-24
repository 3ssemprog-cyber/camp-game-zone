// ============================================================
//  Camp Game Zone — Supabase Client
//  نفس الـ exports بتاعت Firebase — باقي الكود ما اتغيرش
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://lasatmuumpwjnmbollpd.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhc2F0bXV1bXB3am5tYm9sbHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDc4ODksImV4cCI6MjA4OTg4Mzg4OX0.Ad0yGhi15GH2rQIQ0fhCYF3Nw1YSggQkRMHoz92WT-k';
const ADMIN_UID     = 'b2bf5fd8-a428-47fb-ae1a-6045f3ab21dd'; // هيتغير بعد ما تعمل الأدمن في Supabase Auth

export { ADMIN_UID };
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const db       = supabase;

// ─── camelCase ↔ snake_case تلقائي ───────────────────────────
// الكود القديم بيستخدم camelCase — Supabase بيحب snake_case
// الـ wrapper دي بتترجم تلقائياً في الاتجاهين

function toSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const sk = k.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[sk] = v;
  }
  return out;
}

function toCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[ck] = v;
  }
  return out;
}

function cleanObj(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// ─── Auth ────────────────────────────────────────────────────

export const auth = { get currentUser() { return _cu; } };

let _cu  = null;
let _cud = null;

supabase.auth.onAuthStateChange((_ev, session) => {
  _cu  = session?.user ? { uid: session.user.id, email: session.user.email } : null;
  _cud = null;
});

export async function signInWithEmailAndPassword(_a, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut(_a) {
  _cu = null; _cud = null;
  await supabase.auth.signOut();
}

export function onAuthStateChanged(_a, cb) {
  supabase.auth.getSession().then(({ data }) => {
    const u = data.session?.user ?? null;
    _cu = u ? { uid: u.id, email: u.email } : null;
    cb(_cu);
  });
  supabase.auth.onAuthStateChange((_ev, session) => {
    _cu  = session?.user ? { uid: session.user.id, email: session.user.email } : null;
    _cud = null;
    cb(_cu);
  });
}

// ─── User & Permissions ──────────────────────────────────────

export function isAdmin() { return _cu?.uid === ADMIN_UID; }

export async function getCurrentUserData() {
  if (!_cu) return null;
  if (_cu.uid === ADMIN_UID)
    return { uid: ADMIN_UID, email: _cu.email, role: 'أدمن', name: 'Admin', permissions: {} };
  if (_cud) return _cud;
  try {
    const { data } = await supabase.from('users').select('*').eq('uid', _cu.uid).single();
    _cud = { uid: _cu.uid, ...toCamel(data) };
    return _cud;
  } catch { return null; }
}

export async function hasPermission(permKey) {
  if (!_cu) return false;
  if (_cu.uid === ADMIN_UID) return true;
  const ud = await getCurrentUserData();
  return ud?.permissions?.[permKey] === true;
}

export function requireAuth(callback) {
  supabase.auth.getSession().then(async ({ data }) => {
    const u = data.session?.user;
    if (!u) { window.location.href = 'index.html'; return; }
    _cu = { uid: u.id, email: u.email };
    const ud = await getCurrentUserData();
    callback({ uid: u.id, email: u.email }, ud);
  });
}

// ─── logTransaction ──────────────────────────────────────────

export async function logTransaction(action, detail, section) {
  try {
    if (!_cu) return;
    let userName = 'Admin', userRole = 'أدمن';
    if (_cu.uid !== ADMIN_UID) {
      const ud = await getCurrentUserData();
      userName = ud?.name || _cu.email || 'غير معروف';
      userRole = ud?.role || 'موظف';
    }
    await supabase.from('transactions_log').insert({
      action:     String(action  || ''),
      detail:     String(detail  || ''),
      section:    String(section || ''),
      user_name:  userName,
      role:       userRole,
      date:       new Date().toLocaleDateString('ar-EG'),
      time:       new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    });
  } catch (e) { console.log('logTransaction error:', e); }
}

// ─── Helpers ─────────────────────────────────────────────────

export const fmt             = (n) => parseFloat(n || 0).toFixed(2) + ' ج';
export const serverTimestamp = ()  => new Date().toISOString();
export const todayStr        = ()  => new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
export const monthStr        = ()  => new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });

// ─── Firestore wrappers ──────────────────────────────────────

export function collection(_db, table, parentId, subTable) {
  if (subTable) return { _sub: true, table: subTable, parentId };
  return table;
}

export function doc(_db, table, id) {
  return { table, id };
}

export async function getDoc(ref) {
  try {
    const { data, error } = await supabase.from(ref.table).select('*').eq('id', ref.id).single();
    const camel = data ? toCamel(data) : null;
    return {
      exists: () => !!data && !error,
      data:   () => camel,
      id:     ref.id
    };
  } catch {
    return { exists: () => false, data: () => null, id: ref.id };
  }
}

export async function setDoc(ref, data) {
  const payload = { id: ref.id, ...toSnake(cleanObj(data)) };
  const { error } = await supabase.from(ref.table).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function addDoc(tableArg, data) {
  const table   = typeof tableArg === 'string' ? tableArg : tableArg?.table || tableArg;
  const payload = toSnake(cleanObj(data));
  const { data: res, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return { id: res.id };
}

export async function getDocs(tableOrQuery) {
  let q;
  if (typeof tableOrQuery === 'string') {
    q = supabase.from(tableOrQuery).select('*');
  } else if (tableOrQuery?._isQuery) {
    q = tableOrQuery._q;
  } else if (tableOrQuery?._sub) {
    q = supabase.from(tableOrQuery.table).select('*').eq('parent_id', tableOrQuery.parentId);
  } else {
    q = supabase.from(tableOrQuery).select('*');
  }
  const { data, error } = await q;
  if (error) throw error;
  const docs = (data || []).map(row => {
    const camel = toCamel(row);
    return { id: row.id, data: () => ({ ...camel }) };
  });
  return { docs, forEach: fn => docs.forEach(fn), size: docs.length, empty: !docs.length };
}

export async function updateDoc(ref, data) {
  const { error } = await supabase.from(ref.table).update(toSnake(cleanObj(data))).eq('id', ref.id);
  if (error) throw error;
}

export async function deleteDoc(ref) {
  const { error } = await supabase.from(ref.table).delete().eq('id', ref.id);
  if (error) throw error;
}

export function query(table, ...cs) {
  const tbl = typeof table === 'string' ? table : table;
  let q = supabase.from(tbl).select('*');
  for (const c of cs) {
    if (c._t === 'w') {
      const field = toSnake({ [c.f]: '' }); // convert field name
      const snakeField = Object.keys(field)[0];
      if      (c.op === '==') q = q.eq(snakeField, c.v);
      else if (c.op === '!=') q = q.neq(snakeField, c.v);
      else if (c.op === '>')  q = q.gt(snakeField, c.v);
      else if (c.op === '>=') q = q.gte(snakeField, c.v);
      else if (c.op === '<')  q = q.lt(snakeField, c.v);
      else if (c.op === '<=') q = q.lte(snakeField, c.v);
      else if (c.op === 'in') q = q.in(snakeField, c.v);
    }
    if (c._t === 'o') {
      const snakeField = c.f.replace(/([A-Z])/g, '_$1').toLowerCase();
      q = q.order(snakeField, { ascending: c.d !== 'desc' });
    }
    if (c._t === 'l') q = q.limit(c.v);
  }
  return { _isQuery: true, _q: q };
}

export const where   = (f, op, v) => ({ _t: 'w', f, op, v });
export const orderBy = (f, d = 'asc') => ({ _t: 'o', f, d });
export const limit   = (v) => ({ _t: 'l', v });

// ─── onSnapshot — Realtime بدل setInterval ───────────────────

export function onSnapshot(tableOrRef, callback) {
  const table = typeof tableOrRef === 'string' ? tableOrRef : tableOrRef?.table || tableOrRef;
  getDocs(table).then(snap => callback(snap));
  const ch = supabase.channel('rt:' + table)
    .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
      const snap = await getDocs(table);
      callback(snap);
    })
    .subscribe();
  return () => supabase.removeChannel(ch);
}
