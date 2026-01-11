(() => {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3333/api';
    const landingPageUrl = '../../index.html';

    const statPending = document.getElementById('statPending');
    const statMerchants = document.getElementById('statMerchants');
    const statTransactions = document.getElementById('statTransactions');
    const statRevenue = document.getElementById('statRevenue');
    const navVerifyCount = document.getElementById('navVerifyCount');

    const verifyList = document.getElementById('verifyList');
    const verifyEmpty = document.getElementById('verifyEmpty');

    const modal = document.getElementById('verifyModal');
    const nameEl = modal?.querySelector('[data-verify-name]');
    const ownerEl = modal?.querySelector('[data-verify-owner]');
    const emailEl = modal?.querySelector('[data-verify-email]');
    const phoneEl = modal?.querySelector('[data-verify-phone]');
    const categoryEl = modal?.querySelector('[data-verify-category]');
    const addressEl = modal?.querySelector('[data-verify-address]');

    let pendingMerchants = [];
    let activeMerchant = null;

    const redirectToLanding = () => {
        window.location.href = landingPageUrl;
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

    const ensureAdminAccess = () => {
        const token = localStorage.getItem('bidfix_token');
        const user = getStoredUser();
        if (!token || !user || user.role !== 'admin') {
            redirectToLanding();
            return null;
        }
        return { token };
    };

    const getAuthHeaders = () => {
        const auth = ensureAdminAccess();
        if (!auth) {
            return null;
        }
        return { Authorization: `Bearer ${auth.token}` };
    };

    const fetchJson = async (url) => {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Unauthorized');
        }
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLanding();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Request failed');
        }
        return response.json();
    };

    const putJson = async (url, payload) => {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Unauthorized');
        }
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
            },
            body: JSON.stringify(payload),
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLanding();
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(errorBody.message || 'Request failed');
        }
        return response.json();
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined || value === '') {
            return 'Rp 0';
        }
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) {
            return String(value);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(numberValue);
    };

    const sumPayments = (payments) => {
        return payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    };

    const setText = (el, value) => {
        if (el) {
            el.textContent = value;
        }
    };

    const updatePendingCount = () => {
        const pendingCount = pendingMerchants.length;
        setText(statPending, pendingCount);
        setText(navVerifyCount, pendingCount);
        if (verifyEmpty) {
            verifyEmpty.classList.toggle('is-visible', pendingCount === 0);
        }
    };

    const renderList = () => {
        if (!verifyList) {
            return;
        }
        verifyList.innerHTML = '';
        pendingMerchants.forEach((merchant) => {
            const card = document.createElement('article');
            card.className = 'merchant-card';
            card.innerHTML = `
                <div class="merchant-header">
                    <div>
                        <h3>${merchant.businessName}</h3>
                        <p>Owner: ${merchant.owner}</p>
                    </div>
                    <span class="status-badge pending">Pending</span>
                </div>
                <div class="merchant-details">
                    <div class="detail-item"><i class="fa-solid fa-envelope"></i> ${merchant.email || '-'}</div>
                    <div class="detail-item"><i class="fa-solid fa-phone"></i> ${merchant.phone || '-'}</div>
                    <div class="detail-item"><i class="fa-solid fa-layer-group"></i> ${merchant.category || '-'}</div>
                    <div class="detail-item"><i class="fa-solid fa-location-dot"></i> ${merchant.address || '-'}</div>
                </div>
                <button class="btn-primary" type="button" data-verify-open data-user-id="${merchant.userId}">
                    <i class="fa-solid fa-eye"></i>
                    Lihat Detail & Verifikasi
                </button>
            `;
            verifyList.appendChild(card);
        });
        updatePendingCount();
    };

    const openModal = (merchant) => {
        if (!modal) {
            return;
        }
        activeMerchant = merchant;
        setText(nameEl, merchant.businessName);
        setText(ownerEl, merchant.owner);
        setText(emailEl, merchant.email || '-');
        setText(phoneEl, merchant.phone || '-');
        setText(categoryEl, merchant.category || '-');
        setText(addressEl, merchant.address || '-');
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        if (!modal) {
            return;
        }
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        activeMerchant = null;
    };

    const handleDecision = async (action) => {
        if (!activeMerchant) {
            return;
        }
        if (action === 'approve') {
            await putJson(`${API_BASE}/users/${activeMerchant.userId}`, { verified: true });
        }
        pendingMerchants = pendingMerchants.filter((item) => item.userId !== activeMerchant.userId);
        renderList();
        closeModal();
    };

    const buildMerchantList = (pendingUsers, merchants) => {
        const merchantMap = new Map(merchants.map((merchant) => [merchant.user_id, merchant]));
        pendingMerchants = pendingUsers.map((user) => {
            const merchant = merchantMap.get(user.id);
            const categoryList = Array.isArray(merchant?.category_list)
                ? merchant.category_list.join(', ')
                : merchant?.category_list || '';
            return {
                userId: user.id,
                businessName: merchant?.business_name || user.name || 'Merchant',
                owner: user.name || '-',
                email: user.email || '-',
                phone: user.phone || '-',
                address: user.address || '-',
                category: categoryList || '-',
            };
        });
        renderList();
    };

    const loadData = async () => {
        const [pendingUsers, merchants, orders, payments] = await Promise.all([
            fetchJson(`${API_BASE}/users?role=merchant&verified=false`),
            fetchJson(`${API_BASE}/users?role=merchant`),
            fetchJson(`${API_BASE}/orders`),
            fetchJson(`${API_BASE}/payments?status=succeeded`),
            fetchJson(`${API_BASE}/merchants`),
        ]);

        setText(statMerchants, merchants.length);
        setText(statTransactions, orders.length);
        setText(statRevenue, formatCurrency(sumPayments(payments)));
        buildMerchantList(pendingUsers, payments && merchants ? merchants : merchants,);
    };

    const init = async () => {
        const auth = ensureAdminAccess();
        if (!auth) {
            return;
        }
        const [pendingUsers, merchants, orders, payments, merchantData] = await Promise.all([
            fetchJson(`${API_BASE}/users?role=merchant&verified=false`),
            fetchJson(`${API_BASE}/users?role=merchant`),
            fetchJson(`${API_BASE}/orders`),
            fetchJson(`${API_BASE}/payments?status=succeeded`),
            fetchJson(`${API_BASE}/merchants`),
        ]);

        setText(statMerchants, merchants.length);
        setText(statTransactions, orders.length);
        setText(statRevenue, formatCurrency(sumPayments(payments)));
        buildMerchantList(pendingUsers, merchantData);
    };

    if (verifyList) {
        verifyList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-verify-open]');
            if (!button) {
                return;
            }
            const userId = Number(button.dataset.userId);
            const merchant = pendingMerchants.find((item) => item.userId === userId);
            if (merchant) {
                openModal(merchant);
            }
        });
    }

    if (modal) {
        modal.querySelectorAll('[data-verify-close]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        modal.querySelectorAll('[data-verify-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.verifyAction;
                handleDecision(action);
            });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    init();
})();
