// CoffeBuck Client-Side Authentication
// localStorage-based demo auth with session management
// Exposes window.AuthClient with public API

(function() {
  'use strict';

  const USERS_KEY = 'coffebuck_users_v1';
  const CURRENT_USER_KEY = 'coffebuck_current_user_v1';

  // Simple hash function (NOT production-safe, demo only)
  function hashPass(password) {
    return btoa(password); // Basic encoding, reversible
  }

  // Load all users from localStorage
  function loadUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  // Save users to localStorage
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Find user by email
  function findByEmail(email) {
    var users = loadUsers();
    return users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
  }

  // Generate unique ID
  function generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Clean user object for session storage
  function safeUser(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      orders: user.orders || []
    };
  }

  // Signup: register new user
  function signup(opts) {
    return new Promise(function(resolve, reject) {
      opts = opts || {};
      var username = (opts.username || '').trim();
      var email = (opts.email || '').trim();
      var password = opts.password || '';

      // Validate
      if (!username || username.length < 2) {
        return reject(new Error('Username must be at least 2 characters'));
      }
      if (!email || email.indexOf('@') === -1) {
        return reject(new Error('Please enter a valid email'));
      }
      if (!password || password.length < 4) {
        return reject(new Error('Password must be at least 4 characters'));
      }

      // Check if email already exists
      if (findByEmail(email)) {
        return reject(new Error('Email already registered'));
      }

      // Create new user
      var users = loadUsers();
      var newUser = {
        id: generateId(),
        username: username,
        email: email,
        passwordHash: hashPass(password),
        orders: []
      };
      users.push(newUser);
      saveUsers(users);

      // Set as current user
      setCurrent(newUser);

      resolve(safeUser(newUser));
    });
  }

  // Login: authenticate user
  function login(opts) {
    return new Promise(function(resolve, reject) {
      opts = opts || {};
      var email = (opts.email || '').trim();
      var password = opts.password || '';

      // Validate
      if (!email) {
        return reject(new Error('Please enter your email'));
      }
      if (!password) {
        return reject(new Error('Please enter your password'));
      }

      // Find user
      var user = findByEmail(email);
      if (!user) {
        return reject(new Error('Email not found'));
      }

      // Verify password
      if (hashPass(password) !== user.passwordHash) {
        return reject(new Error('Incorrect password'));
      }

      // Set as current user
      setCurrent(user);
      resolve(safeUser(user));
    });
  }

  // Logout: clear current session
  function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    updateHeaderUI();
    window.location.href = 'index.html';
  }

  // Get current logged-in user
  function getCurrent() {
    try {
      var raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // Set current user (internal)
  function setCurrent(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser(user)));
    updateHeaderUI();
  }

  // Require authentication (redirect if not logged in)
  function requireAuth() {
    var current = getCurrent();
    if (!current) {
      var redirect = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = 'auth.html?redirect=' + redirect;
      return null;
    }
    return current;
  }

  // Update header UI (show user or login/signup buttons)
  function updateHeaderUI() {
    var container = document.getElementById('user-area');
    if (!container) return;

    var current = getCurrent();
    container.innerHTML = '';

    if (current) {
      // Logged in: show username and logout
      var wrapper = document.createElement('div');
      wrapper.className = 'flex items-center gap-4';
      wrapper.innerHTML = '<span class="text-sm font-medium">Hi, ' + escapeHtml(current.username) + '</span>';
  var profileBtn = document.createElement('a');
  profileBtn.href = 'profile.html';
  profileBtn.className = 'text-sm font-medium hover:text-[var(--brand)] transition nav-link';
  profileBtn.innerText = 'Profile';


      var logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-primary text-sm px-3 py-1';
      logoutBtn.innerText = 'Logout';
      logoutBtn.onclick = function() { logout(); };
  wrapper.appendChild(profileBtn);

      wrapper.appendChild(logoutBtn);
      container.appendChild(wrapper);
    } else {
      // Not logged in: show login/signup buttons
      var wrapper = document.createElement('div');
      wrapper.className = 'flex items-center gap-3';

      var loginBtn = document.createElement('a');
      loginBtn.href = 'auth.html?mode=login';
      loginBtn.className = 'text-sm font-medium hover:text-[var(--brand)] transition';
      loginBtn.innerText = 'Login';

      var signupBtn = document.createElement('a');
      signupBtn.href = 'auth.html?mode=signup';
      signupBtn.className = 'btn-primary text-sm px-4 py-2';
      signupBtn.innerText = 'Sign Up';

      wrapper.appendChild(loginBtn);
      wrapper.appendChild(signupBtn);
      container.appendChild(wrapper);
    }

    // Update homepage greeting
    updateHomeGreeting();
  }

  // Update homepage greeting
  function updateHomeGreeting() {
    var greeting = document.getElementById('cb-welcome');
    if (!greeting) return;

    var current = getCurrent();
    if (current) {
      greeting.innerText = 'Welcome back, ' + escapeHtml(current.username) + '! ☕';
    } else {
      greeting.innerText = '';
    }
  }

  // Simple HTML escape
  function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', function() {
    updateHeaderUI();
  });

  // Expose public API
  window.AuthClient = {
    signup: signup,
    login: login,
    logout: logout,
    getCurrent: getCurrent,
    requireAuth: requireAuth,
    updateHeaderUI: updateHeaderUI
  };

})();
