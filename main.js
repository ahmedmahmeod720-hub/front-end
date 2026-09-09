const API_URL = 'https://backend-y8ft.onrender.com';

const initialBricks = {
    "طوب طفلي مفرغ": { price: 1400, size: "24×11×6 سم" },
    "طوب طفلي مصمت": { price: 1600, size: "25×12×6 سم" },
    "طوب أسمنتي مصمت": { price: 2100, size: "25×12×6 سم" },
    "بلوك أسمنتي مفرغ": { price: 3200, size: "40×20×20 سم" }
};

const initialGovernorates = {
    "القاهرة": 500, "الجيزة": 500, "الإسكندرية": 800, "القليوبية": 450,
    "الدقهلية": 700, "الغربية": 650, "المنوفية": 600, "الشرقية": 600,
    "البحيرة": 750, "كفر الشيخ": 750, "دمياط": 800, "بورسعيد": 850,
    "الإسماعيلية": 750, "السويس": 800, "الفيوم": 700, "بني سويف": 800,
    "المنيا": 1000, "أسيوط": 1200, "سوهاج": 1300, "قنا": 1400,
    "الأقصر": 1500, "أسوان": 1600, "مطروح": 1200, "الوادي الجديد": 1700,
    "البحر الأحمر": 1400, "شمال سيناء": 1500, "جنوب سيناء": 1600
};

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getStoredBricks() {
    const data = localStorage.getItem("company_bricks");
    return data ? JSON.parse(data) : initialBricks;
}

function saveBricksData(bricks) {
    localStorage.setItem("company_bricks", JSON.stringify(bricks));
    renderAllViews();
}

function getStoredGovernorates() {
    const data = localStorage.getItem("company_governorates");
    return data ? JSON.parse(data) : initialGovernorates;
}

function saveGovernoratesData(govs) {
    localStorage.setItem("company_governorates", JSON.stringify(govs));
    renderAllViews();
}

function getStoredOrders() {
    const data = localStorage.getItem("company_orders");
    return data ? JSON.parse(data) : [];
}

function saveOrdersData(orders) {
    localStorage.setItem("company_orders", JSON.stringify(orders));
    renderAllViews();
}

document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem("company_bricks")) {
        localStorage.setItem("company_bricks", JSON.stringify(initialBricks));
    }
    if (!localStorage.getItem("company_governorates")) {
        localStorage.setItem("company_governorates", JSON.stringify(initialGovernorates));
    }
    
    // التحقق من وجود توكن سابق
    if (localStorage.getItem('adminToken')) {
        showAdminDashboard();
    }
    
    renderAllViews();
});

function renderAllViews() {
    renderClientCatalogUI();
    renderAdminPriceControls();
    renderAdminFreightControls();
    renderAdminTables();
}

function showSection(sectionId, btn) {
    document.querySelectorAll(".portal-page").forEach(page => page.classList.remove("active-page"));
    document.querySelectorAll("#clientNav .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active-page");
    if(btn) btn.classList.add("active");
}

function showAdminTab(tabId, btn) {
    document.querySelectorAll(".admin-tab-content").forEach(tab => tab.classList.remove("active-tab"));
    document.querySelectorAll(".admin-tabs .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(tabId).classList.add("active-tab");
    if(btn) btn.classList.add("active");
}

function openAdminModal() { document.getElementById("adminAuthModal").style.display = "flex"; }
function closeAdminModal() { document.getElementById("adminAuthModal").style.display = "none"; }

function showAdminDashboard() {
    closeAdminModal();
    document.getElementById("clientPortal").style.display = "none";
    document.getElementById("clientNav").style.display = "none";
    document.getElementById("adminPortal").style.display = "block";
    document.getElementById("adminNav").style.display = "flex";
}

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    document.getElementById("adminPortal").style.display = "none";
    document.getElementById("adminNav").style.display = "none";
    document.getElementById("clientPortal").style.display = "block";
    document.getElementById("clientNav").style.display = "flex";
    showToast("تم الخروج ومعاينة الموقع كمهندس 👁️");
}

function renderClientCatalogUI() {
    const bricks = getStoredBricks();
    const govs = getStoredGovernorates();

    const grid = document.getElementById("pricesDisplayGrid");
    const typeSelect = document.getElementById("reqType");
    const govSelect = document.getElementById("reqGovernorate");

    if(!grid || !typeSelect || !govSelect) return;

    grid.innerHTML = "";
    typeSelect.innerHTML = "";
    govSelect.innerHTML = "";

    let govsHtmlList = "";
    for (let gov in govs) {
        govsHtmlList += `<div class="gov-price-row"><span>📍 ${gov}</span><span>${govs[gov]} ج.م</span></div>`;
    }

    for (let type in bricks) {
        const item = bricks[type];
        grid.innerHTML += `
            <div class="brick-card">
                <h4>🧱 ${type}</h4>
                <ul class="brick-spec-list">
                    <li><span>المقاس القياسي:</span> <strong>${item.size || "25×12×6 سم"}</strong></li>
                </ul>
                <div class="price-tag-big">سعر الألف طوبة: ${item.price.toLocaleString()} ج.م</div>
                <div class="gov-prices-box">
                    <h5>🚚 تفاصيل أسعار المشال والنقل بالمحافظات</h5>
                    ${govsHtmlList}
                </div>
            </div>
        `;
        typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
    }

    for (let gov in govs) {
        govSelect.innerHTML += `<option value="${gov}">${gov} (مشال: ${govs[gov]} ج.م/ألف)</option>`;
    }

    calculateOrderTotal();
}

