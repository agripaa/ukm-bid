(() => {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3333/api';
    const landingPageUrl = '../../index.html';

    const statTotalBids = document.getElementById('statTotalBids');
    const statWonBids = document.getElementById('statWonBids');
    const statActiveOrders = document.getElementById('statActiveOrders');
    const statCompletedOrders = document.getElementById('statCompletedOrders');
    const tabMyBids = document.getElementById('tabMyBids');
    const tabOrders = document.getElementById('tabOrders');
    const tabHistory = document.getElementById('tabHistory');

    const orderList = document.getElementById('orderList');
    const orderLoading = document.getElementById('orderLoading');
    const orderEmpty = document.getElementById('orderEmpty');

    const proofModal = document.getElementById('proofModal');
    const proofSubtitle = proofModal?.querySelector('[data-proof-subtitle]');
    const proofForm = document.getElementById('proofForm');
    const proofPhoto = document.getElementById('proofPhoto');
    const proofNote = document.getElementById('proofNote');
    const proofAlert = document.getElementById('proofAlert');

    const DP_PERCENTAGE = 0.3;

    let merchantData = null;
    let ordersCache = new Map();
    let paymentsByOrder = new Map();
    let selectedOrder = null;

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

    const ensureMerchantAccess = () => {
        const token = localStorage.getItem('bidfix_token');
        const user = getStoredUser();
        if (!token || !user || user.role !== 'merchant') {
            redirectToLanding();
            return null;
        }
        return { token, user };
    };

    const getAuthHeaders = () => {
        const auth = ensureMerchantAccess();
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

    const postJson = async (url, payload) => {
        const authHeaders = getAuthHeaders();
        if (!authHeaders) {
            throw new Error('Unauthorized');
        }
        const response = await fetch(url, {
            method: 'POST',
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
            return '-';
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

    const formatDate = (value) => {
        if (!value) {
            return '-';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatEtaDays = (etaValue) => {
        if (!etaValue) {
            return '-';
        }
        const etaDate = new Date(etaValue);
        if (Number.isNaN(etaDate.getTime())) {
            return etaValue;
        }
        const now = new Date();
        const diffMs = etaDate.getTime() - now.getTime();
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        return `${diffDays} Hari`;
    };

    const showLoading = (isLoading) => {
        if (orderLoading) {
            orderLoading.classList.toggle('is-visible', isLoading);
        }
    };

    const showEmpty = (isEmpty) => {
        if (orderEmpty) {
            orderEmpty.classList.toggle('is-visible', isEmpty);
        }
    };

    const updateBodyModalState = () => {
        const isOpen = proofModal?.classList.contains('is-open');
        document.body.classList.toggle('modal-open', Boolean(isOpen));
    };

    const openProofModal = (order) => {
        if (!proofModal) {
            return;
        }
        selectedOrder = order;
        if (proofSubtitle) {
            proofSubtitle.textContent = `Order #${order.id} - ${order?.Request?.title || 'Permintaan layanan'}`;
        }
        if (proofForm) {
            proofForm.reset();
        }
        clearProofAlert();
        proofModal.classList.add('is-open');
        proofModal.setAttribute('aria-hidden', 'false');
        updateBodyModalState();
    };

    const closeProofModal = () => {
        if (!proofModal) {
            return;
        }
        proofModal.classList.remove('is-open');
        proofModal.setAttribute('aria-hidden', 'true');
        updateBodyModalState();
        selectedOrder = null;
    };

    const showProofAlert = (type, message) => {
        if (!proofAlert) {
            return;
        }
        proofAlert.textContent = message;
        proofAlert.classList.toggle('is-error', type === 'error');
        proofAlert.classList.toggle('is-success', type === 'success');
        proofAlert.classList.add('is-visible');
    };

    const clearProofAlert = () => {
        if (!proofAlert) {
            return;
        }
        proofAlert.textContent = '';
        proofAlert.classList.remove('is-visible', 'is-error', 'is-success');
    };

    const getPaymentState = (orderId) => {
        return paymentsByOrder.get(orderId) || { dpPaid: false, finalPaid: false };
    };

    const getOrderBadge = (order) => {
        const paymentState = getPaymentState(order.id);
        if (paymentState.finalPaid || order.status === 'completed') {
            return { label: 'Selesai', className: 'status-done' };
        }
        if (order.status === 'awaiting_confirmation') {
            return { label: 'Menunggu Pelunasan', className: 'status-settle' };
        }
        if (order.status === 'in_progress') {
            return { label: 'Dalam Pengerjaan', className: 'status-progress' };
        }
        if (paymentState.dpPaid) {
            return { label: 'DP Dibayar - Siap Dikerjakan', className: 'status-ready' };
        }
        return { label: 'Menunggu Pembayaran', className: 'status-payment' };
    };

    const getOrderAction = (order) => {
        const paymentState = getPaymentState(order.id);
        if (paymentState.finalPaid || order.status === 'completed') {
            return { label: 'Selesai', disabled: true };
        }
        if (order.status === 'awaiting_confirmation') {
            return { label: 'Menunggu Pelunasan', disabled: true };
        }
        if (order.status === 'in_progress') {
            return { label: 'Upload Bukti Kerja', action: 'upload', disabled: false };
        }
        if (!paymentState.dpPaid) {
            return { label: 'Mulai Pengerjaan', disabled: true };
        }
        return { label: 'Mulai Pengerjaan', action: 'start', disabled: false };
    };

    const renderStats = (bids, orders) => {
        const orderedRequestIds = new Set(orders.map((order) => order.request_id));
        const totalBids = bids.filter((bid) => bid.merchant_id === merchantData?.id).length;
        const visibleBids = bids.filter(
            (bid) => bid.merchant_id === merchantData?.id && !orderedRequestIds.has(bid.request_id)
        ).length;
        const wonBids = bids.filter((bid) => bid.merchant_id === merchantData?.id && bid.is_selected).length;
        const activeOrders = orders.filter((order) => ['dp_paid', 'in_progress', 'awaiting_confirmation'].includes(order.status)).length;
        const completedOrders = orders.filter((order) => order.status === 'completed').length;

        if (statTotalBids) {
            statTotalBids.textContent = totalBids;
        }
        if (statWonBids) {
            statWonBids.textContent = wonBids;
        }
        if (statActiveOrders) {
            statActiveOrders.textContent = activeOrders;
        }
        if (statCompletedOrders) {
            statCompletedOrders.textContent = completedOrders;
        }
        if (tabMyBids) {
            tabMyBids.textContent = visibleBids;
        }
        if (tabOrders) {
            tabOrders.textContent = activeOrders;
        }
        if (tabHistory) {
            tabHistory.textContent = completedOrders;
        }
    };

    const renderOrders = (orders) => {
        if (!orderList) {
            return;
        }
        orderList.innerHTML = '';

        const visibleOrders = orders.filter((order) => order.status !== 'completed');

        if (!visibleOrders.length) {
            showEmpty(true);
            return;
        }
        showEmpty(false);

        visibleOrders.forEach((order) => {
            const request = order.Request || {};
            const bid = order.Bid || {};
            const userName = request.User?.name || 'User';
            const badge = getOrderBadge(order);
            const action = getOrderAction(order);
            const totalPrice = Number(order.total_price) || 0;
            const dpAmount = Number(order.dp_amount) || Math.round(totalPrice * DP_PERCENTAGE);
            const etaText = bid.eta ? formatEtaDays(bid.eta) : '-';

            const card = document.createElement('article');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <h3 class="order-title">${request.title || 'Permintaan layanan'}</h3>
                        <div class="order-subtitle">Pemesan: ${userName}</div>
                    </div>
                    <span class="order-status ${badge.className}">${badge.label}</span>
                </div>
                <div class="order-meta">
                    <div class="order-meta-item"><i class="fa-solid fa-user" aria-hidden="true"></i>${userName}</div>
                    <div class="order-meta-item"><i class="fa-solid fa-wallet" aria-hidden="true"></i>Total: ${formatCurrency(totalPrice)}</div>
                    <div class="order-meta-item"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i>DP: ${formatCurrency(dpAmount)}</div>
                    <div class="order-meta-item"><i class="fa-solid fa-clock" aria-hidden="true"></i>ETA: ${etaText}</div>
                </div>
                <div class="order-actions">
                    <button class="btn-primary" data-order-id="${order.id}" ${action.action ? `data-order-action="${action.action}"` : ''} ${action.disabled ? 'disabled' : ''}>
                        ${action.label}
                    </button>
                </div>
            `;
            orderList.appendChild(card);
        });
    };

    const loadMerchant = async () => {
        const auth = ensureMerchantAccess();
        if (!auth) {
            return null;
        }
        const merchants = await fetchJson(`${API_BASE}/merchants?user_id=${auth.user.id}`);
        if (Array.isArray(merchants) && merchants.length > 0) {
            return merchants[0];
        }

        const businessName = auth.user.name || auth.user.email || `Merchant ${auth.user.id}`;
        const created = await postJson(`${API_BASE}/merchants`, {
            user_id: auth.user.id,
            business_name: businessName,
        });
        return created;
    };

    const loadBids = async () => {
        const bids = await fetchJson(`${API_BASE}/bids`);
        return bids;
    };

    const loadOrders = async () => {
        if (!merchantData?.id) {
            return [];
        }
        const orders = await fetchJson(`${API_BASE}/orders?merchant_id=${merchantData.id}`);
        ordersCache = new Map(orders.map((order) => [order.id, order]));
        return orders;
    };

    const loadPayments = async () => {
        if (!merchantData?.id) {
            return [];
        }
        const payments = await fetchJson(`${API_BASE}/payments?merchant_id=${merchantData.id}`);
        paymentsByOrder = new Map();
        payments.forEach((payment) => {
            if (!payment.order_id) {
                return;
            }
            const summary = paymentsByOrder.get(payment.order_id) || { dpPaid: false, finalPaid: false };
            if (payment.type === 'dp' && payment.status === 'succeeded') {
                summary.dpPaid = true;
            }
            if (payment.type === 'final' && payment.status === 'succeeded') {
                summary.finalPaid = true;
            }
            paymentsByOrder.set(payment.order_id, summary);
        });
        return payments;
    };

    const refreshData = async () => {
        showLoading(true);
        showEmpty(false);
        try {
            if (!merchantData) {
                merchantData = await loadMerchant();
            }
            const [bids, orders] = await Promise.all([loadBids(), loadOrders(), loadPayments()]);
            renderOrders(orders);
            renderStats(bids, orders);
        } catch (error) {
            showEmpty(true);
            if (orderEmpty) {
                orderEmpty.textContent = 'Gagal memuat order.';
            }
        } finally {
            showLoading(false);
        }
    };

    const startOrder = async (orderId) => {
        const order = ordersCache.get(orderId);
        if (!order) {
            return;
        }
        await putJson(`${API_BASE}/orders/${orderId}`, {
            status: 'in_progress',
            scheduled_at: new Date().toISOString(),
        });
        await refreshData();
    };

    const submitProof = async () => {
        if (!selectedOrder) {
            return;
        }
        const photoUrl = proofPhoto?.value.trim();
        if (!photoUrl) {
            showProofAlert('error', 'Link foto bukti wajib diisi.');
            return;
        }
        const noteValue = proofNote?.value.trim();
        const payload = [
            {
                url: photoUrl,
                note: noteValue || null,
                uploaded_at: new Date().toISOString(),
            },
        ];

        await putJson(`${API_BASE}/orders/${selectedOrder.id}`, {
            status: 'awaiting_confirmation',
            proof_photos: payload,
        });
        showProofAlert('success', 'Bukti kerja berhasil dikirim.');
        await refreshData();
        setTimeout(closeProofModal, 600);
    };

    if (orderList) {
        orderList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-order-id]');
            if (!button) {
                return;
            }
            const orderId = Number(button.dataset.orderId);
            const action = button.dataset.orderAction;
            if (!orderId) {
                return;
            }
            if (action === 'start') {
                startOrder(orderId);
                return;
            }
            if (action === 'upload') {
                const order = ordersCache.get(orderId);
                if (order) {
                    openProofModal(order);
                }
            }
        });
    }

    if (proofModal) {
        proofModal.querySelectorAll('[data-proof-close]').forEach((button) => {
            button.addEventListener('click', closeProofModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && proofModal.classList.contains('is-open')) {
                closeProofModal();
            }
        });
    }

    if (proofForm) {
        proofForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearProofAlert();
            try {
                await submitProof();
            } catch (error) {
                showProofAlert('error', error.message || 'Gagal mengirim bukti kerja.');
            }
        });
    }

    const init = async () => {
        const auth = ensureMerchantAccess();
        if (!auth) {
            return;
        }
        await refreshData();
    };

    init();
})();
