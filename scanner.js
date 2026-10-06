/**
 * منطق شاشة ماسح QR Code للموظفين والتحقق المباشر
 */

let html5QrCode = null;
let isScanning = false;
let currentVerifiedBooking = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. التحقق من صلاحية الموظف
  const user = getCurrentUser();
  const token = localStorage.getItem('alhijr_auth_token');

  if (!token || !user) {
    window.location.href = 'login.html?redirect=scanner.html';
    return;
  }

  document.getElementById('staff-welcome-text').textContent = `الموظف: ${user.full_name} (${user.role === 'ADMIN' ? 'مدير' : 'مشرف'})`;
  document.getElementById('btn-staff-logout').addEventListener('click', logout);

  setupManualInput();
  initCameraScanner();
});

// إعداد الإدخال اليدوي
function setupManualInput() {
  const manualBtn = document.getElementById('btn-manual-verify');
  const manualInput = document.getElementById('manual-code-input');

  manualBtn.addEventListener('click', () => {
    const code = manualInput.value.trim();
    if (!code) {
      showToast('يرجى كتابة رقم الحجز أو الرمز.', 'warning');
      return;
    }
    processQrData(code);
  });

  manualInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      manualBtn.click();
    }
  });

  document.getElementById('btn-toggle-camera').addEventListener('click', () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  });
}

// تهيئة ماسح الكاميرا عبر html5-qrcode
function initCameraScanner() {
  const readerEl = document.getElementById('reader');
  if (!readerEl) return;

  if (typeof Html5Qrcode === 'undefined') {
    document.getElementById('camera-status-text').textContent = 'الماسح اليدوي متاح (مكتبة الكاميرا غير محملة)';
    return;
  }

  html5QrCode = new Html5Qrcode('reader');
  startScanner();
}

// بدء تشغيل الكاميرا
function startScanner() {
  const config = {
    fps: 10,
    qrbox: { width: 220, height: 220 },
    aspectRatio: 1.0
  };

  html5QrCode.start(
    { facingMode: 'environment' }, // الكاميرا الخلفية للجوال
    config,
    (decodedText) => {
      // تم التقاط كود بنجاح
      console.log('QR Scanned:', decodedText);
      stopScanner();
      processQrData(decodedText);
    },
    (errorMessage) => {
      // أخطاء القراءة أثناء البحث المستمر (يتم تجاهلها لتجنب الإزعاج)
    }
  ).then(() => {
    isScanning = true;
    document.getElementById('camera-status-dot').style.background = 'var(--success)';
    document.getElementById('camera-status-text').textContent = 'الكاميرا تعمل وجاهزة للمسح';
    document.getElementById('scan-guide-box').style.display = 'block';
  }).catch((err) => {
    console.warn('تعذر فتح الكاميرا (ربما لا توجد كاميرا أو تم رفض الإذن):', err);
    isScanning = false;
    document.getElementById('camera-status-dot').style.background = 'var(--warning)';
    document.getElementById('camera-status-text').textContent = 'الكاميرا غير مفعلة (استخدم الإدخال اليدوي)';
    document.getElementById('scan-guide-box').style.display = 'none';
  });
}

// إيقاف الكاميرا مؤقتاً
function stopScanner() {
  if (html5QrCode && isScanning) {
    html5QrCode.stop().then(() => {
      isScanning = false;
      document.getElementById('camera-status-dot').style.background = '#94A3B8';
      document.getElementById('camera-status-text').textContent = 'الكاميرا متوقفة مؤقتاً';
      document.getElementById('scan-guide-box').style.display = 'none';
    }).catch(() => {});
  }
}

