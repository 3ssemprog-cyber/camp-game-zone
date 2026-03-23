// =============================================
// Camp Game Zone — Supabase Client
// بديل Firebase — سمّيه firebase.js في مشروعك
// =============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://vvxtdspxjbudmiewoadt.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eHRkc3B4amJ1ZG1pZXdvYWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDU1MDcsImV4cCI6MjA4OTg4MTUwN30.BCcaIfK7xF5P1AlDKgWcLE4Im3a91aJdNt_mXquvnB0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// =============================================
// Auth helpers — نفس واجهة Firebase
// =============================================
const auth = {
  get currentUser() { return supabase.auth.getUser ? _currentUser : null; },
};

let _currentUser = null;
supabase.auth.onAuthStateChange((event, session) => {
  _currentUser = session?.user || null;
});

// Admin UID — غيّره بالـ UID بتاعك من Supabase Auth
const ADMIN_UID = '1755c914-51fa-47ef-b693-0264a45a7833';

// =============================================
// signInWithEmailAndPassword
// =============================================
async function signInWithEmailAndPassword(_auth, email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  _currentUser = data.user;
  return data;
}

// =============================================
// signOut
// =============================================
async function signOut(_auth) {
  await supabase.auth.signOut();
  _currentUser = null;
}

// =============================================
// onAuthStateChanged — نفس واجهة Firebase
// =============================================
function onAuthStateChanged(_auth, callback) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    _currentUser = session?.user || null;
    if (_currentUser) _currentUser.uid = _currentUser.id;
    callback(_currentUser);
  });
  // تحقق فوري من الجلسة الحالية
  supabase.auth.getSession().then(({ data }) => {
    _currentUser = data.session?.user || null;
    if (_currentUser) _currentUser.uid = _currentUser.id;
    callback(_currentUser);
  });
}

// =============================================
// requireAuth
// =============================================
function requireAuth(callback) {
  supabase.auth.getSession().then(async ({ data }) => {
    const user = data.session?.user || null;
    if (!user) { window.location.href = 'index.html'; return; }
    _currentUser = user;
    // إضافة uid للتوافق مع كود Firebase القديم اللي بيستخدم user.uid
    user.uid = user.id;
    if (user.id === ADMIN_UID) {
      const adminData = { uid: user.id, email: user.email, role: 'أدمن', name: 'Admin', permissions: {} };
      if (callback) callback(user, adminData);
      return;
    }
    const userData = await getCurrentUserData();
    if (callback) callback(user, userData);
  });
}

// =============================================
// getCurrentUserData
// =============================================
async function getCurrentUserData() {
  const user = _currentUser;
  if (!user) return null;
  if (user.id === ADMIN_UID) {
    return { uid: user.id, email: user.email, role: 'أدمن', name: 'Admin', permissions: {} };
  }
  try {
    const { data } = await supabase.from('users').select('*').eq('uid', user.id).single();
    if (data) return { uid: user.id, ...data };
  } catch (e) {}
  return null;
}

// =============================================
// hasPermission
// =============================================
async function hasPermission(permKey) {
  const user = _currentUser;
  if (!user) return false;
  if (user.id === ADMIN_UID) return true;
  const userData = await getCurrentUserData();
  if (!userData?.permissions) return false;
  return userData.permissions[permKey] === true;
}

// =============================================
// isAdmin
// =============================================
function isAdmin() {
  return _currentUser && _currentUser.id === ADMIN_UID;
}

