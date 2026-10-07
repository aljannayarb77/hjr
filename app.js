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
// محاكي الـ API التفاعلي وقاعدة البيانات المتكاملة (للتشغيل المباشر على GitHub Pages)
// ============================================================================

function getDefaultDatabase() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const tmrw = new Date(today);
  tmrw.setDate(today.getDate() + 1);
  const tmrwStr = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;

  return {
    users: [
      { id: 'usr_admin_01', username: 'admin', full_name: 'ماجد محسن الشهري (المدير العام)', role: 'ADMIN', is_active: true, email: 'admin@alhijr.local', created_at: '2026-10-06T17:00:00.000Z' },
      { id: 'usr_staff_01', username: 'staff', full_name: 'فهد الغامدي (مشرف الدخول والتفويج)', role: 'STAFF', is_active: true, email: 'staff@alhijr.local', created_at: '2026-10-06T17:00:00.000Z' }
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
        appointment_id: `app_${todayStr}_0800`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-8812',
        qr_token: 'HJ-V1-8812-moroj-ghamdi',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '08:00',
          end_time: '10:00',
          notes: 'فترة الصباح الثانية (08:00 ص - 10:00 ص)'
        }
      },
      {
        id: 'bk_demo_01',
        booking_ref: 'HJ-2026-1001',
        national_id: '1088765432',
        phone: '0555123456',
        full_name: 'محمد عبدالله باوزير',
        nationality: 'سعودي',
        persons_count: 2,
        special_needs: false,
        status: 'CONFIRMED',
        appointment_id: `app_${todayStr}_2200`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-1001',
        qr_token: 'HJ-V1-39f432eca0560844-e5d85021702d69ca',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '22:00',
          end_time: '00:00',
          notes: 'فترة المساء (10:00 م - 12:00 ص)'
        }
      },
      {
        id: 'bk_demo_02',
        booking_ref: 'HJ-2026-1002',
        national_id: '1099887766',
        phone: '0501239876',
        full_name: 'أحمد إبراهيم الدوسري',
        nationality: 'سعودي',
        persons_count: 1,
        special_needs: false,
        status: 'USED',
        used_at: new Date(Date.now() - 14400000).toISOString(),
        appointment_id: `app_${todayStr}_0600`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-1002',
        qr_token: 'HJ-V1-61a79cb698e8f45d-167cfe1eb02103cc',
        created_at: new Date(Date.now() - 28800000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '06:00',
          end_time: '08:00',
          notes: 'فترة الصباح الأولى (06:00 ص - 08:00 ص)'
        }
      },
      {
        id: 'bk_demo_03',
        booking_ref: 'HJ-2026-1003',
        national_id: '1044556677',
        phone: '0567890123',
        full_name: 'فهد سالم العتيبي',
        nationality: 'سعودي',
        persons_count: 3,
        special_needs: false,
        status: 'CANCELLED',
        cancelled_at: new Date(Date.now() - 18000000).toISOString(),
        appointment_id: `app_${todayStr}_1000`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-1003',
        qr_token: 'HJ-V1-2b21d5d10115b40d-836186c870ace34b',
        created_at: new Date(Date.now() - 36000000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '10:00',
          end_time: '12:00',
          notes: 'فترة قبل الظهر (10:00 ص - 12:00 م)'
        }
      },
      {
        id: 'bk_demo_04',
        booking_ref: 'HJ-2026-1004',
        national_id: '2033445566',
        phone: '0544332211',
        full_name: 'عمر خالد المنصوري',
        nationality: 'إماراتي',
        persons_count: 1,
        special_needs: false,
        status: 'CONFIRMED',
        appointment_id: `app_${tmrwStr}_1300`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-1004',
        qr_token: 'HJ-V1-bf5a482b4fe67b54-de98f789aa72025a',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        appointment: {
          date: tmrwStr,
          start_time: '13:00',
          end_time: '15:00',
          notes: 'فترة بعد الظهر (01:00 م - 03:00 م)'
        }
      },
      {
        id: 'bk_6ef6a661',
        booking_ref: 'HJ-2026-6041',
        national_id: '1122334455',
        phone: '0599112233',
        full_name: 'سالم أحمد المحمدي',
        nationality: 'سعودي',
        persons_count: 2,
        special_needs: false,
        status: 'USED',
        used_at: new Date(Date.now() - 7200000).toISOString(),
        appointment_id: `app_${todayStr}_0600`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-6041',
        qr_token: 'HJ-V1-e127489fabcce7a0-0e413886a339ef23',
        created_at: new Date(Date.now() - 25000000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '06:00',
          end_time: '08:00',
          notes: 'فترة الصباح الأولى (06:00 ص - 08:00 ص)'
        }
      },
      {
        id: 'bk_915d37fc',
        booking_ref: 'HJ-2026-3213',
        national_id: '1555555555',
        phone: '0577777777',
        full_name: 'طارق عبدالكريم',
        nationality: 'سعودي',
        persons_count: 1,
        special_needs: false,
        status: 'CANCELLED',
        cancelled_at: new Date(Date.now() - 10000000).toISOString(),
        appointment_id: `app_${todayStr}_0600`,
        qr_image: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=HJ-2026-3213',
        qr_token: 'HJ-V1-6ed2e4add9f12ae3-cbf5616aeac197b2',
        created_at: new Date(Date.now() - 20000000).toISOString(),
        appointment: {
          date: todayStr,
          start_time: '06:00',
          end_time: '08:00',
          notes: 'فترة الصباح الأولى (06:00 ص - 08:00 ص)'
        }
      }
    ],
    audit_logs: [
      { id: 'log_01', actor: 'ماجد محسن الشهري (ADMIN)', action: 'UPDATE_SETTINGS', entity_type: 'settings', entity_id: 'global', details: 'تحديث إعدادات المنصة الرسمية', timestamp: '2026-10-06T21:16:00.000Z' },
      { id: 'log_02', actor: 'ماجد محسن الشهري (ADMIN)', action: 'USER_LOGIN', entity_type: 'user', entity_id: 'usr_admin_01', details: 'تسجيل دخول المدير العام', timestamp: '2026-10-06T21:15:00.000Z' },
      { id: 'log_03', actor: 'فهد الغامدي (STAFF)', action: 'CHECK_IN_SUCCESS', entity_type: 'booking', entity_id: 'bk_demo_02', details: 'تسجيل دخول الزائر أحمد إبراهيم الدوسري عبر ماسح QR', timestamp: '2026-10-06T15:00:00.000Z' },
      { id: 'log_04', actor: 'فهد الغامدي (STAFF)', action: 'CHECK_IN_SUCCESS', entity_type: 'booking', entity_id: 'bk_6ef6a661', details: 'تسجيل دخول الزائر سالم أحمد المحمدي ومرافقيه (2)', timestamp: '2026-10-06T17:00:00.000Z' },
      { id: 'log_05', actor: 'الزائر', action: 'CREATE_BOOKING', entity_type: 'booking', entity_id: 'bk_sample_01', details: 'إنشاء حجز جديد HJ-2026-8812 باسم مروج يعقوب الغامدي', timestamp: '2026-10-06T16:00:00.000Z' },
      { id: 'log_06', actor: 'الزائر', action: 'CANCEL_BOOKING', entity_type: 'booking', entity_id: 'bk_demo_03', details: 'إلغاء الحجز HJ-2026-1003 للزائر فهد سالم العتيبي', timestamp: '2026-10-06T13:00:00.000Z' },
      { id: 'log_07', actor: 'النظام', action: 'SYSTEM_INITIALIZATION', entity_type: 'system', entity_id: 'init', details: 'تهيئة قاعدة بيانات منصة الحِجر بنجاح', timestamp: '2026-10-06T12:00:00.000Z' }
    ],
    settings: {
      platform_name: 'منصة تنظيم مواعيد دخول الحِجر',
      platform_subtitle: 'نظام حجز إلكتروني مستقل لتنظيم مواعيد الزيارة بسلاسة وأمان',
      disclaimer: 'تنبيه تنظيمي: هذه منصة حجز مستقلة لتنظيم المواعيد والتفويج وليست جهة حكومية رسمية، ولا تُعد بديلاً عن التصاريح الرسمية المعتمدة من الجهات المختصة.',
      contact_phone: '920000000',
      contact_email: 'support@alhijr-booking.local',
      max_persons_per_booking: 7,
      allow_cancellation: true,
      cancellation_hours_before: 2,
      default_slot_capacity: 40,
      instructions_text: 'يرجى الحضور قبل الموعد بـ 15 دقيقة، وإبراز التذكرة الإلكترونية والرمز QR لموظف التنظيم عند البوابة، والالتزام بالزي المناسب والهدوء داخل الحرم الشريف.'
    }
  };
}

