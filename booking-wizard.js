/**
 * منطق معالج حجز المواعيد متعدد الخطوات (Booking Wizard)
 */

let selectedDate = null;
let selectedAppointment = null;
let confirmedBookingData = null;

function initBookingWizard() {
  setupEventListeners();
  loadAvailableDates();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBookingWizard);
} else {
  initBookingWizard();
}

// إعداد أحداث الأزرار والتنقل
function setupEventListeners() {
  // أزرار التنقل بين الخطوات
  document.getElementById('btn-to-step-2').addEventListener('click', goToStep2);
  document.getElementById('btn-back-to-step-1').addEventListener('click', () => setStep(1));
  document.getElementById('btn-change-slot').addEventListener('click', () => setStep(1));
  
  document.getElementById('btn-to-step-3').addEventListener('click', goToStep3);
  document.getElementById('btn-back-to-step-2').addEventListener('click', () => setStep(2));
  
  document.getElementById('btn-confirm-booking').addEventListener('click', handleConfirmBooking);

  // أزرار التذكرة
  document.getElementById('btn-print-ticket').addEventListener('click', () => {
    window.print();
  });

  const downloadBtn = document.getElementById('btn-download-ticket');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!confirmedBookingData) return;
      const app = confirmedBookingData.appointment || selectedAppointment || {};
      downloadTicketCanvas(
        confirmedBookingData.booking_ref,
        confirmedBookingData.full_name,
        app.date,
        `${app.start_time} - ${app.end_time}`,
        confirmedBookingData.persons_count,
        confirmedBookingData.qr_image
      );
    });
  }

  document.getElementById('btn-share-ticket').addEventListener('click', handleShareTicket);
}

// تغيير الخطوة الحالية وتحديث شريط التقدم
function setStep(stepNumber) {
  // إخفاء جميع الأقسام
  document.querySelectorAll('.wizard-content').forEach(el => el.style.display = 'none');
  
  // إظهار القسم المطلوب
  const targetSection = document.getElementById(`step-${stepNumber}`);
  if (targetSection) targetSection.style.display = 'block';

  // تحديث المؤشرات
  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`prog-step-${i}`);
    if (!stepEl) continue;

    stepEl.classList.remove('active', 'completed');
    if (i < stepNumber) {
      stepEl.classList.add('completed');
    } else if (i === stepNumber) {
      stepEl.classList.add('active');
    }
  }

  window.scrollTo({ top: 120, behavior: 'smooth' });
}

// جلب التواريخ المتاحة وعرض رقاقات الأيام (Chips)
async function loadAvailableDates() {
  const container = document.getElementById('date-chips-container');
  try {
    const data = await apiRequest('/appointments/available-dates');
    if (!data.dates || data.dates.length === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--warning);">لا توجد مواعيد متاحة للحجز حاليًا. يرجى المحاولة لاحقًا.</div>';
      return;
    }

    container.innerHTML = '';
    data.dates.forEach((item, index) => {
      const parts = item.date.split('-');
      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
      const dayName = dateObj.toLocaleDateString('ar-SA', { weekday: 'short' });
      const dayNum = dateObj.getDate();
      const monthName = dateObj.toLocaleDateString('ar-SA', { month: 'short' });

      const chip = document.createElement('div');
      chip.className = `date-chip ${index === 0 ? 'active' : ''}`;
      chip.dataset.date = item.date;
      chip.innerHTML = `
        <span class="day-name">${dayName}</span>
        <span class="day-num">${dayNum}</span>
        <span class="slots-count">${monthName} (${item.available_slots} متاح)</span>
      `;

      chip.addEventListener('click', () => {
        document.querySelectorAll('.date-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectDate(item.date);
      });

      container.appendChild(chip);
    });

    // اختيار أول يوم تلقائياً
    if (data.dates.length > 0) {
      selectDate(data.dates[0].date);
    }
  } catch (err) {
    showToast('فشل تحميل قائمة الأيام المتاحة.', 'error');
    container.innerHTML = '<div style="padding: 20px; color: var(--danger); text-align: center;">تعذر الاتصال بالخادم لجلب المواعيد.</div>';
  }
}

