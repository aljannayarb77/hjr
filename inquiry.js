/**
 * منطق صفحة الاستعلام عن الحجز وإلغاؤه
 */

let currentBooking = null;

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  // فحص ما إذا كان الرابط يحتوي على معلمات ref أو phone أو national_id للبحث الفوري
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref') || '';
  const phone = urlParams.get('phone') || '';
  const nationalId = urlParams.get('national_id') || urlParams.get('id') || '';

  if (ref) {
    document.getElementById('lookup_ref').value = ref;
  }
  if (phone) {
    document.getElementById('lookup_phone').value = phone;
  }
  if (nationalId) {
    document.getElementById('lookup_national_id').value = nationalId;
  }
  if (ref || phone || nationalId) {
    performLookup(ref, phone, nationalId);
  }
});

function setupEventListeners() {
  const form = document.getElementById('lookup-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = document.getElementById('lookup_ref').value.trim();
    const phone = document.getElementById('lookup_phone').value.trim();
    const nationalId = document.getElementById('lookup_national_id').value.trim();

    if (!ref && !phone && !nationalId) {
      showToast('يرجى إدخال رقم الحجز أو رقم الجوال أو رقم الهوية للبحث.', 'warning');
      document.getElementById('lookup_ref').focus();
      return;
    }

    performLookup(ref, phone, nationalId);
  });

  document.getElementById('btn-new-search').addEventListener('click', () => {
    document.getElementById('result-ticket-section').style.display = 'none';
    const multiSec = document.getElementById('multiple-bookings-section');
    if (multiSec) multiSec.style.display = 'none';
    document.getElementById('search-card').style.display = 'block';
    document.getElementById('not-found-msg').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const inqDownBtn = document.getElementById('btn-inq-download');
  if (inqDownBtn) {
    inqDownBtn.addEventListener('click', () => {
      if (!currentBooking) return;
      const app = currentBooking.appointment || {};
      downloadTicketCanvas(
        currentBooking.booking_ref,
        currentBooking.full_name,
        app.date,
        formatSlotRange(app.start_time, app.end_time),
        currentBooking.persons_count,
        currentBooking.qr_image
      );
    });
  }

  document.getElementById('btn-inq-print').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('btn-inq-share').addEventListener('click', () => {
    if (!currentBooking) return;
    const app = currentBooking.appointment || {};
    const text = `تذكرة دخول الحِجر - رقم الحجز: ${currentBooking.booking_ref}، التاريخ: ${app.date || '-'}، الوقت: ${formatSlotRange(app.start_time, app.end_time)}`;
    if (navigator.share) {
      navigator.share({ title: 'تذكرة دخول الحِجر', text, url: window.location.href }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  });

  // التحكم بنافذة تأكيد الإلغاء
  const modal = document.getElementById('cancel-modal');
  document.getElementById('btn-trigger-cancel').addEventListener('click', () => {
    modal.classList.add('active');
  });

  document.getElementById('btn-abort-cancel').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('btn-close-cancel-modal').addEventListener('click', () => {
    modal.classList.remove('active');
  });

  document.getElementById('btn-confirm-cancel').addEventListener('click', handleCancelBooking);
}

// تنفيذ الاستعلام
async function performLookup(ref, phone, nationalId) {
  const notFoundEl = document.getElementById('not-found-msg');
  const searchBtn = document.getElementById('btn-search');

  notFoundEl.style.display = 'none';
  searchBtn.disabled = true;
  searchBtn.innerHTML = '<span>جاري البحث...</span>';

  try {
    const data = await apiRequest('/bookings/lookup', {
      method: 'POST',
      body: JSON.stringify({ 
        booking_ref: ref || '', 
        phone: phone || '',
        national_id: nationalId || ''
      })
    });

    if (data.success && data.booking) {
      currentBooking = data.booking;
      const allBookings = data.bookings || [data.booking];
      setupMultipleBookingsSelector(allBookings, data.booking.id);

      renderTicketDetails(data.booking);
      document.getElementById('search-card').style.display = 'none';
      document.getElementById('result-ticket-section').style.display = 'block';
      showToast('تم العثور على الحجز بنجاح.', 'success');
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  } catch (err) {
    notFoundEl.style.display = 'block';
    showToast(err.message || 'لم يتم العثور على الحجز.', 'error');
  } finally {
    searchBtn.disabled = false;
    searchBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span>بحث وعرض التذكرة</span>
    `;
  }
}

// إعداد مبدل الحجوزات عند العثور على أكثر من حجز لنفس المستعلم
function setupMultipleBookingsSelector(bookings, selectedId) {
  const multiSection = document.getElementById('multiple-bookings-section');
  const countSpan = document.getElementById('multiple-bookings-count');
  const listContainer = document.getElementById('multiple-bookings-list');

  if (!multiSection || !listContainer) return;

  if (!bookings || bookings.length <= 1) {
    multiSection.style.display = 'none';
    return;
  }

  countSpan.textContent = bookings.length;
  multiSection.style.display = 'block';
  listContainer.innerHTML = '';

  bookings.forEach((b) => {
    const isSelected = (b.id === selectedId || b.booking_ref === selectedId);
    const app = b.appointment || {};
    const itemBtn = document.createElement('button');
    itemBtn.type = 'button';
    itemBtn.className = `btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`;
    itemBtn.style.padding = '8px 14px';
    itemBtn.style.fontSize = '0.88rem';
    itemBtn.style.borderRadius = 'var(--radius-sm)';
    itemBtn.style.display = 'inline-flex';
    itemBtn.style.alignItems = 'center';
    itemBtn.style.gap = '6px';

    let statusText = 'مؤكد';
    if (b.status === 'USED') statusText = 'مستخدم';
    if (b.status === 'CANCELLED') statusText = 'ملغى';

    itemBtn.innerHTML = `
      <strong>${b.booking_ref}</strong>
      <span style="opacity: 0.85;">(${app.date || '-'} | ${statusText})</span>
    `;

    itemBtn.addEventListener('click', () => {
      currentBooking = b;
      setupMultipleBookingsSelector(bookings, b.id);
      renderTicketDetails(b);
      showToast(`تم عرض التذكرة ${b.booking_ref}`, 'info');
    });

    listContainer.appendChild(itemBtn);
  });
}

// عرض بيانات التذكرة المسترجعة
function renderTicketDetails(booking) {
  const app = booking.appointment || {};
  
  document.getElementById('inq-ticket-ref').textContent = booking.booking_ref;
  document.getElementById('inq-qr-img').src = booking.qr_image;
  document.getElementById('inq-name').textContent = booking.full_name;
  document.getElementById('inq-persons').textContent = `${booking.persons_count} أفراد`;
  
  if (app.date) {
    const d = new Date(app.date);
    document.getElementById('inq-date').textContent = d.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('inq-time').textContent = formatSlotRange(app.start_time, app.end_time);
  } else {
    document.getElementById('inq-date').textContent = '-';
    document.getElementById('inq-time').textContent = '-';
  }

  document.getElementById('inq-national-id').textContent = booking.national_id;

  // شارة الحالة
  const statusEl = document.getElementById('inq-status');
  statusEl.innerHTML = getStatusBadge(booking.status);

  // التحكم في زر الإلغاء
  const cancelBtn = document.getElementById('btn-trigger-cancel');
  const qrBox = document.querySelector('.pass-qr-box');
  const qrCaption = document.getElementById('inq-qr-caption');

  if (booking.status === 'CONFIRMED') {
    cancelBtn.style.display = 'inline-flex';
    qrBox.style.opacity = '1';
    qrCaption.textContent = 'رمز التحقق للدخول ✓';
  } else if (booking.status === 'USED') {
    cancelBtn.style.display = 'none';
    qrBox.style.opacity = '0.7';
    qrCaption.textContent = `تم استخدام هذا الحجز في: ${booking.used_at ? booking.used_at.substring(0, 16).replace('T', ' ') : '-'}`;
  } else if (booking.status === 'CANCELLED') {
    cancelBtn.style.display = 'none';
    qrBox.style.opacity = '0.5';
    qrCaption.textContent = 'هذا الحجز ملغى - الرمز غير صالح للدخول ✕';
  } else {
    cancelBtn.style.display = 'none';
  }
}

// إلغاء الحجز الفعلي
async function handleCancelBooking() {
  if (!currentBooking) return;

  const confirmBtn = document.getElementById('btn-confirm-cancel');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'جاري الإلغاء...';

  try {
    const res = await apiRequest(`/bookings/${currentBooking.id}/cancel`, {
      method: 'POST'
    });

    if (res.success && res.booking) {
      currentBooking = { ...currentBooking, ...res.booking };
      showToast('تم إلغاء الحجز بنجاح.', 'success');
      document.getElementById('cancel-modal').classList.remove('active');
      renderTicketDetails(currentBooking);
    }
  } catch (err) {
    showToast(err.message || 'فشل إلغاء الحجز.', 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'نعم، إلغاء الحجز الآن';
  }
}
