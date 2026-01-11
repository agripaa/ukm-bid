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

    const historyList = document.getElementById('historyList');
    const historyLoading = document.getElementById('historyLoading');
    const historyEmpty = document.getElementById('historyEmpty');

    const historyModal = document.getElementById('historyModal');
    const historyTitle = historyModal?.querySelector('[data-history-title]');
    const historyCategory = historyModal?.querySelector('[data-history-category]');
    const historyStatus = historyModal?.querySelector('[data-history-status]');
    const historyLocation = historyModal?.querySelector('[data-history-location]');
    const historyBudget = historyModal?.querySelector('[data-history-budget]');
    const historyUser = historyModal?.querySelector('[data-history-user]');
    const historyCompleted = historyModal?.querySelector('[data-history-completed]');
    const historyDescription = historyModal?.querySelector('[data-history-description]');
    const historyTotal = historyModal?.querySelector('[data-history-total]');
    const historyDp = historyModal?.querySelector('[data-history-dp]');
    const historyEta = historyModal?.querySelector('[data-history-eta]');
    const historyProof = historyModal?.querySelector('[data-history-proof]');
    const historyNote = historyModal?.querySelector('[data-history-note]');

    let categoryMap = new Map();
    let merchantData = null;
    let ordersCache = new Map();

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

    const formatLocation = (request) => {
        const address = request?.User?.address || request?.user?.address;
        if (address) {
            return address;
        }
        if (request?.location_lat && request?.location_lng) {
            return `${request.location_lat}, ${request.location_lng}`;
        }
        return 'Alamat belum diisi';
    };

    const showLoading = (isLoading) => {
        if (historyLoading) {
            historyLoading.classList.toggle('is-visible', isLoading);
        }
    };

    const showEmpty = (isEmpty) => {
        if (historyEmpty) {
            historyEmpty.classList.toggle('is-visible', isEmpty);
        }
    };

    const openModal = () => {
        if (!historyModal) {
            return;
        }
        historyModal.classList.add('is-open');
        historyModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        if (!historyModal) {
            return;
        }
        historyModal.classList.remove('is-open');
        historyModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
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

    const renderHistory = (orders) => {
        if (!historyList) {
            return;
        }
        historyList.innerHTML = '';

        const completedOrders = orders.filter((order) => order.status === 'completed');
        if (!completedOrders.length) {
            showEmpty(true);
            return;
        }
        showEmpty(false);

        completedOrders.forEach((order) => {
            const request = order.Request || {};
            const categoryName = categoryMap.get(request.category_id) || 'Kategori';
            const card = document.createElement('article');
            card.className = 'request-card';
            card.innerHTML = `
                <span class="request-category">${categoryName}</span>
                <h3 class="request-title">${request.title || 'Judul belum tersedia'}</h3>
                <p class="request-desc">${request.description || 'Deskripsi belum tersedia.'}</p>
                <div class="request-meta">
                    <div class="request-meta-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${formatLocation(request)}</div>
                    <div class="request-meta-item"><i class="fa-solid fa-wallet" aria-hidden="true"></i>Total: ${formatCurrency(order.total_price)}</div>
                    <div class="request-meta-item"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i>DP: ${formatCurrency(order.dp_amount)}</div>
                    <div class="request-meta-item"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>Selesai: ${formatDate(order.completed_at || order.updated_at)}</div>
                </div>
                <button class="btn-bid" data-order-id="${order.id}">Detail History</button>
            `;
            historyList.appendChild(card);
        });
    };

    const populateModal = (order) => {
        if (!order || !historyModal) {
            return;
        }
        const request = order.Request || {};
        const bid = order.Bid || {};
        const categoryName = categoryMap.get(request.category_id) || 'Kategori';
        let proofList = [];

        if (Array.isArray(order.proof_photos)) {
            proofList = order.proof_photos;
        } else if (typeof order.proof_photos === 'string') {
            try {
                proofList = JSON.parse(order.proof_photos);
            } catch (error) {
                proofList = [];
            }
        }

        if (historyTitle) {
            historyTitle.textContent = request.title || 'Detail Order';
        }
        if (historyCategory) {
            historyCategory.textContent = categoryName;
        }
        if (historyStatus) {
            historyStatus.textContent = 'Selesai';
            historyStatus.className = 'bid-status status-completed';
        }
        if (historyLocation) {
            historyLocation.textContent = formatLocation(request);
        }
        if (historyBudget) {
            historyBudget.textContent = formatCurrency(request.min_bid_amount);
        }
        if (historyUser) {
            historyUser.textContent = request.User?.name || '-';
        }
        if (historyCompleted) {
            historyCompleted.textContent = formatDate(order.completed_at || order.updated_at);
        }
        if (historyDescription) {
            historyDescription.textContent = request.description || '-';
        }
        if (historyTotal) {
            historyTotal.textContent = formatCurrency(order.total_price);
        }
        if (historyDp) {
            historyDp.textContent = formatCurrency(order.dp_amount);
        }
        if (historyEta) {
            historyEta.textContent = bid.eta ? formatEtaDays(bid.eta) : '-';
        }
        if (historyProof) {
            historyProof.innerHTML = '';
            if (!proofList.length) {
                historyProof.innerHTML = '<div class="history-proof-item">Belum ada lampiran.</div>';
            } else {
                proofList.forEach((proof, index) => {
                    const item = document.createElement('div');
                    item.className = 'history-proof-item';
                    const label = proof?.url ? `Lampiran ${index + 1}` : `Lampiran ${index + 1}`;
                    item.innerHTML = proof?.url
                        ? `<a href="${proof.url}" target="_blank" rel="noreferrer">${label}</a>`
                        : label;
                    historyProof.appendChild(item);
                });
            }
        }
        if (historyNote) {
            const noteValue = proofList[0]?.note ? proofList[0].note : 'Tidak ada keterangan tambahan.';
            historyNote.textContent = noteValue;
        }
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

    const loadCategories = async () => {
        const categories = await fetchJson(`${API_BASE}/categories`);
        categoryMap = new Map(categories.map((category) => [category.id, category.name]));
    };

    const loadBids = async () => {
        return fetchJson(`${API_BASE}/bids`);
    };

    const loadOrders = async () => {
        if (!merchantData?.id) {
            return [];
        }
        const orders = await fetchJson(`${API_BASE}/orders?merchant_id=${merchantData.id}`);
        ordersCache = new Map(orders.map((order) => [order.id, order]));
        return orders;
    };

    const refreshData = async () => {
        showLoading(true);
        showEmpty(false);
        try {
            if (!merchantData) {
                merchantData = await loadMerchant();
            }
            await loadCategories();
            const [bids, orders] = await Promise.all([loadBids(), loadOrders()]);
            renderStats(bids, orders);
            renderHistory(orders);
        } catch (error) {
            showEmpty(true);
            if (historyEmpty) {
                historyEmpty.textContent = 'Gagal memuat history.';
            }
        } finally {
            showLoading(false);
        }
    };

    if (historyList) {
        historyList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-order-id]');
            if (!button) {
                return;
            }
            const orderId = Number(button.dataset.orderId);
            const order = ordersCache.get(orderId);
            if (order) {
                populateModal(order);
                openModal();
            }
        });
    }

    if (historyModal) {
        historyModal.querySelectorAll('[data-history-close]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && historyModal.classList.contains('is-open')) {
                closeModal();
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