// اختيار يوم وجلب فتراته
async function selectDate(dateStr) {
  selectedDate = dateStr;
  selectedAppointment = null;
  document.getElementById('btn-to-step-2').disabled = true;

  const parts = dateStr.split('-');
  const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
  const arabicDate = dateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('selected-date-heading').textContent = `مواعيد ${arabicDate}`;

  const grid = document.getElementById('slots-grid-container');
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 30px; color: var(--text-muted);">جاري تحميل الفترات...</div>';

  try {
    const data = await apiRequest(`/appointments?date=${dateStr}`);
    const slots = data.appointments || [];

    document.getElementById('slots-count-badge').textContent = `${slots.length} فترات`;

    if (slots.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">لا توجد مواعيد مجدولة في هذا اليوم.</div>';
      return;
    }

    grid.innerHTML = '';
    slots.forEach(slot => {
      const isAvailable = slot.status === 'AVAILABLE';
      const slotCard = document.createElement('div');
      slotCard.className = `slot-card ${isAvailable ? '' : 'disabled'}`;
      slotCard.dataset.id = slot.id;

      let statusBadge = '';
      if (slot.status === 'AVAILABLE') {
        statusBadge = `<span class="badge badge-success">متاح ✓</span>`;
      } else if (slot.status === 'FULL') {
        statusBadge = `<span class="badge badge-danger">مكتمل ✕</span>`;
      } else if (slot.status === 'EXPIRED') {
        statusBadge = `<span class="badge badge-danger">منتهي</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning">غير متاح</span>`;
      }

      slotCard.innerHTML = `
        <div class="slot-header">
          <div class="slot-time">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${formatSlotRange(slot.start_time, slot.end_time)}</span>
            <span class="badge" style="background: rgba(197, 160, 89, 0.18); color: var(--primary); font-size: 0.72rem; padding: 2px 6px;">ساعتان</span>
          </div>
          ${statusBadge}
        </div>

        <div class="slot-body">
          <div style="font-size: 0.88rem; color: var(--primary); font-weight: 700; margin-bottom: 4px;">
            ${slot.notes || 'فترة دخول الحِجر'}
          </div>
          <div class="slot-capacity">
            المقاعد المتبقية: <strong>${slot.remaining_seats}</strong> من ${slot.capacity}
          </div>
        </div>

        <div>
          ${isAvailable 
            ? `<button type="button" class="btn btn-secondary btn-sm btn-block slot-select-btn">اختيار هذا الموعد</button>` 
            : `<button type="button" class="btn btn-sm btn-block" disabled style="background: #E2E8F0; color: #94A3B8;">غير متاح</button>`}
        </div>
      `;

      if (isAvailable) {
        slotCard.addEventListener('click', () => {
          document.querySelectorAll('.slot-card').forEach(c => {
            c.classList.remove('selected');
            const btn = c.querySelector('.slot-select-btn');
            if (btn) {
              btn.textContent = 'اختيار هذا الموعد';
              btn.className = 'btn btn-secondary btn-sm btn-block slot-select-btn';
            }
          });

          slotCard.classList.add('selected');
          const btn = slotCard.querySelector('.slot-select-btn');
          if (btn) {
            btn.textContent = 'تم الاختيار ✓';
            btn.className = 'btn btn-primary btn-sm btn-block slot-select-btn';
          }

          selectedAppointment = slot;
          document.getElementById('btn-to-step-2').disabled = false;
        });
      }

      grid.appendChild(slotCard);
    });
  } catch (err) {
    showToast('فشل جلب فترات المواعيد.', 'error');
  }
}

// الانتقال إلى الخطوة 2 (بيانات الزائر)
function goToStep2() {
  if (!selectedAppointment) {
    showToast('يرجى اختيار موعد متاح أولاً.', 'warning');
    return;
  }

  // تحديث نص الشريط الملخص
  const parts = (selectedAppointment.date || '').split('-');
  const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 12, 0, 0);
  const arabicDate = dateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  document.getElementById('banner-slot-text').textContent = 
    `${arabicDate} (${formatSlotRange(selectedAppointment.start_time, selectedAppointment.end_time)})`;

  setStep(2);
}

