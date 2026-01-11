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

    const requestList = document.getElementById('requestList');
    const requestLoading = document.getElementById('requestLoading');
    const requestEmpty = document.getElementById('requestEmpty');

    const bidModal = document.getElementById('bidModal');
    const bidTitle = bidModal?.querySelector('[data-bid-title]');
    const bidCategory = bidModal?.querySelector('[data-bid-category]');
    const bidStatus = bidModal?.querySelector('[data-bid-status]');
    const bidLocation = bidModal?.querySelector('[data-bid-location]');
    const bidBudget = bidModal?.querySelector('[data-bid-budget]');
    const bidCount = bidModal?.querySelector('[data-bid-count]');
    const bidDate = bidModal?.querySelector('[data-bid-date]');
    const bidDescription = bidModal?.querySelector('[data-bid-description]');
    const bidForm = document.getElementById('bidForm');
    const bidPriceInput = document.getElementById('bidPrice');
    const bidEtaInput = document.getElementById('bidEta');
    const bidNoteInput = document.getElementById('bidNote');
    const bidAlert = document.getElementById('bidAlert');

    const statusMap = {
        open: { label: 'Terbuka', className: 'status-open' },
        closed: { label: 'Ditutup', className: 'status-closed' },
        in_progress: { label: 'Diproses', className: 'status-in-progress' },
        completed: { label: 'Selesai', className: 'status-completed' },
        disputed: { label: 'Dispute', className: 'status-disputed' },
        cancelled: { label: 'Dibatalkan', className: 'status-cancelled' },
    };

    let categoryMap = new Map();
    let requestCache = new Map();
    let bidsByRequest = new Map();
    let merchantData = null;
    let selectedRequestId = null;
    let merchantBidRequestIds = new Set();

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

    const parseCurrencyInput = (value) => {
        if (!value) {
            return null;
        }
        const digits = value.replace(/[^\d]/g, '');
        if (!digits) {
            return null;
        }
        return Number(digits);
    };

    const formatCurrencyInput = (value) => {
        const digits = value.replace(/[^\d]/g, '');
        if (!digits) {
            return '';
        }
        const numberValue = Number(digits);
        if (Number.isNaN(numberValue)) {
            return '';
        }
        const formatted = new Intl.NumberFormat('id-ID').format(numberValue);
        return `Rp ${formatted}`;
    };

    const showLoading = (isLoading) => {
        if (requestLoading) {
            requestLoading.classList.toggle('is-visible', isLoading);
        }
    };

    const showEmpty = (isEmpty) => {
        if (requestEmpty) {
            requestEmpty.classList.toggle('is-visible', isEmpty);
        }
    };

    const showBidAlert = (type, message) => {
        if (!bidAlert) {
            return;
        }
        bidAlert.textContent = message;
        bidAlert.classList.toggle('is-error', type === 'error');
        bidAlert.classList.toggle('is-success', type === 'success');
        bidAlert.classList.add('is-visible');
    };

    const clearBidAlert = () => {
        if (!bidAlert) {
            return;
        }
        bidAlert.textContent = '';
        bidAlert.classList.remove('is-visible', 'is-error', 'is-success');
    };

    const openModal = () => {
        if (!bidModal) {
            return;
        }
        bidModal.classList.add('is-open');
        bidModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        if (!bidModal) {
            return;
        }
        bidModal.classList.remove('is-open');
        bidModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    };

    const buildStatus = (status) => {
        return statusMap[status] || { label: status || '-', className: 'status-cancelled' };
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

    const renderRequests = (requests) => {
        if (!requestList) {
            return;
        }
        requestList.innerHTML = '';

        const visibleRequests = requests.filter((request) => !merchantBidRequestIds.has(request.id));
        if (!visibleRequests.length) {
            showEmpty(true);
            return;
        }
        showEmpty(false);

        visibleRequests.forEach((request) => {
            const categoryName = categoryMap.get(request.category_id) || 'Kategori';
            const bidsCount = bidsByRequest.get(request.id)?.length || 0;

            const card = document.createElement('article');
            card.className = 'request-card';
            card.innerHTML = `
                <span class="request-category">${categoryName}</span>
                <h3 class="request-title">${request.title || 'Judul belum tersedia'}</h3>
                <p class="request-desc">${request.description || 'Deskripsi belum tersedia.'}</p>
                <div class="request-meta">
                    <div class="request-meta-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${formatLocation(request)}</div>
                    <div class="request-meta-item"><i class="fa-solid fa-wallet" aria-hidden="true"></i>Budget: ${formatCurrency(request.min_bid_amount)}</div>
                    <div class="request-meta-item"><i class="fa-solid fa-user-group" aria-hidden="true"></i>${bidsCount} Penawaran</div>
                    <div class="request-meta-item"><i class="fa-solid fa-clock" aria-hidden="true"></i>Posted: ${formatDate(request.created_at)}</div>
                </div>
                <button class="btn-bid" data-request-id="${request.id}">Kirim Penawaran</button>
            `;
            requestList.appendChild(card);
        });
    };

    const populateBidModal = (request) => {
        if (!request) {
            return;
        }
        const statusInfo = buildStatus(request.status);
        const categoryName = categoryMap.get(request.category_id) || 'Kategori';
        const bidsCount = bidsByRequest.get(request.id)?.length || 0;

        selectedRequestId = request.id;
        if (bidTitle) {
            bidTitle.textContent = request.title || 'Detail Request';
        }
        if (bidCategory) {
            bidCategory.textContent = categoryName;
        }
        if (bidStatus) {
            bidStatus.textContent = statusInfo.label;
            bidStatus.className = `bid-status ${statusInfo.className}`;
        }
        if (bidLocation) {
            bidLocation.textContent = formatLocation(request);
        }
        if (bidBudget) {
            bidBudget.textContent = formatCurrency(request.min_bid_amount);
        }
        if (bidCount) {
            bidCount.textContent = `${bidsCount} Penawaran`;
        }
        if (bidDate) {
            bidDate.textContent = formatDate(request.created_at);
        }
        if (bidDescription) {
            bidDescription.textContent = request.description || '-';
        }
        if (bidForm) {
            bidForm.reset();
        }
        clearBidAlert();
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

    const loadRequests = async () => {
        const requests = await fetchJson(`${API_BASE}/requests?status=open`);
        requestCache = new Map(requests.map((request) => [request.id, request]));
        return requests;
    };

    const loadBids = async () => {
        const bids = await fetchJson(`${API_BASE}/bids`);
        bidsByRequest = new Map();
        bids.forEach((bid) => {
            if (!bidsByRequest.has(bid.request_id)) {
                bidsByRequest.set(bid.request_id, []);
            }
            bidsByRequest.get(bid.request_id).push(bid);
        });
        return bids;
    };

    const loadOrders = async () => {
        if (!merchantData?.id) {
            return [];
        }
        return fetchJson(`${API_BASE}/orders?merchant_id=${merchantData.id}`);
    };

    const refreshData = async () => {
        showLoading(true);
        showEmpty(false);
        try {
            if (!merchantData) {
                merchantData = await loadMerchant();
            }
            await loadCategories();
            const [requests, bids, orders] = await Promise.all([loadRequests(), loadBids(), loadOrders()]);
            merchantBidRequestIds = new Set(
                bids.filter((bid) => bid.merchant_id === merchantData?.id).map((bid) => bid.request_id)
            );
            renderRequests(requests);
            renderStats(bids, orders);
        } catch (error) {
            showEmpty(true);
            if (requestEmpty) {
                requestEmpty.textContent = 'Gagal memuat request.';
            }
        } finally {
            showLoading(false);
        }
    };

    if (requestList) {
        requestList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-request-id]');
            if (!button) {
                return;
            }
            const requestId = Number(button.dataset.requestId);
            const request = requestCache.get(requestId);
            if (request) {
                populateBidModal(request);
                openModal();
            }
        });
    }

    if (bidModal) {
        bidModal.querySelectorAll('[data-bid-close]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && bidModal.classList.contains('is-open')) {
                closeModal();
            }
        });
    }

    if (bidPriceInput) {
        bidPriceInput.addEventListener('input', () => {
            bidPriceInput.value = formatCurrencyInput(bidPriceInput.value);
        });

        bidPriceInput.addEventListener('blur', () => {
            bidPriceInput.value = formatCurrencyInput(bidPriceInput.value);
        });
    }

    if (bidForm) {
        bidForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearBidAlert();

            if (!selectedRequestId) {
                showBidAlert('error', 'Request tidak ditemukan.');
                return;
            }

            if (!merchantData?.id) {
                showBidAlert('error', 'Data merchant belum tersedia.');
                return;
            }

            const priceValue = parseCurrencyInput(bidPriceInput?.value || '');
            const etaDays = Number.parseInt(bidEtaInput?.value || '', 10);
            const noteValue = bidNoteInput?.value.trim();

            if (!priceValue) {
                showBidAlert('error', 'Harga penawaran wajib diisi.');
                return;
            }

            if (!etaDays || etaDays <= 0) {
                showBidAlert('error', 'Estimasi waktu wajib diisi.');
                return;
            }

            if (!noteValue) {
                showBidAlert('error', 'Alasan atau catatan wajib diisi.');
                return;
            }

            try {
                const etaDate = new Date();
                etaDate.setDate(etaDate.getDate() + etaDays);
                await postJson(`${API_BASE}/bids`, {
                    request_id: selectedRequestId,
                    merchant_id: merchantData.id,
                    price: priceValue,
                    eta: etaDate.toISOString(),
                    note: noteValue,
                });
                showBidAlert('success', 'Penawaran berhasil dikirim.');
                await refreshData();
                setTimeout(closeModal, 800);
            } catch (error) {
                showBidAlert('error', error.message || 'Gagal mengirim penawaran.');
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
