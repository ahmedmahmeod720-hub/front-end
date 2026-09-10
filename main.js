const API_URL = "https://backend-yaft.onrender.com/api";
const WHATSAPP_NUMBER = "201143348433";

let currentBricks = {};
let currentGovs = {};

// 1. Toast
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
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

// 2. معاينة صور الشهادات
function openCertModal(src) {
    document.getElementById("certModal").style.display = "flex";
    document.getElementById("imgModalTarget").src = src;
}

function closeCertModal() {
    document.getElementById("certModal").style.display = "none";
}

// 3. التنقل والصفحات
function showSection(sectionId, btn) {
    document.querySelectorAll(".portal-page").forEach(p => p.classList.remove("active-page"));
    document.querySelectorAll("#clientNav .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active-page");
    btn?.classList.add("active");
}

function showAdminTab(tabId, btn) {
    document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.remove("active-tab"));
    document.querySelectorAll("#adminNav .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active-tab");
    btn?.classList.add("active");
}

function openAdminModal() { document.getElementById("adminAuthModal").style.display = "flex"; }
function closeAdminModal() { document.getElementById("adminAuthModal").style.display = "none"; }

function showAdminDashboard() {
    closeAdminModal();
    document.getElementById("clientPortal").style.display = "none";
    document.getElementById("clientNav").style.display = "none";
    document.getElementById("adminPortal").style.display = "block";
    document.getElementById("adminNav").style.display = "flex";
    loadAdminData();
}

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    document.getElementById("adminPortal").style.display = "none";
    document.getElementById("adminNav").style.display = "none";
    document.getElementById("clientPortal").style.display = "block";
    document.getElementById("clientNav").style.display = "flex";
    showToast("تم الخروج للواجهة العامة 👁️");
}

// 4. جلب البيانات من السيرفر المباشر
document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    if(localStorage.getItem('adminToken')) showAdminDashboard();
});

async function fetchData() {
    try {
        const [resB, resG] = await Promise.all([
            fetch(`${API_URL}/bricks`),
            fetch(`${API_URL}/governorates`)
        ]);
        
        const bricksArr = await resB.json();
        const govsArr = await resG.json();

        currentBricks = {};
        if(Array.isArray(bricksArr)) {
            bricksArr.forEach(b => currentBricks[b.name] = { price: b.price, size: b.size });
        }

        currentGovs = {};
        if(Array.isArray(govsArr)) {
            govsArr.forEach(g => currentGovs[g.name] = g.freight);
        }

        renderClientViews();
    } catch (err) {
        showToast("خطأ في جلب البيانات من السيرفر", "error");
    }
}

function renderClientViews() {
    const grid = document.getElementById("pricesDisplayGrid");
    const typeSelect = document.getElementById("reqType");
    const govSelect = document.getElementById("reqGovernorate");

    if(!grid) return;
    grid.innerHTML = ""; typeSelect.innerHTML = ""; govSelect.innerHTML = "";

    for (let type in currentBricks) {
        const b = currentBricks[type];
        grid.innerHTML += `
            <div class="brick-card">
                <h4>🧱 ${type}</h4>
                <p>المقاس القياسي: ${b.size || 'غير محدد'}</p>
                <div class="price-tag-big">سعر الألف طوبة: ${Number(b.price).toLocaleString()} ج.م</div>
            </div>
        `;
        typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
    }

    for (let gov in currentGovs) {
        govSelect.innerHTML += `<option value="${gov}">${gov} (مشال: ${currentGovs[gov]} ج.م/ألف)</option>`;
    }

    calculateOrderTotal();
}

function calculateOrderTotal() {
    const type = document.getElementById("reqType")?.value;
    const qty = parseFloat(document.getElementById("reqQty")?.value) || 0;
    const gov = document.getElementById("reqGovernorate")?.value;

    const bPrice = currentBricks[type]?.price || 0;
    const gFreight = currentGovs[gov] || 0;

    const total = (qty / 1000) * (parseFloat(bPrice) + parseFloat(gFreight));
    if(document.getElementById("estimatedPrice")) {
        document.getElementById("estimatedPrice").value = total.toLocaleString() + " ج.م";
    }
}

// 5. إرسال الطلب عبر الواتساب وتسجيل الأوردر
document.getElementById("clientOrderForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const payload = {
        name: document.getElementById("reqName").value,
        phone: document.getElementById("reqPhone").value,
        type: document.getElementById("reqType").value,
        qty: document.getElementById("reqQty").value,
        governorate: document.getElementById("reqGovernorate").value,
        address: document.getElementById("reqAddress").value,
        total: document.getElementById("estimatedPrice").value
    };

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        const message = `*طلب توريد جديد من موقع العمار مصر 🧱*%0A%0A` +
            `*أوردر رقم:* ${data.orderId || 'جديد'}%0A` +
            `*اسم المهندس/العميل:* ${payload.name}%0A` +
            `*رقم التليفون:* ${payload.phone}%0A` +
            `*نوع الطوب:* ${payload.type}%0A` +
            `*الكمية المطلوبة:* ${payload.qty} طوبة%0A` +
            `*المحافظة:* ${payload.governorate}%0A` +
            `*العنوان:* ${payload.address}%0A` +
            `*الإجمالي:* ${payload.total}%0A%0A` +
            `يرجى التأكيد والمتابعة!`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        showToast(`تم تسجيل أوردر بنجاح ✨`);
        e.target.reset();
    } catch(err) {
        showToast("عذراً، فشل إرسال الطلب", "error");
    }
});