// =============================================
// logTransaction
// =============================================
async function logTransaction(action, detail, section) {
  try {
    const user = _currentUser;
    if (!user) return;
    let userName = 'Admin', userRole = 'أدمن';
    if (user.id !== ADMIN_UID) {
      const userData = await getCurrentUserData();
      userName = userData?.name || user.email || 'غير معروف';
      userRole = userData?.role || 'موظف';
    }
    await supabase.from('transactions_log').insert({
      action: String(action || ''),
      detail: String(detail || ''),
      section: String(section || ''),
      user_name: userName,
      role: userRole,
      date: new Date().toLocaleDateString('ar-EG'),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (e) { console.log('logTransaction error:', e); }
}

// =============================================
// fmt
// =============================================
function fmt(n) {
  return parseFloat(n || 0).toFixed(2) + ' ج';
}

function todayStr() {
  return new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function monthStr() {
  return new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
}

// =============================================
// Firestore-compatible helpers
// كل الكود القديم بيستخدم collection() و getDocs() إلخ
// الهيلبرز دي بتحوّل المكالمات دي لـ Supabase
// =============================================

// collection reference object
function collection(_db, tableName) {
  return { _table: tableName };
}

// doc reference object
function doc(_db, tableName, id) {
  return { _table: tableName, _id: id };
}

// getDocs — بيجيب كل الداتا من الجدول
async function getDocs(ref) {
  if (ref._query) {
    // query object
    let q = supabase.from(ref._table).select('*');
    for (const filter of (ref._filters || [])) {
      q = q.eq(filter.field, filter.value);
    }
    for (const o of (ref._orders || [])) {
      q = q.order(o.field, { ascending: o.dir === 'asc' });
    }
    const { data, error } = await q;
    if (error) throw error;
    return _wrapDocs(data || []);
  }
  const { data, error } = await supabase.from(ref._table).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return _wrapDocs(data || []);
}

// getDoc — بيجيب doc واحد
async function getDoc(ref) {
  const { data, error } = await supabase.from(ref._table).select('*').eq('id', ref._id).maybeSingle();
  if (error) throw error;
  return {
    exists: () => !!data,
    data: () => _fixRow(data),
    id: data?.id,
  };
}

// addDoc — بيضيف row جديدة
async function addDoc(ref, dataObj) {
  const row = _toRow(dataObj);
  if (ref._catId) row['cat_id'] = ref._catId;
  const { data, error } = await supabase.from(ref._table).insert(row).select().single();
  if (error) throw error;
  return { id: data.id };
}

// setDoc — بيعمل upsert (يدعم merge option)
async function setDoc(ref, dataObj, opts) {
  const row = _toRow(dataObj);
  if (ref._id) row['id'] = ref._id;
  const { error } = await supabase.from(ref._table).upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

// updateDoc — بيعمل update لـ row
async function updateDoc(ref, dataObj) {
  const row = _toRow(dataObj);
  const { error } = await supabase.from(ref._table).update(row).eq('id', ref._id);
  if (error) throw error;
}

// deleteDoc — بيحذف row
async function deleteDoc(ref) {
  const { error } = await supabase.from(ref._table).delete().eq('id', ref._id);
  if (error) throw error;
}

// query — بيبني query object
function query(ref, ...constraints) {
  const q = { _table: ref._table, _query: true, _filters: [], _orders: [] };
  for (const c of constraints) {
    if (c._type === 'where') q._filters.push(c);
    if (c._type === 'orderBy') q._orders.push(c);
  }
  return q;
}

// where
function where(field, op, value) {
  // تحويل أسماء الحقول من camelCase لـ snake_case
  const mapped = _mapField(field);
  return { _type: 'where', field: mapped, value };
}

// orderBy
function orderBy(field, dir) {
  const mapped = _mapField(field);
  return { _type: 'orderBy', field: mapped, dir: dir || 'asc' };
}

// serverTimestamp — مش محتاجه في Supabase بس موجود للتوافق
function serverTimestamp() {
  return new Date().toISOString();
}

// =============================================
// Helper functions داخلية
// =============================================

// تحويل أسماء الحقول من Firebase camelCase لـ Supabase snake_case
const FIELD_MAP = {
  'monthKey':     'month_key',
  'dayKey':       'day_key',
  'shiftKey':     'shift_key',
  'cashAmt':      'cash_amt',
  'elecAmt':      'elec_amt',
  'totalExp':     'total_exp',
  'alertQty':     'alert_qty',
  'imageUrl':     'image_url',
  'empName':      'emp_name',
  'isDeficit':    'is_deficit',
  'doneTime':     'done_time',
  'acceptedTime': 'accepted_time',
  'dayClosedAt':  'day_closed_at',
  'openedBy':     'opened_by',
  'openedAt':     'opened_at',
  'closedAt':     'closed_at',
  'timestamp':    'created_at',
  'table':        'table_name',
  'user':         'user_name',
};

function _mapField(f) {
  return FIELD_MAP[f] || f.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// تحويل object من Firebase format لـ Supabase row
function _toRow(obj) {
  const row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && v.toISOString) { row[_mapField(k)] = v.toISOString(); continue; }
    if (v === null || v === undefined) continue;
    row[_mapField(k)] = v;
  }
  // حذف timestamp لأن Supabase بيعملها تلقائي
  delete row['timestamp'];
  return row;
}

// تحويل row من Supabase لـ Firebase-like object
function _fixRow(row) {
  if (!row) return null;
  const REVERSE_MAP = Object.fromEntries(Object.entries(FIELD_MAP).map(([k,v])=>[v,k]));
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = REVERSE_MAP[k] || k;
    out[key] = v;
  }
  // إضافة timestamp-like object للتوافق
  if (row.created_at) {
    out.timestamp = {
      seconds: Math.floor(new Date(row.created_at).getTime() / 1000),
      toMillis: () => new Date(row.created_at).getTime(),
    };
  }
  return out;
}

function _wrapDocs(rows) {
  return {
    forEach: (cb) => rows.forEach(r => cb({ id: r.id, data: () => _fixRow(r), ...r })),
    docs: rows.map(r => ({ id: r.id, data: () => _fixRow(r) })),
    size: rows.length,
  };
}

// =============================================
// db object للتوافق مع الكود القديم
// =============================================
const db = supabase;

// =============================================
// timerCatItems — helper للـ timer_cat_items
// =============================================
function timerCatItems(catId) {
  return {
    _table: 'timer_cat_items',
    _catId: catId,
    _query: true,
    _filters: [{ field: 'cat_id', value: catId }],
    _orders: []
  };
}

// =============================================
// Exports — نفس الـ exports بتاعة firebase.js القديم
// =============================================
export {
  supabase,
  db,
  auth,
  ADMIN_UID,
  isAdmin,
  getCurrentUserData,
  hasPermission,
  logTransaction,
  fmt,
  todayStr,
  monthStr,
  requireAuth,
  timerCatItems,
  // Firestore-compatible functions
  doc, getDoc, setDoc, collection, addDoc, getDocs,
  updateDoc, deleteDoc, query, orderBy, where, serverTimestamp,
  // Auth functions
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
};
