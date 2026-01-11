(() => {
    const modal = document.getElementById('authModal');
    if (!modal) {
        return;
    }

    const body = document.body;
    const API_BASE = window.API_BASE_URL || 'http://localhost:3333/api';
    const subtitle = modal.querySelector('[data-auth-subtitle]');
    const tabButtons = Array.from(modal.querySelectorAll('[data-auth-tab]'));
    const panels = Array.from(modal.querySelectorAll('[data-auth-panel]'));
    const roleRoutes = {
        user: './user/dashboard/index.html',
        merchant: './merchant/dashboard/index.html',
        admin: './admin/dashboard/index.html',
    };

    const subtitles = {
        login: 'Masuk ke akun Anda',
        register: 'Buat akun baru',
    };

    const getStoredUser = () => {
        const raw = localStorage.getItem('bidfix_user');
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    };

    const redirectToDashboard = (role) => {
        const target = roleRoutes[role];
        if (!target) {
            return false;
        }
        window.location.href = target;
        return true;
    };

    const setActiveTab = (tabName) => {
        tabButtons.forEach((button) => {
            button.classList.toggle('is-active', button.dataset.authTab === tabName);
        });

        panels.forEach((panel) => {
            panel.classList.toggle('is-active', panel.dataset.authPanel === tabName);
        });

        if (subtitle && subtitles[tabName]) {
            subtitle.textContent = subtitles[tabName];
        }

        clearAlert('login');
        clearAlert('register');
    };

    const openModal = (tabName = 'login') => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        body.classList.add('is-auth-open');
        setActiveTab(tabName);
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        body.classList.remove('is-auth-open');
    };

    const clearAlert = (formName) => {
        const alertEl = modal.querySelector(`[data-auth-alert="${formName}"]`);
        if (!alertEl) {
            return;
        }
        alertEl.textContent = '';
        alertEl.classList.remove('is-visible', 'is-error', 'is-success');
    };

    const showAlert = (formName, type, message) => {
        const alertEl = modal.querySelector(`[data-auth-alert="${formName}"]`);
        if (!alertEl) {
            return;
        }
        alertEl.textContent = message;
        alertEl.classList.toggle('is-error', type === 'error');
        alertEl.classList.toggle('is-success', type === 'success');
        alertEl.classList.add('is-visible');
    };

    document.querySelectorAll('[data-auth-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', () => {
            const targetTab = trigger.dataset.authTarget || 'login';
            openModal(targetTab);
        });
    });

    document.querySelectorAll('[data-dashboard-trigger]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            const storedUser = getStoredUser();
            if (storedUser && storedUser.role && redirectToDashboard(storedUser.role)) {
                return;
            }
            const targetTab = trigger.dataset.authTarget || 'login';
            openModal(targetTab);
        });
    });

    modal.querySelectorAll('[data-auth-close]').forEach((button) => {
        button.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            setActiveTab(button.dataset.authTab);
        });
    });

    modal.querySelectorAll('[data-toggle-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.toggleTarget;
            const input = modal.querySelector(`#${targetId}`);
            if (!input) {
                return;
            }
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            button.classList.toggle('is-visible', !isVisible);
            button.setAttribute('aria-pressed', String(!isVisible));
            button.setAttribute('aria-label', isVisible ? 'Tampilkan password' : 'Sembunyikan password');
        });
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAlert('login');

            const email = loginForm.querySelector('[name="email"]').value.trim();
            const password = loginForm.querySelector('[name="password"]').value;

            if (!email || !password) {
                showAlert('login', 'error', 'Email dan password wajib diisi.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showAlert('login', 'error', data.message || 'Login gagal.');
                    return;
                }

                if (data.token) {
                    localStorage.setItem('bidfix_token', data.token);
                }

                if (data.user) {
                    localStorage.setItem('bidfix_user', JSON.stringify(data.user));
                }

                if (data.user && redirectToDashboard(data.user.role)) {
                    return;
                }

                showAlert('login', 'success', 'Login berhasil.');
            } catch (error) {
                showAlert('login', 'error', 'Tidak dapat terhubung ke server.');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearAlert('register');

            const name = registerForm.querySelector('[name="name"]').value.trim();
            const email = registerForm.querySelector('[name="email"]').value.trim();
            const phone = registerForm.querySelector('[name="phone"]').value.trim();
            const address = registerForm.querySelector('[name="address"]').value.trim();
            const password = registerForm.querySelector('[name="password"]').value;
            const confirmPassword = registerForm.querySelector('[name="confirmPassword"]').value;
            const role = registerForm.querySelector('[name="role"]:checked').value;

            if (!name || !email || !phone || !password || !confirmPassword) {
                showAlert('register', 'error', 'Lengkapi semua field wajib.');
                return;
            }

            if (password.length < 6) {
                showAlert('register', 'error', 'Password minimal 6 karakter.');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('register', 'error', 'Konfirmasi password tidak sama.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        address,
                        password,
                        role,
                    }),
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    showAlert('register', 'error', data.message || 'Registrasi gagal.');
                    return;
                }

                if (data.token) {
                    localStorage.setItem('bidfix_token', data.token);
                }

                if (data.user) {
                    localStorage.setItem('bidfix_user', JSON.stringify(data.user));
                }

                const resolvedRole = (data.user && data.user.role) || role;
                if (redirectToDashboard(resolvedRole)) {
                    return;
                }

                if (resolvedRole === 'merchant' && data.user && !data.user.verified) {
                    showAlert('register', 'success', 'Registrasi merchant berhasil. Menunggu verifikasi admin.');
                    return;
                }

                if (data.token) {
                    showAlert('register', 'success', 'Registrasi berhasil. Anda sudah login.');
                } else {
                    showAlert('register', 'success', 'Registrasi berhasil. Silakan login.');
                }
            } catch (error) {
                showAlert('register', 'error', 'Tidak dapat terhubung ke server.');
            }
        });
    }
})();
