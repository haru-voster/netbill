// Simple frontend logic calling the backend API served from the same origin.
(function(){
  function $(id){ return document.getElementById(id); }

  // Save username & redirect
  const loginBtn = $('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = $('username').value.trim();
      if (!username) return alert('Enter username');
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('wifi_username', username);
        window.location = '/dashboard.html';
      } else {
        alert('Login failed');
      }
    });
  }

  // Dashboard logic
  const payBtn = $('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', async () => {
      const username = localStorage.getItem('wifi_username');
      if (!username) return alert('Not logged in');

      const packageId = $('packageSelect').value;
      let phone = $('phone').value.trim();
      if (!phone) {
        phone = undefined;
      } else {
        // if starts with 0, convert to 254...
        if (phone.startsWith('0')) {
          phone = '254' + phone.slice(1);
        }
      }

      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username, packageId, phone })
      });
      const data = await res.json();
      const result = $('result');
      if (!data.success) {
        result.innerHTML = '<div class="alert alert-danger">Payment request failed: ' + (data.error||'') + '</div>';
        return;
      }
      result.innerHTML = '<div class="alert alert-success">Access Code: <strong>' + data.code + '</strong><br>Expires: ' + new Date(data.expiry).toLocaleString() + '</div>';
      loadCodes();
    });
  }

  // logout
  const logoutBtn = $('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('wifi_username');
      window.location = '/';
    });
  }

  // load active codes
  async function loadCodes(){
    const ul = $('codesList');
    ul.innerHTML = '';
    const res = await fetch('/api/list-sessions');
    // /api/list-sessions may not exist on server; use manual fetch of db if available
    // We'll call /api/cleanup then fetch /api/sessions (not implemented) - fallback: show nothing
    // For now, poll the backend db.json directly (works when backend serves static repo)
    try {
      const resp = await fetch('/db.json');
      const db = await resp.json();
      const now = Date.now();
      Object.keys(db.sessions || {}).forEach(code => {
        const s = db.sessions[code];
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = code + ' — ' + s.username;
        const small = document.createElement('small');
        small.textContent = 'Expires: ' + new Date(s.expiry).toLocaleString();
        li.appendChild(small);
        ul.appendChild(li);
      });
    } catch (e) {
      // ignore
    }
  }

  if (window.location.pathname === '/dashboard.html') {
    const username = localStorage.getItem('wifi_username');
    if (!username) window.location = '/';
    $('phone').value = '';
    loadCodes();
  }
})();