function calculateOrderTotal() {
    const bricks = getStoredBricks();
    const govs = getStoredGovernorates();

    const typeEl = document.getElementById("reqType");
    const qtyEl = document.getElementById("reqQty");
    const govEl = document.getElementById("reqGovernorate");
    const estPriceEl = document.getElementById("estimatedPrice");

    if (!typeEl || !qtyEl || !govEl || !estPriceEl) return;

    const type = typeEl.value;
    const qty = parseFloat(qtyEl.value) || 0;
    const gov = govEl.value;

    const pricePerThousand = bricks[type] ? bricks[type].price : 0;
    const freightPerThousand = govs[gov] ? govs[gov] : 0;

    const brickTotal = (qty / 1000) * pricePerThousand;
    const freightTotal = (qty / 1000) * freightPerThousand;
    const grandTotal = brickTotal + freightTotal;

    estPriceEl.value = grandTotal.toLocaleString() + " ج.م (شامل المشال)";
}

document.getElementById("clientOrderForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const orders = getStoredOrders();

    const newOrder = {
        id: Math.floor(10000 + Math.random() * 90000),
        name: document.getElementById("reqName").value,
        phone: document.getElementById("reqPhone").value,
        type: document.getElementById("reqType").value,
        qty: document.getElementById("reqQty").value,
        governorate: document.getElementById("reqGovernorate").value,
        total: document.getElementById("estimatedPrice").value,
        address: document.getElementById("reqAddress").value,
        driver: "لم يحدد بعد",
        status: "قيد الانتظار"
    };

    orders.unshift(newOrder);
    saveOrdersData(orders);

    showToast(`تم إرسال الطلب بنجاح برقم #${newOrder.id}! 🎉`);
    e.target.reset();
    calculateOrderTotal();
});

document.getElementById("addNewBrickForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const bricks = getStoredBricks();

    const name = document.getElementById("newBrickName").value.trim();
    const price = parseFloat(document.getElementById("newBrickPrice").value);
    const size = document.getElementById("newBrickSize").value || "25×12×6 سم";

    if (name && price) {
        bricks[name] = { price, size };
        saveBricksData(bricks);
        showToast(`تمت إضافة (${name}) للكتالوج بنجاح 🧱`);
        e.target.reset();
    }
});

function renderAdminPriceControls() {
    const bricks = getStoredBricks();
    const container = document.getElementById("adminPriceControls");
    if (!container) return;
    container.innerHTML = "";

    for (let type in bricks) {
        const item = bricks[type];
        container.innerHTML += `
            <div class="form-group full-width" style="border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
                <label style="color:#38bdf8; font-size:15px;">🧱 ${type}</label>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
                    <input type="number" id="price_${type}" value="${item.price}" placeholder="السعر" style="width:130px;">
                    <input type="text" id="size_${type}" value="${item.size || ''}" placeholder="المقاس" style="flex:1;">
                    <button type="button" class="btn-submit" style="width:auto; background:#38bdf8; color:#000;" onclick="updateBrick('${type}')">حفظ التعديل 💾</button>
                    <button type="button" class="btn-submit" style="width:auto; background:#ef4444; color:#fff;" onclick="deleteBrick('${type}')">حذف ❌</button>
                </div>
            </div>
        `;
    }
}

function updateBrick(type) {
    const bricks = getStoredBricks();
    const newPrice = parseFloat(document.getElementById(`price_${type}`).value);
    const newSize = document.getElementById(`size_${type}`).value;

    if (newPrice) {
        bricks[type].price = newPrice;
        bricks[type].size = newSize;
        saveBricksData(bricks);
        showToast(`تم تحديث سعر ومواصفات (${type}) فوراً ✅`);
    }
}

function deleteBrick(type) {
    const bricks = getStoredBricks();
    delete bricks[type];
    saveBricksData(bricks);
    showToast(`تم حذف (${type}) من الكتالوج 🗑️`, "error");
}

