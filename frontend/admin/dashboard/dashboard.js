(() => {
    const API_BASE = window.API_BASE_URL || 'http://localhost:3333/api';
    const landingPageUrl = '../../index.html';

    const statPending = document.getElementById('statPending');
    const statMerchants = document.getElementById('statMerchants');
    const statTransactions = document.getElementById('statTransactions');
    const statRevenue = document.getElementById('statRevenue');
    const navVerifyCount = document.getElementById('navVerifyCount');

    const overviewRevenue = document.getElementById('overviewRevenue');
    const overviewRevenueChange = document.getElementById('overviewRevenueChange');
    const overviewMerchants = document.getElementById('overviewMerchants');
    const overviewMerchantsPending = document.getElementById('overviewMerchantsPending');
    const overviewTransactions = document.getElementById('overviewTransactions');

    const monthlyList = document.getElementById('monthlyList');
    const categoryList = document.getElementById('categoryList');
    const latestTransactions = document.getElementById('latestTransactions');

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

    const formatShortMonth = (date) => {
        return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    };

    const sumPayments = (payments) => {
        return payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    };

    const filterByMonth = (dateValue, year, month) => {
        const date = new Date(dateValue);
        return date.getFullYear() === year && date.getMonth() === month;
    };

    const setText = (el, value) => {
        if (el) {
            el.textContent = value;
        }
    };

    const renderMonthly = (orders) => {
        if (!monthlyList) {
            return;
        }
        monthlyList.innerHTML = '';
        const now = new Date();
        const months = [];
        for (let i = 2; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date);
        }
        const counts = months.map((monthDate) => {
            const count = orders.filter((order) => filterByMonth(order.created_at, monthDate.getFullYear(), monthDate.getMonth())).length;
            return count;
        });
        const maxCount = Math.max(1, ...counts);

        months.forEach((monthDate, index) => {
            const count = counts[index];
            const percent = Math.round((count / maxCount) * 100);
            const item = document.createElement('div');
            item.className = 'progress-row';
            item.innerHTML = `
                <div>
                    <span>${formatShortMonth(monthDate)}</span>
                    <span>${count} transaksi</span>
                </div>
                <div class="progress-bar purple" style="--value: ${percent}%"></div>
            `;
            monthlyList.appendChild(item);
        });
    };

    const renderCategories = (requests, categories) => {
        if (!categoryList) {
            return;
        }
        categoryList.innerHTML = '';
        const counts = new Map();
        requests.forEach((request) => {
            counts.set(request.category_id, (counts.get(request.category_id) || 0) + 1);
        });
        const categoryMap = new Map(categories.map((category) => [category.id, category.name]));
        const sorted = Array.from(counts.entries())
            .map(([id, count]) => ({ id, count, name: categoryMap.get(id) || 'Kategori' }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);

        if (!sorted.length) {
            categoryList.innerHTML = '<p class="empty-state">Belum ada data kategori.</p>';
            return;
        }

        const colors = ['blue', 'green', 'orange', 'purple'];
        const maxCount = Math.max(1, ...sorted.map((item) => item.count));

        sorted.forEach((item, index) => {
            const percent = Math.round((item.count / maxCount) * 100);
            const row = document.createElement('div');
            row.className = 'progress-row';
            row.innerHTML = `
                <div>
                    <span>${item.name}</span>
                    <span>${item.count}</span>
                </div>
                <div class="progress-bar ${colors[index % colors.length]}" style="--value: ${percent}%"></div>
            `;
            categoryList.appendChild(row);
        });
    };

    const renderLatestTransactions = (orders) => {
        if (!latestTransactions) {
            return;
        }
        latestTransactions.innerHTML = '';
        const sorted = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

        if (!sorted.length) {
            latestTransactions.innerHTML = '<p class="empty-state">Belum ada transaksi.</p>';
            return;
        }

        sorted.forEach((order) => {
            const requestTitle = order.Request?.title || 'Transaksi Baru';
            const customerName = order.Request?.User?.name || 'User';
            const merchantName = order.Merchant?.business_name || order.Merchant?.User?.name || 'Merchant';
            const statusMap = {
                completed: { label: 'Completed', className: 'success' },
                dp_paid: { label: 'DP Paid', className: 'info' },
                in_progress: { label: 'On Progress', className: 'info' },
                awaiting_confirmation: { label: 'Menunggu Pelunasan', className: 'info' },
            };
            const statusInfo = statusMap[order.status] || { label: order.status || '-', className: 'info' };
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div>
                    <strong>${requestTitle}</strong>
                    <p>${customerName} → ${merchantName}</p>
                </div>
                <div class="list-meta">
                    <span>${formatCurrency(order.total_price)}</span>
                    <span class="status-pill ${statusInfo.className}">${statusInfo.label}</span>
                </div>
            `;
            latestTransactions.appendChild(item);
        });
    };

    const loadData = async () => {
        try {
            const [pendingMerchants, merchants, orders, payments, categories, requests] = await Promise.all([
                fetchJson(`${API_BASE}/users?role=merchant&verified=false`),
                fetchJson(`${API_BASE}/users?role=merchant`),
                fetchJson(`${API_BASE}/orders`),
                fetchJson(`${API_BASE}/payments?status=succeeded`),
                fetchJson(`${API_BASE}/categories`),
                fetchJson(`${API_BASE}/requests`),
            ]);

            const pendingCount = pendingMerchants.length;
            const merchantCount = merchants.length;
            const orderCount = orders.length;
            const revenue = sumPayments(payments);

            const now = new Date();
            const currentMonthOrders = orders.filter((order) => filterByMonth(order.created_at, now.getFullYear(), now.getMonth()));
            const currentMonthRevenue = sumPayments(
                payments.filter((payment) => filterByMonth(payment.created_at, now.getFullYear(), now.getMonth()))
            );
            const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthRevenue = sumPayments(
                payments.filter((payment) => filterByMonth(payment.created_at, lastMonthDate.getFullYear(), lastMonthDate.getMonth()))
            );
            const revenueChange = lastMonthRevenue
                ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
                : null;

            setText(statPending, pendingCount);
            setText(statMerchants, merchantCount);
            setText(statTransactions, orderCount);
            setText(statRevenue, formatCurrency(revenue));
            setText(navVerifyCount, pendingCount);

            setText(overviewRevenue, formatCurrency(revenue));
            setText(
                overviewRevenueChange,
                revenueChange !== null ? `${revenueChange > 0 ? '+' : ''}${revenueChange}% dari bulan lalu` : 'Belum ada data bulan lalu'
            );
            setText(overviewMerchants, merchantCount);
            setText(overviewMerchantsPending, `${pendingCount} menunggu verifikasi`);
            setText(overviewTransactions, currentMonthOrders.length);

            renderMonthly(orders);
            renderCategories(requests, categories);
            renderLatestTransactions(orders);
        } catch (error) {
            setText(latestTransactions, 'Gagal memuat data.');
        }
    };

    const init = () => {
        const auth = ensureAdminAccess();
        if (!auth) {
            return;
        }
        loadData();
    };

    init();
})();