function getDemoDb() {
  let dbStr = localStorage.getItem('alhijr_demo_db');
  if (dbStr) {
    try {
      const parsed = JSON.parse(dbStr);
      if (parsed && Array.isArray(parsed.bookings) && parsed.bookings.length >= 6) {
        return parsed;
      }
    } catch (e) {}
  }

  const initialDb = getDefaultDatabase();
  ensureDemoAppointments(initialDb);
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
  if (endpoint.startsWith('/appointments') && !endpoint.includes('bulk-generate') && method === 'GET') {
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

  // 1c. PUT /appointments/:id (تعديل موعد أو تبديل حالته)
  if (endpoint.startsWith('/appointments/') && method === 'PUT') {
    const id = endpoint.replace('/appointments/', '').split('?')[0];
    const app = db.appointments.find(a => a.id === id);
    if (app) {
      if (body.capacity !== undefined) app.capacity = parseInt(body.capacity, 10);
      if (body.is_active !== undefined) app.is_active = !!body.is_active;
      else app.is_active = !app.is_active;
      saveDemoDb(db);
    }
    return { success: true, message: 'تم تحديث الموعد بنجاح.' };
  }

  // 1d. DELETE /appointments/:id (حذف موعد)
  if (endpoint.startsWith('/appointments/') && method === 'DELETE') {
    const id = endpoint.replace('/appointments/', '').split('?')[0];
    db.appointments = db.appointments.filter(a => a.id !== id);
    saveDemoDb(db);
    return { success: true, message: 'تم حذف الموعد بنجاح.' };
  }

  // 1e. POST /appointments (إضافة موعد جديد)
  if (endpoint === '/appointments' && method === 'POST') {
    const newApp = {
      id: `app_${body.date}_${(body.start_time || '00:00').replace(':', '')}`,
      date: body.date,
      start_time: body.start_time,
      end_time: body.end_time,
      capacity: parseInt(body.capacity, 10) || 40,
      booked_count: 0,
      is_active: body.is_active !== undefined ? !!body.is_active : true,
      notes: body.notes || 'فترة دخول الحِجر'
    };
    db.appointments.push(newApp);
    saveDemoDb(db);
    return { success: true, message: 'تمت إضافة الموعد بنجاح.', appointment: newApp };
  }

  // 1f. POST /appointments/bulk-generate (توليد مواعيد مجمعة)
  if (endpoint.includes('/bulk-generate') && method === 'POST') {
    return { success: true, message: 'تم توليد المواعيد بنجاح.' };
  }

  // 2a. POST /bookings/lookup (الاستعلام عن الحجز عبر inquiry.js)
  if (endpoint.startsWith('/bookings/lookup') && method === 'POST') {
    const ref = (body.booking_ref || '').trim().toUpperCase();
    const phone = (body.phone || '').trim();
    const b = db.bookings.find(x => x.booking_ref.toUpperCase() === ref && x.phone === phone);
    if (!b) throw new Error('لم يتم العثور على أي حجز مطابق لبيانات الاستعلام المدخلة.');
    return { success: true, booking: b };
  }

  // 2b. GET /bookings (قائمة الحجوزات للوحة التحكم مع الفلترة والبحث والترقيم)
  if ((endpoint.startsWith('/bookings?') || endpoint === '/bookings') && method === 'GET') {
    const url = new URL('http://dummy' + endpoint);
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date');
    const page = parseInt(url.searchParams.get('page'), 10) || 1;
    const limit = parseInt(url.searchParams.get('limit'), 10) || 15;

    let filtered = [...db.bookings];

    if (search) {
      filtered = filtered.filter(b => 
        (b.booking_ref && b.booking_ref.toLowerCase().includes(search)) ||
        (b.full_name && b.full_name.toLowerCase().includes(search)) ||
        (b.national_id && b.national_id.includes(search)) ||
        (b.phone && b.phone.includes(search))
      );
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter(b => b.status === status);
    }

    if (date) {
      filtered = filtered.filter(b => b.appointment && b.appointment.date === date);
    }

    const total = filtered.length;
    const total_pages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    return {
      success: true,
      total,
      page,
      limit,
      total_pages,
      bookings: paged
    };
  }

  // 2c. POST /bookings (إنشاء حجز جديد)
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
    db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      actor: 'الزائر',
      action: 'CREATE_BOOKING',
      entity_type: 'booking',
      entity_id: newBooking.id,
      details: `إنشاء حجز جديد ${newBooking.booking_ref} باسم ${newBooking.full_name} (${newBooking.persons_count} أفراد)`,
      timestamp: new Date().toISOString()
    });
    saveDemoDb(db);
    return { success: true, message: 'تم تأكيد الحجز بنجاح!', booking: newBooking };
  }

  // 2d. GET /bookings/:ref (عرض تفاصيل التذكرة الفردية)
  if (endpoint.startsWith('/bookings/') && !endpoint.includes('inquire') && !endpoint.includes('cancel') && !endpoint.includes('lookup') && !endpoint.includes('manual-checkin') && !endpoint.includes('resend-ticket') && method === 'GET') {
    const ref = endpoint.replace('/bookings/', '').split('?')[0];
    const b = db.bookings.find(x => x.booking_ref.toUpperCase() === ref.toUpperCase() || x.id === ref);
    if (!b) throw new Error('لم يتم العثور على التذكرة أو الحجز.');
    return { success: true, booking: b };
  }

  // 2e. POST /bookings/:id/manual-checkin (تسجيل دخول يدوي)
  if (endpoint.includes('/manual-checkin') && method === 'POST') {
    const parts = endpoint.split('/');
    const id = parts[2];
    const b = db.bookings.find(x => x.id === id || x.booking_ref.toUpperCase() === (id || '').toUpperCase());
    if (!b) throw new Error('الحجز غير موجود.');
    b.status = 'USED';
    b.used_at = new Date().toISOString();
    db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      actor: 'إدارة النظام (ADMIN)',
      action: 'MANUAL_CHECKIN',
      entity_type: 'booking',
      entity_id: b.id,
      details: `تسجيل دخول يدوي للزائر ${b.full_name} (${b.booking_ref})`,
      timestamp: new Date().toISOString()
    });
    saveDemoDb(db);
    return { success: true, message: 'تم تسجيل دخول الزائر بنجاح ✓', booking: b };
  }

  // 2f. POST /bookings/:id/cancel (إلغاء حجز)
  if (endpoint.includes('/cancel') && method === 'POST') {
    const parts = endpoint.split('/');
    const id = parts[2];
    const b = db.bookings.find(x => x.id === id || x.booking_ref.toUpperCase() === (id || '').toUpperCase());
    if (!b) throw new Error('الحجز غير موجود.');
    b.status = 'CANCELLED';
    b.cancelled_at = new Date().toISOString();
    db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      actor: 'إدارة النظام / الزائر',
      action: 'CANCEL_BOOKING',
      entity_type: 'booking',
      entity_id: b.id,
      details: `إلغاء الحجز ${b.booking_ref} باسم ${b.full_name}`,
      timestamp: new Date().toISOString()
    });
    saveDemoDb(db);
    return { success: true, message: 'تم إلغاء الحجز بنجاح واستعادة المقاعد للنظام.' };
  }

  // 2g. POST /bookings/:id/resend-ticket
  if (endpoint.includes('/resend-ticket') && method === 'POST') {
    return { success: true, message: 'تمت إعادة إرسال إشعار التذكرة بنجاح إلى رقم الجوال.' };
  }

  // 3. POST /auth/login (تسجيل دخول المشرفين)
  if (endpoint === '/auth/login' && method === 'POST') {
    const { username, password } = body;
    if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
      const u = { id: 'usr_admin_01', username: 'admin', full_name: 'ماجد محسن الشهري (المدير العام)', role: 'ADMIN' };
      return { success: true, token: 'demo-admin-token', user: u };
    }
    if (username === 'staff' && (password === 'staff123' || password === 'staff')) {
      const u = { id: 'usr_staff_01', username: 'staff', full_name: 'فهد الغامدي (مشرف الدخول والتفويج)', role: 'STAFF' };
      return { success: true, token: 'demo-staff-token', user: u };
    }
    const found = db.users.find(u => u.username === username);
    if (found) {
      return { success: true, token: 'demo-token-' + found.id, user: found };
    }
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
  }

  // 4a. GET /auth/users (قائمة المشرفين)
  if (endpoint.startsWith('/auth/users') && method === 'GET') {
    return { success: true, users: db.users };
  }

  // 4b. POST /auth/users (إضافة مشرف)
  if (endpoint === '/auth/users' && method === 'POST') {
    const newUser = {
      id: 'usr_' + Date.now(),
      username: body.username,
      full_name: body.full_name,
      role: body.role || 'STAFF',
      email: body.email || `${body.username}@alhijr.local`,
      is_active: true,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDemoDb(db);
    return { success: true, message: 'تمت إضافة المشرف بنجاح.', user: newUser };
  }

  // 4c. DELETE /auth/users/:id (حذف مشرف)
  if (endpoint.startsWith('/auth/users/') && method === 'DELETE') {
    const uid = endpoint.replace('/auth/users/', '');
    db.users = db.users.filter(u => u.id !== uid);
    saveDemoDb(db);
    return { success: true, message: 'تم حذف المستخدم بنجاح.' };
  }

  // 5a. POST /qr/verify (التحقق من رمز QR)
  if (endpoint === '/qr/verify' && method === 'POST') {
    const raw = (body.qr_data || body.token || '').trim();
    const b = db.bookings.find(x => 
      x.qr_token === raw || 
      x.booking_ref.toUpperCase() === raw.toUpperCase() ||
      raw.includes(x.booking_ref) ||
      (x.qr_token && raw.includes(x.qr_token))
    );
    if (!b) throw new Error('رمز QR غير صالح أو غير مسجل في السجلات.');
    
    let code = 'VALID';
    let message = 'التصريح صالح ومؤكد لدخول الحِجر ✓';
    if (b.status === 'USED') {
      code = 'ALREADY_USED';
      message = 'تم استخدام هذه التذكرة مسبقاً والدخول بها!';
    } else if (b.status === 'CANCELLED') {
      code = 'CANCELLED';
      message = 'هذا الحجز ملغى مسبقاً من قبل الإدارة أو الزائر.';
    }

    const resObj = {
      valid: b.status === 'CONFIRMED',
      code,
      message,
      booking: b
    };
    return { success: true, valid: b.status === 'CONFIRMED', result: resObj, booking: b };
  }

  // 5b. POST /qr/check-in & /qr/checkin (تسجيل الدخول عند البوابة)
  if ((endpoint === '/qr/check-in' || endpoint === '/qr/checkin') && method === 'POST') {
    const id = body.booking_id || body.token || '';
    const b = db.bookings.find(x => x.id === id || x.qr_token === id || x.booking_ref.toUpperCase() === id.toUpperCase());
    if (!b) throw new Error('الحجز غير موجود.');
    b.status = 'USED';
    b.used_at = new Date().toISOString();
    db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      actor: 'فهد الغامدي (مشرف البوابة)',
      action: 'CHECK_IN_SUCCESS',
      entity_type: 'booking',
      entity_id: b.id,
      details: `تسجيل دخول وتفويج الزائر ${b.full_name} (${b.persons_count} أفراد)`,
      timestamp: new Date().toISOString()
    });
    saveDemoDb(db);
    return { success: true, message: 'تم تسجيل الدخول بنجاح.', booking: b };
  }

  // 6. GET /reports/dashboard (إحصائيات لوحة التحكم)
  if (endpoint.startsWith('/reports/dashboard')) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const totalBookings = db.bookings.length;
    let todayBookings = 0;
    let confirmedCount = 0;
    let usedCount = 0;
    let cancelledCount = 0;
    let totalPersonsServed = 0;

    const appointmentsMap = {};
    let totalCapacity = 0;
    let fullSlotsCount = 0;

    (db.appointments || []).forEach(a => {
      appointmentsMap[a.id] = a;
      totalCapacity += (a.capacity || 0);
      const rem = (a.capacity || 0) - (a.booked_count || 0);
      if (rem <= 0) fullSlotsCount++;
    });

    db.bookings.forEach(b => {
      const app = b.appointment || appointmentsMap[b.appointment_id];
      if (app && app.date === todayStr) {
        todayBookings++;
      }
      if (b.status === 'CONFIRMED') confirmedCount++;
      else if (b.status === 'USED') {
        usedCount++;
        totalPersonsServed += (b.persons_count || 1);
      } else if (b.status === 'CANCELLED') {
        cancelledCount++;
      }
    });

    const activeBookingsCount = confirmedCount + usedCount;
    const occupancyRate = totalCapacity > 0 
      ? Math.round((activeBookingsCount / totalCapacity) * 100) 
      : (totalBookings > 0 ? Math.round((activeBookingsCount / (totalBookings * 2 || 1)) * 100) : 0);

    // تجميع الحجوزات للأيام السبعة القادمة للرسم البياني
    const next7Days = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      next7Days[dStr] = { date: dStr, bookings: 0, capacity: 0 };
    }

    (db.appointments || []).forEach(a => {
      if (next7Days[a.date]) {
        next7Days[a.date].capacity += (a.capacity || 0);
      }
    });

    db.bookings.forEach(b => {
      const app = b.appointment || appointmentsMap[b.appointment_id];
      if (app && next7Days[app.date] && ['CONFIRMED', 'USED'].includes(b.status)) {
        next7Days[app.date].bookings += (b.persons_count || 1);
      }
    });

    const statsObj = {
      total_bookings: totalBookings,
      today_bookings: todayBookings,
      confirmed_bookings: confirmedCount,
      used_bookings: usedCount,
      cancelled_bookings: cancelledCount,
      full_slots_count: fullSlotsCount,
      total_capacity: totalCapacity,
      total_persons_served: totalPersonsServed,
      occupancy_rate: occupancyRate
    };

    return {
      success: true,
      stats: statsObj,
      summary: statsObj,
      chart_data: Object.values(next7Days),
      recent_activity: (db.audit_logs || []).slice(0, 10),
      recent_logs: (db.audit_logs || []).slice(0, 10)
    };
  }

  // 7. GET /reports/period (تقارير الفترات)
  if (endpoint.startsWith('/reports/period')) {
    const total = db.bookings.length;
    const confirmed = db.bookings.filter(b => b.status === 'CONFIRMED').length;
    const used = db.bookings.filter(b => b.status === 'USED').length;
    const cancelled = db.bookings.filter(b => b.status === 'CANCELLED').length;
    const total_persons = db.bookings.reduce((sum, b) => sum + (b.persons_count || 1), 0);

    return {
      success: true,
      metrics: { total, confirmed, used, cancelled, total_persons }
    };
  }

  // 8. GET /settings & PUT /settings (إعدادات المنصة)
  if (endpoint === '/settings' && method === 'GET') {
    return { success: true, settings: db.settings };
  }

  if (endpoint === '/settings' && (method === 'PUT' || method === 'POST')) {
    db.settings = { ...db.settings, ...body };
    db.audit_logs.unshift({
      id: 'log_' + Date.now(),
      actor: 'ماجد محسن الشهري (ADMIN)',
      action: 'UPDATE_SETTINGS',
      entity_type: 'settings',
      entity_id: 'global',
      details: 'تحديث إعدادات المنصة الرسمية',
      timestamp: new Date().toISOString()
    });
    saveDemoDb(db);
    return { success: true, message: 'تم حفظ وتطبيق الإعدادات بنجاح.', settings: db.settings };
  }

  // 9. إدارة قاعدة البيانات (Reset / Export / Import)
  if (endpoint === '/database/reset' && method === 'POST') {
    const freshDb = getDefaultDatabase();
    ensureDemoAppointments(freshDb);
    saveDemoDb(freshDb);
    return { success: true, message: 'تمت استعادة قاعدة البيانات الأصلية بنجاح!', db: freshDb };
  }

  if (endpoint === '/database/export') {
    return { success: true, data: db };
  }

  if (endpoint === '/database/import' && method === 'POST') {
    if (!body.data || !Array.isArray(body.data.bookings) || !Array.isArray(body.data.users)) {
      throw new Error('ملف قاعدة البيانات غير صالح.');
    }
    saveDemoDb(body.data);
    return { success: true, message: 'تم استيراد قاعدة البيانات بنجاح!' };
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