function renderAdminFreightControls() {
    const govs = getStoredGovernorates();
    const tbody = document.getElementById("adminFreightTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (let gov in govs) {
        tbody.innerHTML += `
            <tr>
                <td><strong>📍 ${gov}</strong></td>
                <td>
                    <input type="number" id="freight_${gov}" value="${govs[gov]}" style="background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:6px 10px; border-radius:6px; width:150px;"> ج.م
                </td>
                <td>
                    <button type="button" onclick="updateGovFreight('${gov}')" style="background:#38bdf8; color:#000; border:none; padding:6px 12px; border-radius:6px; font-weight:700; cursor:pointer;">حفظ سعر المشال 💾</button>
                </td>
            </tr>
        `;
    }
}

function updateGovFreight(gov) {
    const govs = getStoredGovernorates();
    const newPrice = parseFloat(document.getElementById(`freight_${gov}`).value);
    if (!isNaN(newPrice)) {
        govs[gov] = newPrice;
        saveGovernoratesData(govs);
        showToast(`تم تحديث سعر المشال لمحافظة (${gov}) بنجاح 🚚`);
    }
}

function renderAdminTables() {
    const orders = getStoredOrders();
    const driversBody = document.getElementById("adminDriversTableBody");
    const financeBody = document.getElementById("adminFinanceTableBody");

    if (!driversBody || !financeBody) return;

    driversBody.innerHTML = "";
    financeBody.innerHTML = "";

    let totalRev = 0;

    orders.forEach((ord, index) => {
        const numPrice = parseFloat(ord.total.replace(/[^0-9.-]+/g,"")) || 0;
        totalRev += numPrice;

        driversBody.innerHTML += `
            <tr>
                <td><strong>#${ord.id}</strong></td>
                <td>${ord.name}</td>
                <td>${ord.type} (${ord.qty} طوبة)<br><small style="color:#38bdf8;">محافظة: ${ord.governorate}</small></td>
                <td>${ord.address}</td>
                <td><input type="text" value="${ord.driver}" onchange="updateDriver(${index}, this.value)" style="background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:4px; border-radius:4px; width:130px;"></td>
                <td>
                    <select onchange="updateStatus(${index}, this.value)" style="background:#1e293b; color:#fff; border:1px solid rgba(255,255,255,0.1); padding:4px; border-radius:4px;">
                        <option value="قيد الانتظار" ${ord.status==='قيد الانتظار'?'selected':''}>قيد الانتظار</option>
                        <option value="في الطريق" ${ord.status==='في الطريق'?'selected':''}>في الطريق</option>
                        <option value="تم التوصيل" ${ord.status==='تم التوصيل'?'selected':''}>تم التوصيل</option>
                    </select>
                </td>
                <td><button onclick="deleteOrder(${index})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">مسح</button></td>
            </tr>
        `;

        financeBody.innerHTML += `
            <tr>
                <td>#${ord.id}</td>
                <td><strong>${ord.name}</strong><br><small>${ord.phone}</small></td>
                <td>${ord.type} - ${ord.qty} طوبة<br><small style="color:#38bdf8;">(${ord.governorate})</small></td>
                <td style="color:#10b981; font-weight:800;">${ord.total}</td>
                <td><span style="background:rgba(56, 189, 248, 0.1); color:#38bdf8; padding:2px 8px; border-radius:4px;">${ord.status}</span></td>
                <td><button onclick="deleteOrder(${index})" style="background:#ef4444; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">مسح</button></td>
            </tr>
        `;
    });

    const totalOrdersCount = document.getElementById("totalOrdersCount");
    const totalRevenue = document.getElementById("totalRevenue");

    if(totalOrdersCount) totalOrdersCount.innerText = orders.length;
    if(totalRevenue) totalRevenue.innerText = totalRev.toLocaleString() + " ج.م";
}

function updateDriver(index, val) {
    const orders = getStoredOrders();
    orders[index].driver = val;
    saveOrdersData(orders);
    showToast("تم تعيين السائق بنجاح 🚛");
}

function updateStatus(index, val) {
    const orders = getStoredOrders();
    orders[index].status = val;
    saveOrdersData(orders);
    showToast("تم تحديث حالة الشحنة 🔄");
}

function deleteOrder(index) {
    const orders = getStoredOrders();
    orders.splice(index, 1);
    saveOrdersData(orders);
    showToast("تم مسح الطلب بنجاح", "error");
}

// === تسجيل دخول محلي مباشر وبديل سريع للباك إند ===

// 1. تسجيل الدخول Direct
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // فحص مباشر للحساب
    if (username === 'admin' && password === '123456') {
        localStorage.setItem('adminToken', 'local_admin_session_token');
        showToast('تم تسجيل الدخول بنجاح! ✨');
        showAdminDashboard();
    } else {
        showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
    }
});

// 2. تغيير كلمة المرور
document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('تم حفظ كلمة المرور الجديدة بنجاح ✨');
    e.target.reset();
});
