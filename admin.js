/**
 * منطق لوحة تحكم الإدارة والمشرفين (Admin & Staff Dashboard)
 */

let currentUser = null;
let currentBookingsPage = 1;
const bookingsLimit = 15;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. التحقق من تسجيل الدخول
  currentUser = getCurrentUser();
  const token = localStorage.getItem('alhijr_auth_token');

  if (!token || !currentUser) {
    window.location.href = 'login.html?redirect=admin.html';
    return;
  }

  // 2. ضبط معلومات المستخدم بالواجهة
  document.getElementById('sidebar-user-name').textContent = currentUser.full_name;
  document.getElementById('sidebar-user-role').textContent = currentUser.role === 'ADMIN' ? 'مدير عام للنظام' : 'مشرف بوابة وتفويج';
  document.getElementById('sidebar-avatar').textContent = currentUser.full_name.charAt(0);
  document.getElementById('btn-admin-logout').addEventListener('click', logout);

  // إخفاء العناصر المخصصة للمدير إن كان المستخدم موظفاً عادياً (RBAC)
  if (currentUser.role !== 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }

  // 3. إعداد التنقل بين التبويبات
  setupTabNavigation();

  // 4. إعداد الأحداث والمودالات
  setupModalsAndActions();

  // 5. تحميل التبويب الافتراضي
  loadDashboardStats();
});

// التنقل بين تبويبات لوحة التحكم
function setupTabNavigation() {
  const menuItems = document.querySelectorAll('.admin-menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.dataset.tab;
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.admin-tab-pane').forEach(p => p.style.display = 'none');
      const targetPane = document.getElementById(`tab-${tabName}`);
      if (targetPane) targetPane.style.display = 'block';

      // استدعاء دالة التحميل الخاصة بكل تبويب
      if (tabName === 'dashboard') loadDashboardStats();
      else if (tabName === 'appointments') loadAppointmentsList();
      else if (tabName === 'bookings') loadBookingsList();
      else if (tabName === 'reports') loadPeriodReport('week');
      else if (tabName === 'settings') loadSettings();
      else if (tabName === 'users') loadUsersList();
    });
  });

  document.getElementById('btn-refresh-stats').addEventListener('click', loadDashboardStats);
}

// =========================================================================
// 1. تبويب المؤشرات (Dashboard Overview)
// =========================================================================
async function loadDashboardStats() {
  try {
    const data = await apiRequest('/reports/dashboard');
    if (!data.success) return;

    const s = data.stats;
    document.getElementById('stat-total-bookings').textContent = s.total_bookings.toLocaleString('ar-SA');
    document.getElementById('stat-today-bookings').textContent = s.today_bookings.toLocaleString('ar-SA');
    document.getElementById('stat-confirmed-bookings').textContent = s.confirmed_bookings.toLocaleString('ar-SA');
    document.getElementById('stat-used-bookings').textContent = s.used_bookings.toLocaleString('ar-SA');
    document.getElementById('stat-cancelled-bookings').textContent = s.cancelled_bookings.toLocaleString('ar-SA');
    document.getElementById('stat-occupancy-rate').textContent = `${s.occupancy_rate}%`;

    // رسم الأعمدة البيانية
    renderBarChart(data.chart_data || []);

    // سجل العمليات الحديثة
    renderRecentLogs(data.recent_activity || []);
  } catch (err) {
    showToast('فشل تحديث بيانات لوحة المؤشرات.', 'error');
  }
}

function renderBarChart(chartData) {
  const container = document.getElementById('dashboard-bar-chart');
  container.innerHTML = '';

  const maxVal = Math.max(...chartData.map(d => Math.max(d.capacity, d.bookings, 1)));

  chartData.forEach(item => {
    const col = document.createElement('div');
    col.className = 'bar-col';

    const heightPct = Math.min(100, Math.round((item.bookings / maxVal) * 100));
    const dObj = new Date(item.date);
    const dayLabel = dObj.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' });

    col.innerHTML = `
      <div style="font-size: 0.72rem; font-weight: 700; color: var(--primary); margin-bottom: 4px;">${item.bookings}</div>
      <div class="bar-rect" style="height: ${Math.max(6, heightPct)}%;" title="المحجوز: ${item.bookings} / السعة: ${item.capacity}"></div>
      <div class="bar-label">${dayLabel}</div>
    `;

    container.appendChild(col);
  });
}