// الانتقال إلى الخطوة 3 (المراجعة والإقرار)
function goToStep3() {
  const fullName = document.getElementById('full_name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const nationalId = document.getElementById('national_id').value.trim();
  const personsCount = document.getElementById('persons_count').value;

  if (fullName.length < 3) {
    showToast('يرجى إدخال الاسم الثلاثي كاملاً.', 'error');
    document.getElementById('full_name').focus();
    return;
  }

  if (phone.length < 9) {
    showToast('يرجى إدخال رقم جوال صحيح للتواصل.', 'error');
    document.getElementById('phone').focus();
    return;
  }

  if (nationalId.length < 5) {
    showToast('يرجى إدخال رقم الهوية أو الإقامة أو الجواز بشكل صحيح.', 'error');
    document.getElementById('national_id').focus();
    return;
  }

  // تعبئة بيانات شاشة المراجعة
  document.getElementById('rev-name').textContent = fullName;
  document.getElementById('rev-phone').textContent = phone;
  document.getElementById('rev-id').textContent = nationalId;
  document.getElementById('rev-persons').textContent = `${personsCount} أفراد`;
  
  const revParts = (selectedAppointment.date || '').split('-');
  const revDateObj = new Date(parseInt(revParts[0], 10), parseInt(revParts[1], 10) - 1, parseInt(revParts[2], 10), 12, 0, 0);
  document.getElementById('rev-date').textContent = 
    revDateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  document.getElementById('rev-time').textContent = 
    `${formatSlotRange(selectedAppointment.start_time, selectedAppointment.end_time)} (ساعتان)`;

  setStep(3);
}

// إرسال طلب تأكيد الحجز إلى السيرفر
async function handleConfirmBooking() {
  const chkAccurate = document.getElementById('chk-accurate');
  const chkTerms = document.getElementById('chk-terms');

  if (!chkAccurate.checked || !chkTerms.checked) {
    showToast('يرجى الموافقة على الإقرار والشروط قبل تأكيد الحجز.', 'warning');
    return;
  }

  const confirmBtn = document.getElementById('btn-confirm-booking');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = `
    <span class="spinner"></span>
    <span>جاري التحقق وإصدار التذكرة...</span>
  `;

  const payload = {
    appointment_id: selectedAppointment.id,
    full_name: document.getElementById('full_name').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    national_id: document.getElementById('national_id').value.trim(),
    nationality: document.getElementById('nationality').value,
    persons_count: parseInt(document.getElementById('persons_count').value, 10)
  };

  try {
    const res = await apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success && res.booking) {
      confirmedBookingData = res.booking;
      showToast('تم تأكيد حجزك بنجاح!', 'success');
      renderConfirmedTicket(res.booking);
      setStep(4);
    }
  } catch (err) {
    showToast(err.message || 'فشل إتمام الحجز. يرجى مراجعة البيانات.', 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span>تأكيد الحجز وإصدار التذكرة</span>
    `;
  }
}

// عرض بيانات التذكرة الإلكترونية والـ QR
function renderConfirmedTicket(booking) {
  const app = booking.appointment || selectedAppointment;
  
  document.getElementById('ticket-booking-ref').textContent = booking.booking_ref;
  document.getElementById('ticket-qr-img').src = booking.qr_image;
  document.getElementById('ticket-name').textContent = booking.full_name;
  document.getElementById('ticket-persons').textContent = `${booking.persons_count} أفراد`;
  
  const dateParts = (app.date || '').split('-');
  const dateObj = new Date(parseInt(dateParts[0], 10), parseInt(dateParts[1], 10) - 1, parseInt(dateParts[2], 10), 12, 0, 0);
  document.getElementById('ticket-date').textContent = 
    dateObj.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  document.getElementById('ticket-time').textContent = formatSlotRange(app.start_time, app.end_time);
  document.getElementById('ticket-phone').textContent = booking.phone;
}

// مشاركة الحجز عبر WhatsApp أو Web Share API
function handleShareTicket() {
  if (!confirmedBookingData) return;

  const app = confirmedBookingData.appointment || selectedAppointment;
  const shareText = `السلام عليكم، تم تأكيد حجز موعد لدخول الحِجر في المسجد الحرام.
رقم الحجز: ${confirmedBookingData.booking_ref}
الاسم: ${confirmedBookingData.full_name}
التاريخ: ${app.date}
الوقت: ${formatSlotRange(app.start_time, app.end_time)} (مدة الزيارة: ساعتان)
عدد الأفراد: ${confirmedBookingData.persons_count}`;

  const ticketUrl = new URL(`ticket.html?ref=${confirmedBookingData.booking_ref}&token=${confirmedBookingData.qr_token}`, window.location.href).href;

  if (navigator.share) {
    navigator.share({
      title: 'تذكرة دخول الحِجر بالمسجد الحرام',
      text: shareText,
      url: ticketUrl
    }).catch(() => {});
  } else {
    // فتح واتساب مباشرة
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  }
}
