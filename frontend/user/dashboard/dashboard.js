(() => {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3333/api';
    const themeClasses = ['theme-blue', 'theme-yellow', 'theme-pink', 'theme-green'];
    const landingPageUrl = '../../index.html';

    const requestList = document.getElementById('requestList');
    const emptyState = document.getElementById('requestEmpty');
    const loadingState = document.getElementById('requestLoading');
    const orderList = document.getElementById('orderList');
    const orderEmpty = document.getElementById('orderEmpty');
    const orderLoading = document.getElementById('orderLoading');
    const categorySelect = document.getElementById('categorySelect');
    const requestForm = document.getElementById('requestForm');
    const formAlert = document.getElementById('formAlert');
    const jobTitleInput = document.getElementById('jobTitle');
    const jobDescriptionInput = document.getElementById('jobDescription');
    const userAddressInput = document.getElementById('userAddress');
    const jobBudgetInput = document.getElementById('jobBudget');

    const modal = document.getElementById('detailModal');
    const detailTitle = modal?.querySelector('[data-detail-title]');
    const detailSubtitle = modal?.querySelector('[data-detail-subtitle]');
    const detailStatus = modal?.querySelector('[data-detail-status]');
    const detailCategory = modal?.querySelector('[data-detail-category]');
    const detailLocation = modal?.querySelector('[data-detail-location]');
    const detailBudget = modal?.querySelector('[data-detail-budget]');
    const detailMode = modal?.querySelector('[data-detail-mode]');
    const detailDate = modal?.querySelector('[data-detail-date]');
    const detailDescription = modal?.querySelector('[data-detail-description]');
    const detailLoading = modal?.querySelector('[data-detail-loading]');
    const detailContent = modal?.querySelector('[data-detail-content]');
    const bidList = modal?.querySelector('[data-bid-list]');
    const bidEmpty = modal?.querySelector('[data-bid-empty]');

    const confirmModal = document.getElementById('merchantConfirmModal');
    const confirmName = confirmModal?.querySelector('[data-confirm-name]');
    const confirmMeta = confirmModal?.querySelector('[data-confirm-meta]');
    const confirmContact = confirmModal?.querySelector('[data-confirm-contact]');
    const confirmPrice = confirmModal?.querySelector('[data-confirm-price]');
    const confirmEta = confirmModal?.querySelector('[data-confirm-eta]');
    const confirmNote = confirmModal?.querySelector('[data-confirm-note]');
    const confirmAlert = confirmModal?.querySelector('[data-confirm-alert]');
    const confirmButton = document.getElementById('confirmSelectMerchant');

    const paymentModal = document.getElementById('paymentModal');
    const paymentSubtitle = paymentModal?.querySelector('[data-payment-subtitle]');
    const paymentProof = paymentModal?.querySelector('[data-payment-proof]');
    const paymentNote = paymentModal?.querySelector('[data-payment-note]');
    const payFinalButton = document.getElementById('payFinalButton');

    const statusMap = {
        open: { label: 'Terbuka', className: 'status-open' },
        closed: { label: 'Ditutup', className: 'status-closed' },
        in_progress: { label: 'Diproses', className: 'status-in-progress' },
        completed: { label: 'Selesai', className: 'status-completed' },
        disputed: { label: 'Dispute', className: 'status-disputed' },
        cancelled: { label: 'Dibatalkan', className: 'status-cancelled' },
    };

    const DP_PERCENTAGE = 0.3;

    let categoryMap = new Map();
    let requestsCache = new Map();
    let bidsCache = new Map();
    let ordersCache = new Map();
    let ordersByRequest = new Map();
    let paymentsByOrder = new Map();
    let currentRequest = null;
    let currentBids = [];
    let pendingSelection = null;
    let pendingPaymentOrder = null;

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

    const redirectToLanding = () => {
        window.location.href = landingPageUrl;
    };

    const ensureUserAccess = () => {
        const token = localStorage.getItem('bidfix_token');
        const user = getStoredUser();
        if (!token || !user || user.role !== 'user') {
            redirectToLanding();
            return null;
        }
        return { token, user };
    };

    const getAuthHeaders = () => {
        const auth = ensureUserAccess();
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

    const formatLocation = (request) => {
        const user = getStoredUser();
        const address = userAddressInput?.value?.trim() || user?.address;
        if (address) {
            return address;
        }
        if (request?.location_lat && request?.location_lng) {
            return `${request.location_lat}, ${request.location_lng}`;
        }
        return 'Alamat belum diisi';
    };

    const formatMode = (mode) => {
        if (mode === 'toko') {
            return 'Servis di Toko';
        }
        if (mode === 'teknisi') {
            return 'Teknisi Datang';
        }
        return '-';
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
        return `${diffDays} hari`;
    };

    const getPaymentState = (orderId) => {
        return paymentsByOrder.get(orderId) || { dpPaid: false, finalPaid: false };
    };

    const getOrderStatusInfo = (order) => {
        const paymentState = getPaymentState(order.id);
        if (paymentState.finalPaid || order.status === 'completed') {
            return { label: 'Done (1x24 jam)', className: 'status-done' };
        }
        if (order.status === 'awaiting_confirmation') {
            return { label: 'Pelunasan', className: 'status-settle' };
        }
        if (order.status === 'in_progress') {
            return { label: 'On Progress', className: 'status-progress' };
        }
        if (!paymentState.dpPaid) {
            return { label: 'Menunggu Pembayaran', className: 'status-payment' };
        }
        return { label: 'Menunggu Teknisi', className: 'status-waiting' };
    };

    const getRequestStatusInfo = (request) => {
        const order = ordersByRequest.get(request.id);
        if (!order) {
            return statusMap[request.status] || { label: request.status || '-', className: 'status-cancelled' };
        }
        const orderStatus = getOrderStatusInfo(order);
        if (orderStatus.className === 'status-done') {
            return { label: 'Selesai', className: 'status-completed' };
        }
        return orderStatus;
    };

    const showLoading = (isLoading) => {
        if (loadingState) {
            loadingState.classList.toggle('is-visible', isLoading);
        }
    };

    const showEmptyState = (isEmpty) => {
        if (emptyState) {
            emptyState.classList.toggle('is-visible', isEmpty);
        }
    };

    const showOrderLoading = (isLoading) => {
        if (orderLoading) {
            orderLoading.classList.toggle('is-visible', isLoading);
        }
    };

    const showOrderEmpty = (isEmpty) => {
        if (orderEmpty) {
            orderEmpty.classList.toggle('is-visible', isEmpty);
        }
    };

    const populateUserAddress = (user) => {
        if (!userAddressInput) {
            return;
        }
        userAddressInput.value = user?.address || '';
    };

    const showFormAlert = (type, message) => {
        if (!formAlert) {
            return;
        }
        formAlert.textContent = message;
        formAlert.classList.toggle('is-error', type === 'error');
        formAlert.classList.toggle('is-success', type === 'success');
        formAlert.classList.add('is-visible');
    };

    const clearFormAlert = () => {
        if (!formAlert) {
            return;
        }
        formAlert.textContent = '';
        formAlert.classList.remove('is-visible', 'is-error', 'is-success');
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


    const buildStatus = (request) => {
        return getRequestStatusInfo(request);
    };

    const renderRequests = (requests) => {
        if (!requestList) {
            return;
        }
        requestList.innerHTML = '';

        if (!requests.length) {
            showEmptyState(true);
            return;
        }

        showEmptyState(false);

        requests.forEach((request, index) => {
            const themeClass = themeClasses[index % themeClasses.length];
            const statusInfo = buildStatus(request);
            const categoryName = categoryMap.get(request.category_id) || 'Tanpa kategori';
            const bids = bidsCache.get(request.id) || [];
            const bidsCount = bids.length;
            const description = request.description || 'Deskripsi belum tersedia.';

            const card = document.createElement('article');
            card.className = `job-card ${themeClass}`;
            card.innerHTML = `
                <div class="job-header">
                    <span class="job-category">${categoryName}</span>
                    <span class="job-status ${statusInfo.className}">${statusInfo.label}</span>
                </div>
                <h3 class="job-title">${request.title || 'Judul belum tersedia'}</h3>
                <p class="job-description">${description}</p>
                <div class="job-details">
                    <div class="job-detail-item">
                        <span class="detail-icon" aria-hidden="true"><i class="fa-solid fa-location-dot"></i></span>
                        <span>${formatLocation(request)}</span>
                    </div>
                    <div class="job-detail-item">
                        <span class="detail-icon" aria-hidden="true"><i class="fa-solid fa-wallet"></i></span>
                        <span>Budget: ${formatCurrency(request.min_bid_amount)}</span>
                    </div>
                    <div class="job-detail-item">
                        <span class="detail-icon" aria-hidden="true"><i class="fa-solid fa-user-group"></i></span>
                        <span>${bidsCount} Penawaran</span>
                    </div>
                    <div class="job-detail-item">
                        <span class="detail-icon" aria-hidden="true"><i class="fa-solid fa-clock"></i></span>
                        <span>Posted: ${formatDate(request.created_at)}</span>
                    </div>
                </div>
                <div class="job-footer">
                    <button class="btn-detail" data-request-id="${request.id}">
                        <i class="fa-solid fa-eye" aria-hidden="true"></i>
                        Lihat Detail
                    </button>
                </div>
            `;

            requestList.appendChild(card);
        });
    };

    const renderBidList = (bids, request) => {
        if (!bidList || !bidEmpty) {
            return;
        }

        currentBids = bids;
        currentRequest = request;

        bidList.innerHTML = '';
        if (!bids.length) {
            bidEmpty.classList.add('is-visible');
            return;
        }

        bidEmpty.classList.remove('is-visible');
        const order = request ? ordersByRequest.get(request.id) : null;
        const selectionLocked = Boolean(order);

        bids.forEach((bid) => {
            const merchant = bid.Merchant;
            const merchantUser = merchant?.User;
            const merchantName =
                merchant?.business_name ||
                merchantUser?.name ||
                `Merchant #${bid.merchant_id}`;
            const merchantMeta = merchantUser?.name ? `Pemilik: ${merchantUser.name}` : 'Merchant terverifikasi';
            const isSelected = Boolean(bid.is_selected);
            const badgeLabel = isSelected ? 'Terpilih' : selectionLocked ? 'Terkunci' : '';
            const isDisabled = selectionLocked || isSelected;

            const item = document.createElement('div');
            item.className = 'bid-item';
            item.innerHTML = `
                <div class="bid-item-head">
                    <div class="bid-merchant">
                        <strong>${merchantName}</strong>
                        <span>${merchantMeta}</span>
                    </div>
                    <div class="bid-action">
                        ${badgeLabel ? `<span class="bid-selected">${badgeLabel}</span>` : ''}
                        <button class="btn-select" data-select-bid-id="${bid.id}" ${isDisabled ? 'disabled' : ''}>
                            Pilih Merchant
                        </button>
                    </div>
                </div>
                <div>Harga: ${formatCurrency(bid.price)}</div>
                <div>Estimasi: ${formatEtaDays(bid.eta)}</div>
                <div>Catatan: ${bid.note || '-'}</div>
            `;
            bidList.appendChild(item);
        });
    };

    const updateDetailModal = (request, bids) => {
        if (!modal || !request) {
            return;
        }

        const statusInfo = buildStatus(request);

        if (detailTitle) {
            detailTitle.textContent = request.title || 'Detail Request';
        }

        if (detailSubtitle) {
            detailSubtitle.textContent = `Request ID: ${request.id}`;
        }

        if (detailStatus) {
            detailStatus.textContent = statusInfo.label;
            detailStatus.className = `detail-status ${statusInfo.className}`;
        }

        if (detailCategory) {
            detailCategory.textContent = categoryMap.get(request.category_id) || 'Tanpa kategori';
        }

        if (detailLocation) {
            detailLocation.textContent = formatLocation(request);
        }

        if (detailBudget) {
            detailBudget.textContent = formatCurrency(request.min_bid_amount);
        }

        if (detailMode) {
            detailMode.textContent = formatMode(request.mode_service);
        }

        if (detailDate) {
            detailDate.textContent = formatDate(request.created_at);
        }

        if (detailDescription) {
            detailDescription.textContent = request.description || '-';
        }

        renderBidList(bids, request);
    };

    const updateBodyModalState = () => {
        const isDetailOpen = modal?.classList.contains('is-open');
        const isConfirmOpen = confirmModal?.classList.contains('is-open');
        const isPaymentOpen = paymentModal?.classList.contains('is-open');
        document.body.classList.toggle('modal-open', Boolean(isDetailOpen || isConfirmOpen || isPaymentOpen));
    };

    const openModal = () => {
        if (!modal) {
            return;
        }
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        updateBodyModalState();
    };

    const closeModal = () => {
        if (!modal) {
            return;
        }
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        updateBodyModalState();
    };

    const showConfirmAlert = (message) => {
        if (!confirmAlert) {
            return;
        }
        confirmAlert.textContent = message;
        confirmAlert.classList.add('is-visible', 'is-error');
    };

    const clearConfirmAlert = () => {
        if (!confirmAlert) {
            return;
        }
        confirmAlert.textContent = '';
        confirmAlert.classList.remove('is-visible', 'is-error');
    };

    const openConfirmModal = (bid, request) => {
        if (!confirmModal) {
            return;
        }
        const merchant = bid?.Merchant;
        const merchantUser = merchant?.User;
        const merchantName =
            merchant?.business_name ||
            merchantUser?.name ||
            `Merchant #${bid?.merchant_id || '-'}`;
        const merchantMeta = merchantUser?.name
            ? `Pemilik: ${merchantUser.name}`
            : 'Detail merchant belum tersedia.';
        const merchantContact = merchantUser?.phone || merchantUser?.email || 'Kontak belum tersedia.';

        if (confirmName) {
            confirmName.textContent = merchantName;
        }
        if (confirmMeta) {
            confirmMeta.textContent = merchantMeta;
        }
        if (confirmContact) {
            confirmContact.textContent = `Kontak: ${merchantContact}`;
        }
        if (confirmPrice) {
            confirmPrice.textContent = `Harga: ${formatCurrency(bid?.price)}`;
        }
        if (confirmEta) {
            confirmEta.textContent = `Estimasi: ${formatEtaDays(bid?.eta)}`;
        }
        if (confirmNote) {
            confirmNote.textContent = `Catatan: ${bid?.note || '-'}`;
        }

        pendingSelection = { bid, request };
        clearConfirmAlert();
        confirmModal.classList.add('is-open');
        confirmModal.setAttribute('aria-hidden', 'false');
        updateBodyModalState();
    };

    const closeConfirmModal = () => {
        if (!confirmModal) {
            return;
        }
        confirmModal.classList.remove('is-open');
        confirmModal.setAttribute('aria-hidden', 'true');
        updateBodyModalState();
    };

    const openPaymentModal = (order) => {
        if (!paymentModal || !order) {
            return;
        }
        pendingPaymentOrder = order;
        if (paymentSubtitle) {
            paymentSubtitle.textContent = `Order #${order.id} - ${order?.Request?.title || 'Permintaan layanan'}`;
        }
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

        if (paymentProof) {
            paymentProof.innerHTML = '';
            if (!proofList.length) {
                paymentProof.innerHTML = '<div class="payment-proof-item">Belum ada lampiran.</div>';
            } else {
                proofList.forEach((proof, index) => {
                    const item = document.createElement('div');
                    item.className = 'payment-proof-item';
                    const label = proof?.url ? `Lampiran ${index + 1}` : `Lampiran ${index + 1} belum tersedia`;
                    item.innerHTML = proof?.url
                        ? `<a href="${proof.url}" target="_blank" rel="noreferrer">${label}</a>`
                        : label;
                    paymentProof.appendChild(item);
                });
            }
        }
        if (paymentNote) {
            const noteValue = proofList[0]?.note
                ? proofList[0].note
                : 'Tidak ada keterangan tambahan.';
            paymentNote.textContent = noteValue;
        }
        paymentModal.classList.add('is-open');
        paymentModal.setAttribute('aria-hidden', 'false');
        updateBodyModalState();
    };

    const closePaymentModal = () => {
        if (!paymentModal) {
            return;
        }
        paymentModal.classList.remove('is-open');
        paymentModal.setAttribute('aria-hidden', 'true');
        updateBodyModalState();
        pendingPaymentOrder = null;
    };

    const setDetailLoading = (isLoading) => {
        if (detailLoading) {
            detailLoading.style.display = isLoading ? 'block' : 'none';
        }
        if (detailContent) {
            detailContent.style.display = isLoading ? 'none' : 'flex';
        }
    };

    const loadDetail = async (requestId) => {
        if (!requestId) {
            return;
        }
        openModal();
        setDetailLoading(true);

        let request = requestsCache.get(requestId);
        let bids = bidsCache.get(requestId) || [];

        try {
            const [requestResponse, bidsResponse] = await Promise.all([
                fetchJson(`${API_BASE}/requests/${requestId}`),
                fetchJson(`${API_BASE}/bids?request_id=${requestId}`),
            ]);
            request = requestResponse || request;
            bids = bidsResponse || bids;
        } catch (error) {
            // fallback to cached data
        }

        if (request) {
            currentRequest = request;
            currentBids = bids;
            updateDetailModal(request, bids);
        }
        setDetailLoading(false);
    };

    const loadCategories = async () => {
        try {
            const categories = await fetchJson(`${API_BASE}/categories`);
            categoryMap = new Map(categories.map((category) => [category.id, category.name]));

            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Pilih Kategori</option>';
                categories.forEach((category) => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        } catch (error) {
            // ignore category errors
        }
    };

    const loadRequests = async () => {
        const user = getStoredUser();
        const url = user?.id ? `${API_BASE}/requests?user_id=${user.id}` : `${API_BASE}/requests`;
        const requests = await fetchJson(url);
        requestsCache = new Map(requests.map((request) => [request.id, request]));
        return requests;
    };

    const loadBids = async () => {
        const bids = await fetchJson(`${API_BASE}/bids`);
        bidsCache = new Map();
        bids.forEach((bid) => {
            if (!bidsCache.has(bid.request_id)) {
                bidsCache.set(bid.request_id, []);
            }
            bidsCache.get(bid.request_id).push(bid);
        });
        return bids;
    };

    const loadOrders = async () => {
        const user = getStoredUser();
        if (!user?.id) {
            return [];
        }
        const orders = await fetchJson(`${API_BASE}/orders?user_id=${user.id}`);
        ordersCache = new Map(orders.map((order) => [order.id, order]));
        ordersByRequest = new Map();
        orders.forEach((order) => {
            if (order.request_id) {
                ordersByRequest.set(order.request_id, order);
            }
        });
        return orders;
    };

    const loadPayments = async () => {
        const user = getStoredUser();
        if (!user?.id) {
            return [];
        }
        const payments = await fetchJson(`${API_BASE}/payments?user_id=${user.id}`);
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

    const renderOrders = (orders) => {
        if (!orderList) {
            return;
        }
        orderList.innerHTML = '';

        if (!orders.length) {
            showOrderEmpty(true);
            return;
        }

        showOrderEmpty(false);

        orders.forEach((order) => {
            const request = order.Request || {};
            const bid = order.Bid || {};
            const merchant = order.Merchant;
            const merchantUser = merchant?.User;
            const merchantName =
                merchant?.business_name ||
                merchantUser?.name ||
                `Merchant #${order.merchant_id || '-'}`;
            const statusInfo = getOrderStatusInfo(order);
            const totalPrice = Number(order.total_price) || 0;
            const dpAmount = Number(order.dp_amount) || Math.round(totalPrice * DP_PERCENTAGE);
            const etaText = bid.eta ? formatEtaDays(bid.eta) : '-';

            const card = document.createElement('article');
            card.className = 'order-card';
            card.innerHTML = `
                <div class="order-header">
                    <div>
                        <h3 class="order-title">${request.title || 'Request Perbaikan'}</h3>
                        <div class="order-subtitle">Merchant: ${merchantName}</div>
                    </div>
                    <span class="order-status ${statusInfo.className}">${statusInfo.label}</span>
                </div>
                <div class="order-meta">
                    <div class="order-meta-item"><i class="fa-solid fa-wallet" aria-hidden="true"></i>Total: ${formatCurrency(totalPrice)}</div>
                    <div class="order-meta-item"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i>DP: ${formatCurrency(dpAmount)}</div>
                    <div class="order-meta-item"><i class="fa-solid fa-clock" aria-hidden="true"></i>ETA: ${etaText}</div>
                </div>
                <div class="order-actions">
                    ${
                        statusInfo.className === 'status-payment'
                            ? `<button class="btn-pay" data-pay-type="dp" data-order-id="${order.id}">PAY</button>`
                            : statusInfo.className === 'status-settle'
                                ? `<button class="btn-pay" data-pay-preview data-order-id="${order.id}">Lihat Lampiran</button>`
                                : ''
                    }
                </div>
            `;
            orderList.appendChild(card);
        });
    };

    const refreshOrders = async () => {
        showOrderLoading(true);
        showOrderEmpty(false);
        try {
            const [orders] = await Promise.all([loadOrders(), loadPayments()]);
            renderOrders(orders);
        } catch (error) {
            showOrderEmpty(true);
            if (orderEmpty) {
                orderEmpty.textContent = 'Gagal memuat order.';
            }
        } finally {
            showOrderLoading(false);
        }
    };

    const handlePay = async (orderId, type) => {
        const order = ordersCache.get(orderId);
        if (!order) {
            return;
        }
        const auth = ensureUserAccess();
        if (!auth?.user?.id) {
            return;
        }

        const totalPrice = Number(order.total_price) || 0;
        const dpAmount = Number(order.dp_amount) || Math.round(totalPrice * DP_PERCENTAGE);
        const payAmount = type === 'final' ? totalPrice - dpAmount : dpAmount;
        if (!payAmount || payAmount <= 0) {
            return;
        }

        const confirmed = window.confirm(`Lanjutkan pembayaran sebesar ${formatCurrency(payAmount)}?`);
        if (!confirmed) {
            return;
        }

        await postJson(`${API_BASE}/payments`, {
            order_id: order.id,
            user_id: auth.user.id,
            merchant_id: order.merchant_id,
            amount: payAmount,
            type,
            status: 'succeeded',
        });

        if (type === 'dp') {
            await putJson(`${API_BASE}/orders/${order.id}`, { status: 'dp_paid' });
        }

        if (type === 'final') {
            await putJson(`${API_BASE}/orders/${order.id}`, {
                status: 'completed',
                completed_at: new Date().toISOString(),
            });
            await putJson(`${API_BASE}/requests/${order.request_id}`, { status: 'completed' });
        }

        await refreshOrders();
        await refreshRequests();
    };

    const refreshRequests = async () => {
        showLoading(true);
        showEmptyState(false);
        showOrderLoading(true);
        showOrderEmpty(false);
        try {
            const [requests, , orders] = await Promise.all([
                loadRequests(),
                loadBids(),
                loadOrders(),
                loadPayments(),
            ]);
            renderOrders(orders);
            renderRequests(requests);
        } catch (error) {
            showEmptyState(true);
            if (emptyState) {
                emptyState.textContent = 'Gagal memuat data request.';
            }
            showOrderEmpty(true);
            if (orderEmpty) {
                orderEmpty.textContent = 'Gagal memuat order.';
            }
        } finally {
            showLoading(false);
            showOrderLoading(false);
        }
    };

    const init = async () => {
        const auth = ensureUserAccess();
        if (!auth) {
            return;
        }
        showLoading(true);
        showEmptyState(false);
        showOrderLoading(true);
        showOrderEmpty(false);
        try {
            populateUserAddress(auth.user);
            await loadCategories();
            const [requests, , orders] = await Promise.all([
                loadRequests(),
                loadBids(),
                loadOrders(),
                loadPayments(),
            ]);
            renderOrders(orders);
            renderRequests(requests);
        } catch (error) {
            showEmptyState(true);
            if (emptyState) {
                emptyState.textContent = 'Gagal memuat data request.';
            }
            showOrderEmpty(true);
            if (orderEmpty) {
                orderEmpty.textContent = 'Gagal memuat order.';
            }
        } finally {
            showLoading(false);
            showOrderLoading(false);
        }
    };

    if (requestList) {
        requestList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-request-id]');
            if (!button) {
                return;
            }
            const requestId = Number(button.dataset.requestId);
            if (requestId) {
                loadDetail(requestId);
            }
        });
    }

    if (bidList) {
        bidList.addEventListener('click', (event) => {
            const button = event.target.closest('[data-select-bid-id]');
            if (!button) {
                return;
            }
            const bidId = Number(button.dataset.selectBidId);
            const bid = currentBids.find((item) => item.id === bidId);
            if (!bid || !currentRequest) {
                return;
            }
            openConfirmModal(bid, currentRequest);
        });
    }

    if (orderList) {
        orderList.addEventListener('click', (event) => {
            const payButton = event.target.closest('[data-pay-type]');
            if (payButton) {
                const orderId = Number(payButton.dataset.orderId);
                const payType = payButton.dataset.payType;
                if (!orderId || !payType) {
                    return;
                }
                handlePay(orderId, payType);
                return;
            }

            const previewButton = event.target.closest('[data-pay-preview]');
            if (!previewButton) {
                return;
            }
            const orderId = Number(previewButton.dataset.orderId);
            if (!orderId) {
                return;
            }
            const order = ordersCache.get(orderId);
            if (order) {
                openPaymentModal(order);
            }
        });
    }

    if (requestForm) {
        requestForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearFormAlert();

            const auth = ensureUserAccess();
            if (!auth?.user?.id) {
                showFormAlert('error', 'Silakan login untuk membuat request.');
                return;
            }

            const title = jobTitleInput?.value.trim();
            const description = jobDescriptionInput?.value.trim();
            const categoryId = Number(categorySelect?.value);
            const budgetValue = parseCurrencyInput(jobBudgetInput?.value || '');

            if (!title) {
                showFormAlert('error', 'Judul pekerjaan wajib diisi.');
                return;
            }

            if (!categoryId) {
                showFormAlert('error', 'Pilih kategori terlebih dahulu.');
                return;
            }

            const payload = {
                user_id: auth.user.id,
                title,
                description,
                category_id: categoryId,
                min_bid_amount: budgetValue,
                mode_service: 'teknisi',
            };

            try {
                const created = await postJson(`${API_BASE}/requests`, payload);
                requestForm.reset();
                populateUserAddress(auth.user);
                showFormAlert('success', 'Request berhasil diposting.');
                await refreshRequests();
            } catch (error) {
                showFormAlert('error', error.message || 'Gagal memposting request.');
            }
        });
    }

    if (jobBudgetInput) {
        jobBudgetInput.addEventListener('input', () => {
            const formatted = formatCurrencyInput(jobBudgetInput.value);
            jobBudgetInput.value = formatted;
        });

        jobBudgetInput.addEventListener('blur', () => {
            jobBudgetInput.value = formatCurrencyInput(jobBudgetInput.value);
        });
    }

    if (modal) {
        modal.querySelectorAll('[data-detail-close]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        document.addEventListener('keydown', (event) => {
            if (
                event.key === 'Escape' &&
                modal.classList.contains('is-open') &&
                !confirmModal?.classList.contains('is-open') &&
                !paymentModal?.classList.contains('is-open')
            ) {
                closeModal();
            }
        });
    }

    if (confirmModal) {
        confirmModal.querySelectorAll('[data-confirm-close]').forEach((button) => {
            button.addEventListener('click', closeConfirmModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && confirmModal.classList.contains('is-open')) {
                closeConfirmModal();
            }
        });
    }

    if (paymentModal) {
        paymentModal.querySelectorAll('[data-payment-close]').forEach((button) => {
            button.addEventListener('click', closePaymentModal);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && paymentModal.classList.contains('is-open')) {
                closePaymentModal();
            }
        });
    }

    if (payFinalButton) {
        payFinalButton.addEventListener('click', async () => {
            if (!pendingPaymentOrder) {
                return;
            }
            await handlePay(pendingPaymentOrder.id, 'final');
            closePaymentModal();
        });
    }

    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            if (!pendingSelection?.bid || !pendingSelection?.request) {
                return;
            }
            const { bid, request } = pendingSelection;
            const auth = ensureUserAccess();
            if (!auth?.user?.id) {
                showConfirmAlert('Silakan login untuk melanjutkan.');
                return;
            }

            if (ordersByRequest.has(request.id)) {
                showConfirmAlert('Request ini sudah memiliki merchant terpilih.');
                return;
            }

            const totalPrice = Number(bid.price);
            if (!totalPrice) {
                showConfirmAlert('Harga penawaran tidak valid.');
                return;
            }

            const dpAmount = Math.round(totalPrice * DP_PERCENTAGE);

            try {
                await postJson(`${API_BASE}/orders`, {
                    request_id: request.id,
                    bid_id: bid.id,
                    user_id: auth.user.id,
                    merchant_id: bid.merchant_id,
                    total_price: totalPrice,
                    dp_amount: dpAmount,
                    status: 'dp_paid',
                });
                await putJson(`${API_BASE}/bids/${bid.id}`, { is_selected: true });
                await putJson(`${API_BASE}/requests/${request.id}`, { status: 'closed' });

                await refreshRequests();
                closeConfirmModal();
                closeModal();
            } catch (error) {
                showConfirmAlert(error.message || 'Gagal memilih merchant.');
            }
        });
    }

    init();
})();