function renderRecentLogs(logs) {
  const tbody = document.getElementById('recent-logs-tbody');
  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">لا توجد نشاطات مسجلة مؤخراً.</td></tr>';
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const timeStr = l.timestamp ? l.timestamp.replace('T', ' ').substring(0, 19) : '-';
    let detailsStr = '';
    if (l.details) {
      if (typeof l.details === 'object') {
        detailsStr = Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(' | ');
      } else {
        detailsStr = String(l.details);
      }
    }
    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.85rem; color: #64748B;">${timeStr}</td>
        <td><strong>${l.actor || '-'}</strong></td>
        <td><span class="badge badge-info">${l.action || '-'}</span></td>
        <td style="font-size: 0.85rem; color: var(--text-muted); max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${detailsStr || '-'}</td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 2. تبويب إدارة المواعيد (Appointments)
// =========================================================================
async function loadAppointmentsList() {
  const tbody = document.getElementById('appointments-tbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">جاري تحميل المواعيد...</td></tr>';

  try {
    const data = await apiRequest('/appointments?all=true');
    const list = data.appointments || [];

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">لا توجد مواعيد مضافة في النظام.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(a => {
      const remaining = Math.max(0, a.capacity - (a.booked_count || 0));
      const statusBadge = getStatusBadge(a.status);
      const isPast = a.status === 'EXPIRED';

      return `
        <tr>
          <td><strong>${a.date}</strong></td>
          <td style="font-weight: 700; text-align: right; white-space: nowrap;">${formatSlotRange(a.start_time, a.end_time)}</td>
          <td>${a.notes || '-'}</td>
          <td>${a.capacity}</td>
          <td><strong style="color: var(--primary);">${a.booked_count || 0}</strong></td>
          <td><strong style="color: ${remaining === 0 ? 'var(--danger)' : 'var(--success)'};">${remaining}</strong></td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="toggleAppointmentActive('${a.id}', ${!a.is_active})">
                ${a.is_active ? 'تعطيل' : 'تفعيل'}
              </button>
              ${currentUser.role === 'ADMIN' ? `
                <button class="btn btn-danger btn-sm" onclick="deleteAppointment('${a.id}')" ${a.booked_count > 0 ? 'disabled title="لا يمكن حذف موعد به حجوزات"' : ''}>
                  حذف
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast('فشل جلب قائمة المواعيد.', 'error');
  }
}

// تغيير حالة تفعيل الموعد
window.toggleAppointmentActive = async function(id, newState) {
  try {
    await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_active: newState })
    });
    showToast('تم تحديث حالة الموعد.', 'success');
    loadAppointmentsList();
  } catch (err) {
    showToast(err.message || 'فشل تحديث الموعد.', 'error');
  }
};

// حذف الموعد
window.deleteAppointment = async function(id) {
  if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الموعد؟')) return;
  try {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
    showToast('تم حذف الموعد بنجاح.', 'success');
    loadAppointmentsList();
  } catch (err) {
    showToast(err.message || 'فشل حذف الموعد.', 'error');
  }
};

