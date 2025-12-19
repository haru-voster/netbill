// Simple frontend logic calling the backend API served from the same origin.
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  /* ======================
     LOGIN PAGE LOGIC
     ====================== */
  const loginBtn = $('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const username = $('username').value.trim();

      if (!username) {
        alert('Enter username');
        return;
      }

      // save user
      localStorage.setItem('wifi_username', username);

      // redirect to dashboard
      window.location.href = 'dashboard.html';
    });
  }

  /* ======================
     DASHBOARD PROTECTION
     ====================== */
  if (window.location.pathname.endsWith('dashboard.html')) {
    const username = localStorage.getItem('wifi_username');
    if (!username) {
      window.location.href = 'index.html';
      return;
    }

    const userLabel = $('currentUser');
    if (userLabel) userLabel.textContent = username;
  }

  /* ======================
     DEMO PAYMENT LOGIC
     ====================== */
  const payBtn = $('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const username = localStorage.getItem('wifi_username');
      if (!username) {
        alert('Not logged in');
        return;
      }

      const packageId = $('packageSelect').value;
      let phone = $('phone').value.trim();

      if (phone && phone.startsWith('0')) {
        phone = '254' + phone.slice(1);
      }

      // Fake access code (demo)
      const code = 'WIFI-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const result = $('result');
      result.innerHTML = `
        <div class="alert alert-success">
          <strong>Access Code:</strong> ${code}<br>
          <small>Expires: ${expiry.toLocaleString()}</small>
        </div>
      `;

      saveCode({ code, username, expiry });
      loadCodes();
    });
  }

  /* ======================
     LOGOUT
     ====================== */
  const logoutBtn = $('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('wifi_username');
      window.location.href = 'index.html';
    });
  }

  /* ======================
     CODE STORAGE (LOCAL)
     ====================== */
  function saveCode(session) {
    const sessions = JSON.parse(localStorage.getItem('wifi_sessions') || '{}');
    sessions[session.code] = session;
    localStorage.setItem('wifi_sessions', JSON.stringify(sessions));
  }

  function loadCodes() {
    const ul = $('codesList');
    if (!ul) return;

    ul.innerHTML = '';
    const sessions = JSON.parse(localStorage.getItem('wifi_sessions') || '{}');

    Object.keys(sessions).forEach(code => {
      const s = sessions[code];
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `
        <span>${code} — ${s.username}</span>
        <small>Expires: ${new Date(s.expiry).toLocaleString()}</small>
      `;
      ul.appendChild(li);
    });
  }

  // Auto-load codes on dashboard
  if (window.location.pathname.endsWith('dashboard.html')) {
    loadCodes();
  }

})();