// إرسال الكود للتحقق منه عبر السيرفر
async function processQrData(qrCode) {
  const resultCard = document.getElementById('scan-result-card');
  resultCard.style.display = 'block';
  resultCard.className = 'result-modal result-warning';
  resultCard.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">جاري فحص وتدقيق الرمز في السجلات...</div>
    </div>
  `;

  try {
    const res = await apiRequest('/qr/verify', {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrCode })
    });

    if (res.success && res.result) {
      renderVerificationResult(res.result);
    }
  } catch (err) {
    showToast(err.message || 'فشل التحقق من الرمز.', 'error');
    renderErrorResult(err.message);
  }
}

// عرض بطاقة نتيجة الفحص بناءً على الحالة
function renderVerificationResult(res) {
  const card = document.getElementById('scan-result-card');
  card.style.display = 'block';

  const booking = res.booking;
  const app = res.appointment;

  // 1. حالة الحجز صالح ومؤكد
  if (res.status === 'VALID' && booking) {
    playSound('success');
    currentVerifiedBooking = booking;
    card.className = 'result-modal result-valid';

    const dateNoticeHtml = res.date_notice 
      ? `<div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; color: #92400E; font-size: 0.88rem; font-weight: 700;">⚠️ ${res.date_notice}</div>` 
      : '';

    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="width: 58px; height: 58px; background: #10B981; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 2rem; font-weight: 900;">
          ✓
        </div>
        <h3 style="color: #065F46; font-size: 1.6rem; margin-bottom: 4px;">الحجز صالح ومؤكد ✓</h3>
        <span style="font-family: monospace; font-size: 1.15rem; font-weight: 800; color: #047857; letter-spacing: 1px;">
          ${booking.booking_ref}
        </span>
      </div>

      ${dateNoticeHtml}

      <div style="background: #FFFFFF; border: 1px solid #A7F3D0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.95rem;">
          <div>
            <span style="color: #64748B; font-size: 0.8rem; display: block;">اسم الزائر:</span>
            <strong style="color: #065F46; font-size: 1.1rem;">${booking.full_name}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 0.8rem; display: block;">عدد الأفراد:</span>
            <strong style="color: #065F46; font-size: 1.1rem;">${booking.persons_count} أفراد</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 0.8rem; display: block;">الموعد:</span>
            <strong>${app ? `${app.date} (${formatSlotRange(app.start_time, app.end_time)})` : '-'}</strong>
          </div>
          <div>
            <span style="color: #64748B; font-size: 0.8rem; display: block;">الهوية:</span>
            <strong>${booking.national_id}</strong>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 12px;">
        <button type="button" id="btn-execute-checkin" class="btn btn-primary btn-lg" style="flex: 2; background: #059669;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>تسجيل الدخول الآن (Check-in)</span>
        </button>
        <button type="button" class="btn btn-secondary btn-next-scan" style="flex: 1;">
          مسح تالٍ
        </button>
      </div>
    `;

    document.getElementById('btn-execute-checkin').addEventListener('click', handleExecuteCheckIn);
    card.querySelector('.btn-next-scan').addEventListener('click', resetAndScanAgain);
    return;
  }

  // 2. حالة الحجز مستخدم مسبقاً
  if (res.status === 'ALREADY_USED') {
    playSound('warning');
    card.className = 'result-modal result-warning';
    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 3rem; margin-bottom: 6px;">⚠️</div>
        <h3 style="color: #92400E; font-size: 1.5rem; margin-bottom: 4px;">تم استخدام هذا الحجز مسبقًا!</h3>
        <p style="color: #B45309; font-weight: 700;">لا يُسمح بالدخول مرة أخرى بهذا الرمز.</p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="font-size: 0.92rem; margin-bottom: 6px;"><strong>صاحب الحجز:</strong> ${booking ? booking.full_name : '-'}</p>
        <p style="font-size: 0.92rem; margin-bottom: 6px;"><strong>رقم الحجز:</strong> ${booking ? booking.booking_ref : '-'}</p>
        <p style="font-size: 0.92rem; color: #DC2626;"><strong>تاريخ ووقت الاستخدام السابق:</strong> ${res.used_at ? res.used_at.replace('T', ' ').substring(0, 19) : 'مسجل كمستخدم'}</p>
      </div>

      <button type="button" class="btn btn-secondary btn-lg btn-block btn-next-scan">
        مسح تذكرة تالية
      </button>
    `;
    card.querySelector('.btn-next-scan').addEventListener('click', resetAndScanAgain);
    return;
  }

  // 3. حالة الحجز ملغى
  if (res.status === 'CANCELLED') {
    playSound('error');
    card.className = 'result-modal result-danger';
    card.innerHTML = `
      <div style="text-align: center; margin-bottom: 18px;">
        <div style="font-size: 3rem; margin-bottom: 6px;">✕</div>
        <h3 style="color: #991B1B; font-size: 1.5rem; margin-bottom: 4px;">الحجز ملغى رسميًا</h3>
        <p style="color: #B91C1C;">تم إلغاء هذه التذكرة مسبقًا والمقعد غير متاح.</p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <p style="font-size: 0.92rem; margin-bottom: 6px;"><strong>صاحب الحجز:</strong> ${booking ? booking.full_name : '-'}</p>
        <p style="font-size: 0.92rem;"><strong>رقم الحجز:</strong> ${booking ? booking.booking_ref : '-'}</p>
      </div>

      <button type="button" class="btn btn-secondary btn-lg btn-block btn-next-scan">
        مسح تذكرة تالية
      </button>
    `;
    card.querySelector('.btn-next-scan').addEventListener('click', resetAndScanAgain);
    return;
  }

  // 4. غير صالح أو غير مسجل
  renderErrorResult(res.message || 'رمز QR غير صالح أو غير مسجل في النظام.');
}

function renderErrorResult(message) {
  playSound('error');
  const card = document.getElementById('scan-result-card');
  card.className = 'result-modal result-danger';
  card.innerHTML = `
    <div style="text-align: center; margin-bottom: 18px;">
      <div style="font-size: 3rem; margin-bottom: 6px;">🚫</div>
      <h3 style="color: #991B1B; font-size: 1.4rem; margin-bottom: 4px;">رمز غير صالح</h3>
      <p style="color: #B91C1C;">${message}</p>
    </div>

    <button type="button" class="btn btn-secondary btn-lg btn-block btn-next-scan">
      إعادة المحاولة ومسح تذكرة تالية
    </button>
  `;
  card.querySelector('.btn-next-scan').addEventListener('click', resetAndScanAgain);
}

// تنفيذ عملية تسجيل الدخول الفعلية (Check-in)
async function handleExecuteCheckIn() {
  if (!currentVerifiedBooking) return;

  const btn = document.getElementById('btn-execute-checkin');
  btn.disabled = true;
  btn.textContent = 'جاري تسجيل الدخول...';

  try {
    const res = await apiRequest('/qr/check-in', {
      method: 'POST',
      body: JSON.stringify({ booking_id: currentVerifiedBooking.id })
    });

    if (res.success) {
      playSound('success');
      showToast('✓ تم تسجيل الدخول بنجاح! تفضل بالدخول.', 'success');
      btn.textContent = 'تم تسجيل الدخول بنجاح ✓';
      btn.style.background = '#047857';
      // تعطيل الزر لمنع الضغط مرة ثانية
      btn.disabled = true;
    }
  } catch (err) {
    showToast(err.message || 'فشل تسجيل الدخول.', 'error');
    btn.disabled = false;
    btn.textContent = 'إعادة المحاولة';
  }
}

// إعادة التهيئة للمسح التالي
function resetAndScanAgain() {
  document.getElementById('scan-result-card').style.display = 'none';
  document.getElementById('manual-code-input').value = '';
  currentVerifiedBooking = null;
  startScanner();
}