// =========================================================================
// 3. تبويب إدارة الحجوزات (Bookings)
// =========================================================================
async function loadBookingsList(page = 1) {
  currentBookingsPage = page;
  const tbody = document.getElementById('bookings-tbody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">جاري تحميل الحجوزات...</td></tr>';

  const search = document.getElementById('booking-search-input').value.trim();
  const status = document.getElementById('booking-status-filter').value;
  const date = document.getElementById('booking-date-filter').value;

  const queryParams = new URLSearchParams({
    page,
    limit: bookingsLimit,
    ...(search ? { search } : {}),
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(date ? { date } : {})
  });

  try {
    const data = await apiRequest(`/bookings?${queryParams.toString()}`);
    const list = data.bookings || [];

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 30px; color: var(--text-muted);">لا توجد حجوزات مطابقة لمعايير البحث.</td></tr>';
      document.getElementById('pagination-info').textContent = 'لا توجد نتائج';
      document.getElementById('btn-prev-page').disabled = true;
      document.getElementById('btn-next-page').disabled = true;
      return;
    }

    tbody.innerHTML = list.map(b => {
      const app = b.appointment || {};
      const slotTime = app.date ? `${app.date} (${formatSlotRange(app.start_time, app.end_time)})` : '-';
      const createdStr = b.created_at ? b.created_at.replace('T', ' ').substring(0, 16) : '-';

      return `
        <tr>
          <td><strong style="color: var(--primary); font-family: monospace;">${b.booking_ref}</strong></td>
          <td><strong>${b.full_name}</strong></td>
          <td style="direction: ltr; text-align: right;">${b.phone}</td>
          <td>${b.national_id}</td>
          <td>${slotTime}</td>
          <td>${b.persons_count}</td>
          <td>${getStatusBadge(b.status)}</td>
          <td style="font-size: 0.82rem; color: #64748B;">${createdStr}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <a href="ticket.html?ref=${b.booking_ref}" target="_blank" class="btn btn-secondary btn-sm" title="عرض التذكرة">
                تذكرة
              </a>
              ${b.status === 'CONFIRMED' ? `
                <button class="btn btn-primary btn-sm" style="background: #059669;" onclick="manualCheckIn('${b.id}')" title="تسجيل دخول يدوي للزائر">
                  دخول
                </button>
                <button class="btn btn-danger btn-sm" onclick="adminCancelBooking('${b.id}')" title="إلغاء الحجز">
                  إلغاء
                </button>
              ` : ''}
              <button class="btn btn-secondary btn-sm" onclick="resendTicketNotice('${b.id}')" title="إعادة إرسال الإشعار">
                إشعار
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // تحديث الترقيم
    document.getElementById('pagination-info').textContent = `صفحة ${data.page} من ${data.total_pages || 1} (الإجمالي: ${data.total})`;
    document.getElementById('btn-prev-page').disabled = data.page <= 1;
    document.getElementById('btn-next-page').disabled = data.page >= data.total_pages;
  } catch (err) {
    showToast('فشل جلب قائمة الحجوزات.', 'error');
  }
}

// تسجيل دخول يدوي للزائر من الجدول
window.manualCheckIn = async function(bookingId) {
  if (!confirm('هل تريد تأكيد تسجيل دخول هذا الزائر يدويًا؟')) return;
  try {
    await apiRequest(`/bookings/${bookingId}/manual-checkin`, { method: 'POST' });
    showToast('تم تسجيل دخول الزائر بنجاح ✓', 'success');
    loadBookingsList(currentBookingsPage);
  } catch (err) {
    showToast(err.message || 'فشل تسجيل الدخول.', 'error');
  }
};

// إلغاء الحجز بواسطة الإدارة
window.adminCancelBooking = async function(bookingId) {
  if (!confirm('هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟')) return;
  try {
    await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'POST' });
    showToast('تم إلغاء الحجز بنجاح.', 'success');
    loadBookingsList(currentBookingsPage);
  } catch (err) {
    showToast(err.message || 'فشل إلغاء الحجز.', 'error');
  }
};

// إعادة إرسال إشعار التذكرة
window.resendTicketNotice = async function(bookingId) {
  try {
    const res = await apiRequest(`/bookings/${bookingId}/resend-ticket`, { method: 'POST' });
    showToast(res.message || 'تمت إعادة الإرسال.', 'success');
  } catch (err) {
    showToast('فشل إعادة إرسال التذكرة.', 'error');
  }
};

// =========================================================================
// 4. تبويب التقارير (Reports & Periods)
// =========================================================================
async function loadPeriodReport(period = 'week') {
  try {
    const data = await apiRequest(`/reports/period?period=${period}`);
    if (data.success && data.metrics) {
      const m = data.metrics;
      document.getElementById('rep-total').textContent = m.total.toLocaleString('ar-SA');
      document.getElementById('rep-confirmed').textContent = m.confirmed.toLocaleString('ar-SA');
      document.getElementById('rep-used').textContent = m.used.toLocaleString('ar-SA');
      document.getElementById('rep-cancelled').textContent = m.cancelled.toLocaleString('ar-SA');
      document.getElementById('rep-persons').textContent = `${m.total_persons.toLocaleString('ar-SA')} فرد`;
    }
  } catch (err) {
    showToast('فشل توليد التقرير.', 'error');
  }
}

// =========================================================================
// 5. تبويب إعدادات النظام (Settings)
// =========================================================================
async function loadSettings() {
  try {
    const data = await apiRequest('/settings');
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('set-platform-name').value = s.platform_name || '';
      document.getElementById('set-max-persons').value = s.max_persons_per_booking || 5;
      document.getElementById('set-cancel-hours').value = s.cancellation_hours_before || 2;
      document.getElementById('set-default-capacity').value = s.default_slot_capacity || 40;
      document.getElementById('set-disclaimer').value = s.disclaimer || '';
      document.getElementById('set-instructions').value = s.instructions_text || '';
    }
  } catch (err) {
    showToast('فشل جلب إعدادات النظام.', 'error');
  }
}

async function saveSettings(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-settings');
  btn.disabled = true;
  btn.textContent = 'جاري الحفظ...';

  const payload = {
    platform_name: document.getElementById('set-platform-name').value.trim(),
    max_persons_per_booking: parseInt(document.getElementById('set-max-persons').value, 10),
    cancellation_hours_before: parseInt(document.getElementById('set-cancel-hours').value, 10),
    default_slot_capacity: parseInt(document.getElementById('set-default-capacity').value, 10),
    disclaimer: document.getElementById('set-disclaimer').value.trim(),
    instructions_text: document.getElementById('set-instructions').value.trim()
  };

  try {
    await apiRequest('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    showToast('تم حفظ وتطبيق إعدادات المنصة بنجاح.', 'success');
  } catch (err) {
    showToast(err.message || 'فشل حفظ الإعدادات.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'حفظ وتطبيق الإعدادات';
  }
}

// =========================================================================
// 6. تبويب المستخدمين (Users)
// =========================================================================
async function loadUsersList() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">جاري تحميل المستخدمين...</td></tr>';

  try {
    const data = await apiRequest('/auth/users');
    const users = data.users || [];

    tbody.innerHTML = users.map(u => {
      const isSelf = currentUser && currentUser.id === u.id;
      const safeName = (u.full_name || u.username).replace(/'/g, "\\'");

      return `
        <tr>
          <td><strong>${u.username}</strong></td>
          <td>${u.full_name}</td>
          <td><span class="badge ${u.role === 'ADMIN' ? 'badge-success' : 'badge-info'}">${u.role === 'ADMIN' ? 'مدير عام' : 'مشرف بوابة'}</span></td>
          <td>${u.email || '-'}</td>
          <td style="font-size: 0.85rem; color: #64748B;">${u.created_at ? u.created_at.substring(0, 10) : '-'}</td>
          <td><span class="badge badge-success">نشط</span></td>
          <td>
            ${isSelf 
              ? '<span style="color: var(--text-muted); font-size: 0.82rem; font-weight: 600;">(حسابك الحالي)</span>' 
              : `<button type="button" class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}', '${safeName}')" title="حذف هذا المستخدم من النظام">
                   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-left: 2px;">
                     <polyline points="3 6 5 6 21 6"/>
                     <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                   </svg>
                   <span>حذف</span>
                 </button>`
            }
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast('فشل جلب قائمة المستخدمين.', 'error');
  }
}

// دالة حذف المستخدم (للمدير فقط)
async function deleteUser(userId, userName) {
  if (!confirm(`هل أنت متأكد من رغبتك في إزالة المستخدم "${userName}" نهائياً من النظام؟`)) {
    return;
  }

  try {
    const res = await apiRequest(`/auth/users/${userId}`, {
      method: 'DELETE'
    });
    showToast(res.message || 'تم حذف المستخدم بنجاح.', 'success');
    loadUsersList();
  } catch (err) {
    showToast(err.message || 'فشل حذف المستخدم.', 'error');
  }
}

window.deleteUser = deleteUser;

// =========================================================================
// إعداد المودالات والأحداث المساعدة
// =========================================================================
function setupModalsAndActions() {
  // فلاتر الحجوزات
  document.getElementById('btn-apply-filters').addEventListener('click', () => loadBookingsList(1));
  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('booking-search-input').value = '';
    document.getElementById('booking-status-filter').value = 'ALL';
    document.getElementById('booking-date-filter').value = '';
    loadBookingsList(1);
  });
  document.getElementById('btn-prev-page').addEventListener('click', () => loadBookingsList(currentBookingsPage - 1));
  document.getElementById('btn-next-page').addEventListener('click', () => loadBookingsList(currentBookingsPage + 1));

  // تقارير
  document.getElementById('btn-load-period-report').addEventListener('click', () => {
    const p = document.getElementById('report-period-select').value;
    loadPeriodReport(p);
  });

  // حفظ الإعدادات
  document.getElementById('settings-form').addEventListener('submit', saveSettings);

  // مودال إنشاء موعد
  const slotModal = document.getElementById('modal-create-slot');
  document.getElementById('btn-open-create-slot-modal').addEventListener('click', () => {
    // تعيين التاريخ لليوم افتراضياً
    document.getElementById('slot-date').value = new Date().toISOString().split('T')[0];
    slotModal.classList.add('active');
  });
  document.getElementById('btn-close-slot-modal').addEventListener('click', () => slotModal.classList.remove('active'));
  document.getElementById('btn-abort-slot-modal').addEventListener('click', () => slotModal.classList.remove('active'));

  document.getElementById('create-slot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      date: document.getElementById('slot-date').value,
      start_time: document.getElementById('slot-start').value,
      end_time: document.getElementById('slot-end').value,
      capacity: parseInt(document.getElementById('slot-capacity').value, 10),
      notes: document.getElementById('slot-notes').value.trim()
    };

    try {
      await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('تمت إضافة الموعد بنجاح.', 'success');
      slotModal.classList.remove('active');
      document.getElementById('create-slot-form').reset();
      loadAppointmentsList();
    } catch (err) {
      showToast(err.message || 'فشل إضافة الموعد.', 'error');
    }
  });

  // مودال توليد مواعيد تلقائية
  const bulkModal = document.getElementById('modal-bulk-slots');
  const btnOpenBulk = document.getElementById('btn-open-bulk-modal');
  if (btnOpenBulk) {
    btnOpenBulk.addEventListener('click', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('bulk-slot-date').value = tomorrow.toISOString().split('T')[0];
      bulkModal.classList.add('active');
    });
  }

  const btnCloseBulk = document.getElementById('btn-close-bulk-modal');
  if (btnCloseBulk) btnCloseBulk.addEventListener('click', () => bulkModal.classList.remove('active'));
  const btnAbortBulk = document.getElementById('btn-abort-bulk-modal');
  if (btnAbortBulk) btnAbortBulk.addEventListener('click', () => bulkModal.classList.remove('active'));

  const bulkForm = document.getElementById('bulk-slots-form');
  if (bulkForm) {
    bulkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const date = document.getElementById('bulk-slot-date').value;
      const capacity = parseInt(document.getElementById('bulk-slot-capacity').value, 10);
      const checkedBoxes = Array.from(document.querySelectorAll('input[name="bulk_slot"]:checked'));

      if (checkedBoxes.length === 0) {
        showToast('يرجى اختيار فترة زمنية واحدة على الأقل.', 'warning');
        return;
      }

      const slots = checkedBoxes.map(cb => {
        const [start, end, notes] = cb.value.split('|');
        return { start_time: start, end_time: end, notes, capacity };
      });

      try {
        const res = await apiRequest('/appointments/bulk-generate', {
          method: 'POST',
          body: JSON.stringify({ date, slots, default_capacity: capacity })
        });
        showToast(res.message || 'تم توليد المواعيد بنجاح.', 'success');
        bulkModal.classList.remove('active');
        loadAppointmentsList();
      } catch (err) {
        showToast(err.message || 'فشل توليد المواعيد.', 'error');
      }
    });
  }

  // مودال إنشاء مستخدم
  const userModal = document.getElementById('modal-create-user');
  document.getElementById('btn-open-create-user-modal').addEventListener('click', () => userModal.classList.add('active'));
  document.getElementById('btn-close-user-modal').addEventListener('click', () => userModal.classList.remove('active'));
  document.getElementById('btn-abort-user-modal').addEventListener('click', () => userModal.classList.remove('active'));

  document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: document.getElementById('new-user-username').value.trim(),
      full_name: document.getElementById('new-user-fullname').value.trim(),
      password: document.getElementById('new-user-password').value,
      role: document.getElementById('new-user-role').value
    };

    try {
      await apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('تم إنشاء المستخدم بنجاح.', 'success');
      userModal.classList.remove('active');
      document.getElementById('create-user-form').reset();
      loadUsersList();
    } catch (err) {
      showToast(err.message || 'فشل إنشاء المستخدم.', 'error');
    }
  });

  // معالجة تصدير الـ CSV في حال الاستضافة على GitHub Pages
  const exportBtn = document.getElementById('btn-export-csv');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
        e.preventDefault();
        const db = typeof getDemoDb === 'function' ? getDemoDb() : { bookings: [] };
        let csv = '\uFEFFرقم الحجز,اسم الزائر,الهوية,الجوال,عدد الأفراد,تاريخ الموعد,فترة الموعد,الحالة\n';
        db.bookings.forEach(b => {
          const app = b.appointment || {};
          csv += `"${b.booking_ref}","${b.full_name}","${b.national_id}","${b.phone}",${b.persons_count},"${app.date || '-'}","${app.start_time || '-'} - ${app.end_time || '-'}","${b.status}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alhijr_bookings_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('تم تصدير ملف CSV بنجاح.', 'success');
      }
    });
  }
}
