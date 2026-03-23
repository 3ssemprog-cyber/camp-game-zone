// ============================================================
//  Camp Game Zone — Supabase Client
//  استبدل الملف ده بالـ firebase.js القديم — نفس الـ exports
//
//  ⚠️  خطوتين بس قبل الرفع:
//  1) روح supabase.com وعمل New Project
//  2) Project Settings → API → انسخ URL و anon key
//  3) حطهم في السطرين دول:
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = https://mdjshjzcybyocaszmfjn.supabase.co;   // ← غيّر
const SUPABASE_ANON = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kanNoanpjeWJ5b2Nhc3ptZmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTMzMzYsImV4cCI6MjA4OTg2OTMzNn0.iYP8euwz5tTQdZWTJqZgneeW0IMhb8p-IM7ewJP-x1U;              // ← غيّر
const ADMIN_UID     = 7411aa4e-d09f-486b-8ed1-04f3feeec5fa;     // نفس القديم — هيتغير بعد ما تعمل الأدمن على Supabase

export { ADMIN_UID };
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
export const db       = supabase;

// ─── auth object بنفس شكل Firebase ──────────────────────────
export const auth = {
  get currentUser() { return _cu; }
};

let _cu  = null;   // current user
let _cud = null;   // current user doc (cache)

supabase.auth.onAuthStateChange((_ev, session) => {
  _cu  = session?.user ? { uid: session.user.id, email: session.user.email } : null;
  _cud = null;
});

// ─── Auth functions ──────────────────────────────────────────

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

export function isAdmin() {
  return _cu?.uid === ADMIN_UID;
}

export async function getCurrentUserData() {
  if (!_cu) return null;
  if (_cu.uid === ADMIN_UID)
    return { uid: ADMIN_UID, email: _cu.email, role: 'أدمن', name: 'Admin', permissions: {} };
  if (_cud) return _cud;
  try {
    const { data } = await supabase.from('users').select('*').eq('uid', _cu.uid).single();
    _cud = { uid: _cu.uid, ...data };
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

// ─── Firestore-compatible wrappers ───────────────────────────

export function collection(_db, table, parentId, subTable) {
  if (subTable) return { _sub: true, table: subTable, parentId };
  return table;
}

export function doc(_db, table, id) {
  return { table, id };
}

export async function getDoc(ref) {
  const { data, error } = await supabase.from(ref.table).select('*').eq('id', ref.id).single();
  return {
    exists: () => !!data && !error,
    data:   () => data ?? null,
    id:     ref.id
  };
}

export async function setDoc(ref, data) {
  const { error } = await supabase
    .from(ref.table)
    .upsert({ id: ref.id, ..._clean(data) }, { onConflict: 'id' });
  if (error) throw error;
}

export async function addDoc(tableArg, data) {
  const table = typeof tableArg === 'string' ? tableArg : tableArg?.table || tableArg;
  const payload = _clean(data);
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
  const docs = (data || []).map(row => ({ id: row.id, data: () => ({ ...row }) }));
  return { docs, forEach: fn => docs.forEach(fn), size: docs.length, empty: !docs.length };
}

export async function updateDoc(ref, data) {
  const { error } = await supabase.from(ref.table).update(_clean(data)).eq('id', ref.id);
  if (error) throw error;
}

export async function deleteDoc(ref) {
  const { error } = await supabase.from(ref.table).delete().eq('id', ref.id);
  if (error) throw error;
}

// query builder
export function query(table, ...cs) {
  const tbl = typeof table === 'string' ? table : table;
  let q = supabase.from(tbl).select('*');
  for (const c of cs) {
    if (c._t === 'w') {
      if      (c.op === '==') q = q.eq(c.f, c.v);
      else if (c.op === '!=') q = q.neq(c.f, c.v);
      else if (c.op === '>')  q = q.gt(c.f, c.v);
      else if (c.op === '>=') q = q.gte(c.f, c.v);
      else if (c.op === '<')  q = q.lt(c.f, c.v);
      else if (c.op === '<=') q = q.lte(c.f, c.v);
      else if (c.op === 'in') q = q.in(c.f, c.v);
    }
    if (c._t === 'o') q = q.order(c.f, { ascending: c.d !== 'desc' });
    if (c._t === 'l') q = q.limit(c.v);
  }
  return { _isQuery: true, _q: q };
}

export const where   = (f, op, v) => ({ _t: 'w', f, op, v });
export const orderBy = (f, d='asc') => ({ _t: 'o', f, d });
export const limit   = (v) => ({ _t: 'l', v });

// ─── onSnapshot — بديل setInterval بـ Realtime حقيقي ────────

export function onSnapshot(tableOrRef, callback) {
  const table = typeof tableOrRef === 'string' ? tableOrRef : tableOrRef?.table || tableOrRef;
  // جيب البيانات أول مرة فوراً
  getDocs(table).then(snap => callback(snap));
  // اشترك على التغييرات
  const ch = supabase.channel('rt:' + table)
    .on('postgres_changes', { event: '*', schema: 'public', table }, async () => {
      const snap = await getDocs(table);
      callback(snap);
    })
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// ─── Internal ────────────────────────────────────────────────

function _clean(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}
