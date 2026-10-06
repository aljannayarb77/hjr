/**
 * وظائف ومساعدات الواجهة الأمامية المشتركة
 */

const API_BASE = '/api';

// نظام التنبيهات المنبثقة (Toast)
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
  } else if (type === 'warning') {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  } else {
    iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  toast.innerHTML = `${iconSvg} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// الاتصال بـ API مع تضمين التوكن ومحاكي تفاعلي ذكي لـ GitHub Pages
async function apiRequest(endpoint, options = {}) {
  const isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  if (!isStaticHost) {
    try {
      const token = localStorage.getItem('alhijr_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.status !== 404 && contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'حدث خطأ في معالجة الطلب.');
        }
        return data;
      }
    } catch (netErr) {
      if (!netErr.message.includes('في معالجة الطلب')) {
        console.warn('الخادم غير متاح، جاري التبديل للمحاكي التفاعلي المدمج لـ GitHub Pages:', netErr.message);
      } else {
        throw netErr;
      }
    }
  }

  // المحاكي التفاعلي للعمل بدون خادم خلفي على GitHub Pages
  return handleClientDemoApi(endpoint, options);
}

// ============================================================================
// محاكي الـ API التفاعلي المدمج (للتشغيل المباشر على GitHub Pages)
// ============================================================================
function getDemoDb() {
  let dbStr = localStorage.getItem('alhijr_demo_db');
  if (dbStr) {
    try { return JSON.parse(dbStr); } catch (e) {}
  }

  const initialDb = {
    users: [
      { id: 'usr_admin_01', username: 'admin', full_name: 'ماجد محسن الشهري (المدير العام)', role: 'ADMIN', is_active: true },
      { id: 'usr_staff_01', username: 'staff', full_name: 'فهد الغامدي (مشرف الدخول والتفويج)', role: 'STAFF', is_active: true }
    ],
    appointments: [],
    bookings: [
      {
        id: 'bk_sample_01',
        booking_ref: 'HJ-2026-8812',
        national_id: '1099887766',
        phone: '0599112233',
        full_name: 'مروج يعقوب الغامدي',
        nationality: 'سعودي',
        persons_count: 2,
        special_needs: false,
        status: 'CONFIRMED',
        appointment_id: 'app_sample',
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-8812',
        qr_token: 'demo_token_8812',
        created_at: new Date().toISOString(),
        appointment: {
          date: new Date().toISOString().split('T')[0],
          start_time: '08:00',
          end_time: '10:00',
          notes: 'فترة الصباح الثانية (08:00 ص - 10:00 ص)'
        }
      }
    ]
  };

  localStorage.setItem('alhijr_demo_db', JSON.stringify(initialDb));
  return initialDb;
}

function saveDemoDb(db) {
  localStorage.setItem('alhijr_demo_db', JSON.stringify(db));
}

function ensureDemoAppointments(db) {
  if (!db.appointments) db.appointments = [];

  const defaultSlots = [
    { start: '06:00', end: '08:00', name: 'فترة الصباح الأولى (06:00 ص - 08:00 ص)' },
    { start: '08:00', end: '10:00', name: 'فترة الصباح الثانية (08:00 ص - 10:00 ص)' },
    { start: '10:00', end: '12:00', name: 'فترة قبل الظهر (10:00 ص - 12:00 م)' },
    { start: '13:00', end: '15:00', name: 'فترة بعد الظهر (01:00 م - 03:00 م)' },
    { start: '16:00', end: '18:00', name: 'فترة العصر (04:00 م - 06:00 م)' },
    { start: '22:00', end: '00:00', name: 'فترة المساء (10:00 م - 12:00 ص)' },
    { start: '00:00', end: '02:00', name: 'فترة منتصف الليل (12:00 ص - 02:00 ص)' }
  ];

  const now = new Date();
  let changed = false;

  for (let i = 0; i < 14; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 12, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    const exists = db.appointments.some(a => a.date === dateStr);
    if (!exists) {
      const daySlots = defaultSlots.map((s, idx) => ({
        id: `app_${dateStr}_${s.start.replace(':', '')}`,
        date: dateStr,
        start_time: s.start,
        end_time: s.end,
        capacity: 40,
        booked_count: (i === 0 && idx === 0) ? 40 : (i === 0 && idx === 1 ? 15 : 0),
        is_active: true,
        notes: s.name
      }));
      db.appointments.push(...daySlots);
      changed = true;
    }
  }

  if (changed) {
    saveDemoDb(db);
  }
}

function getDemoSlotsForDate(dateStr) {
  const db = getDemoDb();
  ensureDemoAppointments(db);
  const slots = db.appointments.filter(a => a.date === dateStr);
  return slots.map(app => {
    const remaining = Math.max(0, app.capacity - (app.booked_count || 0));
    return {
      ...app,
      remaining_capacity: remaining,
      remaining_seats: remaining,
      status: !app.is_active ? 'UNAVAILABLE' : (remaining <= 0 ? 'FULL' : 'AVAILABLE')
    };
  });
}

async function handleClientDemoApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const db = getDemoDb();
  ensureDemoAppointments(db);
  let body = {};
  if (options.body) {
    try { body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body; } catch (e) {}
  }

  // 1a. GET /appointments/available-dates (جلب قائمة الأيام المتاحة للحجز)
  if (endpoint.startsWith('/appointments/available-dates') && method === 'GET') {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const datesMap = {};
    db.appointments.forEach(app => {
      if (app.date >= todayStr) {
        if (!datesMap[app.date]) {
          datesMap[app.date] = {
            date: app.date,
            total_slots: 0,
            available_slots: 0
          };
        }
        datesMap[app.date].total_slots += 1;
        const remaining = Math.max(0, app.capacity - (app.booked_count || 0));
        if (app.is_active && remaining > 0) {
          datesMap[app.date].available_slots += 1;
        }
      }
    });

    const dates = Object.values(datesMap).sort((a, b) => a.date.localeCompare(b.date));
    return { success: true, dates };
  }

  // 1b. GET /appointments (جلب فترات يوم محدد أو جميع المواعيد)
  if (endpoint.startsWith('/appointments') && method === 'GET') {
    const url = new URL('http://dummy' + endpoint);
    const dateStr = url.searchParams.get('date');
    const isAll = url.searchParams.get('all') === 'true';

    let list = db.appointments;
    if (dateStr) {
      list = list.filter(a => a.date === dateStr);
    } else if (!isAll) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      list = list.filter(a => a.date === todayStr);
    }

    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      const getHourSort = (t) => {
        const h = parseInt((t || '00:00').split(':')[0], 10);
        return h < 6 ? h + 24 : h;
      };
      return getHourSort(a.start_time) - getHourSort(b.start_time);
    });

    const appointments = list.map(app => {
      const remaining = Math.max(0, app.capacity - (app.booked_count || 0));
      return {
        ...app,
        remaining_capacity: remaining,
        remaining_seats: remaining,
        status: !app.is_active ? 'UNAVAILABLE' : (remaining <= 0 ? 'FULL' : 'AVAILABLE')
      };
    });

    return { success: true, count: appointments.length, appointments };
  }

  // 2. POST /bookings
  if (endpoint === '/bookings' && method === 'POST') {
    const { appointment_id, full_name, phone, national_id, nationality, persons_count, special_needs } = body;
    const count = parseInt(persons_count, 10) || 1;

    let app = db.appointments.find(a => a.id === appointment_id);
    if (!app) {
      app = { id: appointment_id, date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '10:00', capacity: 40, booked_count: 0, notes: 'فترة الصباح الثانية' };
      db.appointments.push(app);
    }

    const duplicate = db.bookings.find(b => b.national_id === national_id && b.status === 'CONFIRMED' && b.appointment?.date === app.date);
    if (duplicate) {
      throw new Error(`يوجد حجز مؤكد مسبقاً بنفس رقم الهوية (${national_id}) في نفس هذا اليوم.`);
    }

    const ref = `HJ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = `alhijr_${ref}_${Date.now()}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrToken)}`;

    app.booked_count = (app.booked_count || 0) + count;

    const newBooking = {
      id: `bk_${Date.now()}`,
      booking_ref: ref,
      appointment_id,
      national_id,
      phone,
      full_name,
      nationality: nationality || 'سعودي',
      persons_count: count,
      special_needs: !!special_needs,
      status: 'CONFIRMED',
      qr_token: qrToken,
      qr_image: qrUrl,
      created_at: new Date().toISOString(),
      appointment: { ...app }
    };

    db.bookings.unshift(newBooking);
    saveDemoDb(db);
    return { success: true, message: 'تم تأكيد الحجز بنجاح!', booking: newBooking };
  }

  // 3. GET /bookings/:ref
  if (endpoint.startsWith('/bookings/') && !endpoint.includes('inquire') && !endpoint.includes('cancel') && method === 'GET') {
    const ref = endpoint.replace('/bookings/', '').split('?')[0];
    const b = db.bookings.find(x => x.booking_ref.toUpperCase() === ref.toUpperCase());
    if (!b) throw new Error('لم يتم العثور على التذكرة أو الحجز.');
    return { success: true, booking: b };
  }

  // 4. GET /bookings/inquire
  if (endpoint.startsWith('/bookings/inquire') && method === 'GET') {
    const url = new URL('http://dummy' + endpoint);
    const phone = url.searchParams.get('phone');
    const ref = (url.searchParams.get('ref') || '').toUpperCase();
    const b = db.bookings.find(x => x.phone === phone && x.booking_ref.toUpperCase() === ref);
    if (!b) throw new Error('لم يتم العثور على أي حجز مطابق لبيانات الاستعلام المدخلة.');
    return { success: true, booking: b };
  }

  // 5. POST /bookings/:ref/cancel
  if (endpoint.includes('/cancel') && method === 'POST') {
    const parts = endpoint.split('/');
    const ref = parts[2];
    const b = db.bookings.find(x => x.booking_ref.toUpperCase() === (ref || '').toUpperCase());
    if (!b) throw new Error('الحجز غير موجود.');
    b.status = 'CANCELLED';
    saveDemoDb(db);
    return { success: true, message: 'تم إلغاء الحجز بنجاح واستعادة المقاعد للنظام.' };
  }

  // 6. POST /auth/login
  if (endpoint === '/auth/login' && method === 'POST') {
    const { username, password } = body;
    if (username === 'admin' && password === 'admin123') {
      const u = { id: 'usr_admin_01', username: 'admin', full_name: 'ماجد محسن الشهري (المدير العام)', role: 'ADMIN' };
      return { success: true, token: 'demo-admin-token', user: u };
    }
    if (username === 'staff' && password === 'staff123') {
      const u = { id: 'usr_staff_01', username: 'staff', full_name: 'فهد الغامدي (مشرف الدخول والتفويج)', role: 'STAFF' };
      return { success: true, token: 'demo-staff-token', user: u };
    }
    const found = db.users.find(u => u.username === username);
    if (found) {
      return { success: true, token: 'demo-token-' + found.id, user: found };
    }
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  // 7. GET /auth/users
  if (endpoint.startsWith('/auth/users') && method === 'GET') {
    return { success: true, users: db.users };
  }

  // 8. POST /auth/users
  if (endpoint === '/auth/users' && method === 'POST') {
    const newUser = {
      id: 'usr_' + Date.now(),
      username: body.username,
      full_name: body.full_name,
      role: body.role || 'STAFF',
      is_active: true,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDemoDb(db);
    return { success: true, message: 'تمت إضافة المشرف بنجاح.', user: newUser };
  }

  // 9. DELETE /auth/users/:id
  if (endpoint.startsWith('/auth/users/') && method === 'DELETE') {
    const uid = endpoint.replace('/auth/users/', '');
    db.users = db.users.filter(u => u.id !== uid);
    saveDemoDb(db);
    return { success: true, message: 'تم حذف المستخدم بنجاح.' };
  }

  // 10. POST /qr/verify
  if (endpoint === '/qr/verify' && method === 'POST') {
    const token = body.token || '';
    const b = db.bookings.find(x => x.qr_token === token || x.booking_ref.toUpperCase() === token.toUpperCase());
    if (!b) throw new Error('رمز QR غير صالح أو غير مسجل في النظام.');
    if (b.status === 'USED') {
      return { success: true, valid: false, code: 'ALREADY_USED', message: 'تم استخدام هذه التذكرة مسبقاً!', booking: b };
    }
    if (b.status === 'CANCELLED') {
      return { success: true, valid: false, code: 'CANCELLED', message: 'هذا الحجز ملغى مسبقاً.', booking: b };
    }
    return { success: true, valid: true, code: 'VALID', message: 'التصريح صالح ومؤكد لدخول الحِجر ✓', booking: b };
  }

  // 11. POST /qr/checkin
  if (endpoint === '/qr/checkin' && method === 'POST') {
    const token = body.token || '';
    const b = db.bookings.find(x => x.qr_token === token || x.booking_ref.toUpperCase() === token.toUpperCase());
    if (!b) throw new Error('الحجز غير موجود.');
    b.status = 'USED';
    b.used_at = new Date().toISOString();
    saveDemoDb(db);
    return { success: true, message: 'تم تسجيل الدخول بنجاح.', booking: b };
  }

  // 12. GET /reports/dashboard
  if (endpoint.startsWith('/reports/dashboard')) {
    const totalBookings = db.bookings.length;
    const totalEntries = db.bookings.filter(b => b.status === 'USED').length;
    const activeBookings = db.bookings.filter(b => b.status === 'CONFIRMED').length;
    return {
      success: true,
      summary: {
        total_bookings: totalBookings,
        total_visitors: db.bookings.reduce((sum, b) => sum + (b.persons_count || 1), 0),
        total_entries: totalEntries,
        active_bookings: activeBookings,
        total_appointments: db.appointments.length || 7
      },
      today_stats: {
        slots_count: 7,
        total_capacity: 280,
        booked_seats: 40,
        remaining_seats: 240
      },
      chart_data: [
        { label: '06:00 ص - 08:00 ص', booked: 40, capacity: 40 },
        { label: '08:00 ص - 10:00 ص', booked: 32, capacity: 40 },
        { label: '10:00 ص - 12:00 م', booked: 18, capacity: 40 },
        { label: '01:00 م - 03:00 م', booked: 25, capacity: 40 },
        { label: '04:00 م - 06:00 م', booked: 38, capacity: 40 },
        { label: '10:00 م - 12:00 ص', booked: 40, capacity: 40 },
        { label: '12:00 ص - 02:00 ص', booked: 20, capacity: 40 }
      ]
    };
  }

  return { success: true };
}

// تنسيق التاريخ واليوم بالعربية
function formatDateArabic(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ar-SA', options);
}

// تحويل وتنسيق الوقت بصيغة 12 ساعة عربية واضحة (مثال: 06:00 ص أو 10:00 م)
function formatTime12(timeStr) {
  if (!timeStr) return '';
  if (timeStr.includes('ص') || timeStr.includes('م')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  if (h === 0 || h === 24) return `12:${m} ص`;
  if (h === 12) return `12:${m} م`;
  if (h > 12) return `${String(h - 12).padStart(2, '0')}:${m} م`;
  return `${String(h).padStart(2, '0')}:${m} ص`;
}

// تنسيق مدى فترة الموعد (ساعتان)
function formatSlotRange(start, end) {
  if (!start) return '-';
  if (!end) return formatTime12(start);
  return `${formatTime12(start)} - ${formatTime12(end)}`;
}

// ترجمة شارات الحالة
function getStatusBadge(status) {
  const map = {
    CONFIRMED: { text: 'مؤكد ✓', class: 'badge-success' },
    USED: { text: 'مستخدم (تم الدخول)', class: 'badge-warning' },
    CANCELLED: { text: 'ملغى ✕', class: 'badge-danger' },
    EXPIRED: { text: 'منتهي الصلاحية', class: 'badge-danger' },
    AVAILABLE: { text: 'متاح', class: 'badge-success' },
    FULL: { text: 'مكتمل', class: 'badge-danger' },
    UNAVAILABLE: { text: 'غير متاح', class: 'badge-warning' }
  };
  const item = map[status] || { text: status, class: 'badge-info' };
  return `<span class="badge ${item.class}">${item.text}</span>`;
}

// إدارة جلسة المستخدم
function getCurrentUser() {
  const userJson = localStorage.getItem('alhijr_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

function logout() {
  localStorage.removeItem('alhijr_auth_token');
  localStorage.removeItem('alhijr_user');
  window.location.href = 'login.html';
}

// إدارة سمة المظهر (Dark / Light Mode)
function initTheme() {
  const saved = localStorage.getItem('alhijr_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('alhijr_theme', next);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('btn-toggle-theme');
  if (btn) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
  }
}

// توليد مؤثرات صوتية نظيفة بواسطة Web Audio API للماسح
function playSound(type = 'success') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      // نغمة نجاح مزدوجة متصاعدة وجميلة
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc2.frequency.setValueAtTime(1046, ctx.currentTime + 0.1); // C6

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.12);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === 'warning') {
      // نغمة تنبيه دافئة
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // نغمة خطأ
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

// تنزيل التذكرة كصورة PNG عبر Canvas
function downloadTicketCanvas(ref, name, date, time, persons, qrImgSrc) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');

  // الخلفية
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // رأس التذكرة الزمردي
  ctx.fillStyle = '#0D3B2E';
  ctx.fillRect(0, 0, canvas.width, 160);

  // شريط الذهب
  ctx.fillStyle = '#C5A059';
  ctx.fillRect(0, 156, canvas.width, 6);

  // نصوص الترويسة
  ctx.fillStyle = '#DFC185';
  ctx.font = 'bold 18px Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('تذكرة إلكترونية رسمية', canvas.width / 2, 40);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px Tahoma, sans-serif';
  ctx.fillText('حِجر إسماعيل - المسجد الحرام', canvas.width / 2, 80);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect((canvas.width - 220) / 2, 100, 220, 38);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(ref || 'HJ-2026-0000', canvas.width / 2, 126);

  // صورة الـ QR
  const qrImg = new Image();
  qrImg.crossOrigin = 'anonymous';
  qrImg.onload = () => {
    ctx.drawImage(qrImg, (canvas.width - 220) / 2, 190, 220, 220);

    ctx.fillStyle = '#0D3B2E';
    ctx.font = 'bold 16px Tahoma, sans-serif';
    ctx.fillText('امسح الرمز عند نقطة الدخول', canvas.width / 2, 435);

    // خط فاصل متقطع
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 460);
    ctx.lineTo(570, 460);
    ctx.stroke();
    ctx.setLineDash([]);

    // تفاصيل الحجز
    ctx.textAlign = 'right';
    const drawRow = (label, val, y) => {
      ctx.fillStyle = '#64748B';
      ctx.font = '15px Tahoma, sans-serif';
      ctx.fillText(label, 540, y);
      ctx.fillStyle = '#0D3B2E';
      ctx.font = 'bold 17px Tahoma, sans-serif';
      ctx.fillText(val, 320, y);
    };

    drawRow('اسم صاحب الحجز:', name || '-', 500);
    drawRow('تاريخ الزيارة:', date || '-', 540);
    drawRow('فترة الدخول:', time || '-', 580);
    drawRow('عدد الأفراد:', `${persons || 1} أفراد`, 620);
    drawRow('حالة التذكرة:', 'مؤكد ومصرح ✓', 660);

    // تنبيه بالأسفل
    ctx.fillStyle = '#FFFBEB';
    ctx.fillRect(30, 690, 540, 60);
    ctx.strokeStyle = '#FDE68A';
    ctx.strokeRect(30, 690, 540, 60);

    ctx.fillStyle = '#92400E';
    ctx.font = '12px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('يرجى الحضور قبل الموعد بـ 15 دقيقة وإبراز هذا الرمز لموظف التفويج.', canvas.width / 2, 725);

    // بدء التحميل
    const link = document.createElement('a');
    link.download = `alhijr-ticket-${ref}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('تم تحميل التذكرة كصورة بنجاح!', 'success');
  };
  qrImg.src = qrImgSrc;
}

// تفعيل قائمة الجوال وتهيئة المظهر
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('show');
    });
  }

  // إضافة زر المظهر في الهيدر إن وجد
  const themeBtn = document.getElementById('btn-toggle-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // تسجيل Service Worker لتحسين الأداء على أجهزة الجوال
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});