// 6. لوحة التحكم والإضافة
async function handleAddNewBrick(e) {
    e.preventDefault();
    const name = document.getElementById("newBrickName").value;
    const price = document.getElementById("newBrickPrice").value;
    const size = document.getElementById("newBrickSize").value;
    await saveBrickData(name, price, size);
    e.target.reset();
}

async function handleAddNewGov(e) {
    e.preventDefault();
    const name = document.getElementById("newGovName").value;
    const freight = document.getElementById("newGovFreight").value;
    await saveGovData(name, freight);
    e.target.reset();
}

async function saveBrickData(name, price, size) {
    await fetch(`${API_URL}/bricks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`},
        body: JSON.stringify({ name, price, size })
    });
    showToast("تم تحديث الكتالوج ✅");
    fetchData();
}

async function saveGovData(name, freight) {
    await fetch(`${API_URL}/governorates`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken')}`},
        body: JSON.stringify({ name, freight })
    });
    showToast("تم تحديث سعر المشال ✅");
    fetchData();
}

async function loadAdminData() {
    const token = localStorage.getItem('adminToken');
    
    // بناء تحكم الطوب
    const pContainer = document.getElementById("adminPriceControls");
    pContainer.innerHTML = "";
    for(let type in currentBricks) {
        const b = currentBricks[type];
        pContainer.innerHTML += `
            <div class="form-group full-width" style="margin-bottom:10px;">
                <label style="color:var(--accent);">${type}</label>
                <div style="display:flex; gap:10px;">
                    <input type="number" id="price_${type}" value="${b.price}">
                    <input type="text" id="size_${type}" value="${b.size||''}">
                    <button class="btn-submit" onclick="saveBrickData('${type}', document.getElementById('price_${type}').value, document.getElementById('size_${type}').value)">حفظ 💾</button>
                    <button class="btn-submit btn-cancel" onclick="deleteBrick('${type}')">حذف ❌</button>
                </div>
            </div>
        `;
    }

    // جدول المحافظات
    const gBody = document.getElementById("adminFreightTableBody");
    gBody.innerHTML = "";
    for(let gov in currentGovs) {
        gBody.innerHTML += `
            <tr>
                <td>${gov}</td>
                <td><input type="number" id="gov_${gov}" value="${currentGovs[gov]}"> ج.م</td>
                <td>
                    <button class="btn-submit" onclick="saveGovData('${gov}', document.getElementById('gov_${gov}').value)">حفظ 💾</button>
                    <button class="btn-submit btn-cancel" onclick="deleteGov('${gov}')">حذف ❌</button>
                </td>
            </tr>
        `;
    }

    // جدول الطلبات
    try {
        const res = await fetch(`${API_URL}/orders`, { headers: {'Authorization': `Bearer ${token}`} });
        const orders = await res.json();
        const oBody = document.getElementById("adminOrdersTableBody");
        oBody.innerHTML = "";
        let rev = 0;

        if(Array.isArray(orders)) {
            orders.forEach(o => {
                rev += parseFloat(o.total.replace(/[^0-9.-]+/g,"")) || 0;
                oBody.innerHTML += `
                    <tr>
                        <td><strong>أوردر ${o.id}</strong></td>
                        <td>${o.name}</td>
                        <td>${o.phone}</td>
                        <td>${o.type} (${o.qty})</td>
                        <td>${o.governorate} - ${o.address}</td>
                        <td>${o.total}</td>
                        <td>${o.status}</td>
                        <td><button class="btn-submit btn-cancel" onclick="deleteOrder(${o.id})">حذف</button></td>
                    </tr>
                `;
            });
            document.getElementById("totalOrdersCount").innerText = orders.length;
            document.getElementById("totalRevenue").innerText = rev.toLocaleString() + " ج.م";
        }
    } catch(err) {}
}

async function deleteBrick(name) {
    await fetch(`${API_URL}/bricks/${name}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${localStorage.getItem('adminToken')}`}
    });
    showToast("تم الحذف بنجاح", "error");
    fetchData();
}

async function deleteGov(name) {
    await fetch(`${API_URL}/governorates/${name}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${localStorage.getItem('adminToken')}`}
    });
    showToast("تم حذف المحافظة", "error");
    fetchData();
}

async function deleteOrder(id) {
    await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${localStorage.getItem('adminToken')}`}
    });
    showToast("تم حذف الأوردر", "error");
    loadAdminData();
}

// تسجيل الدخول
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        if(res.ok) {
            localStorage.setItem('adminToken', data.token);
            showToast("تم تسجيل الدخول بنجاح! ✨");
            showAdminDashboard();
        } else {
            showToast(data.message, "error");
        }
    } catch(err) {
        showToast("فشل الاتصال بالسيرفر", "error");
    }
});  // 7. تغيير بيانات الدخول للإدارة
document.getElementById("changePasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const newUsername = document.getElementById("newUsername").value;
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    try {
        const res = await fetch(`${API_URL}/admin/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ 
                newUsername: newUsername,
                currentPassword: currentPassword, 
                newPassword: newPassword 
            })
        });

        const data = await res.json();

        if (res.ok) {
            showToast("تم تغيير بيانات الدخول بنجاح! ✨");
            e.target.reset();
        } else {
            showToast(data.message || "حدث خطأ أثناء تغيير البيانات", "error");
        }
    } catch (err) {
        showToast("فشل الاتصال بالسيرفر", "error");
    }
});
