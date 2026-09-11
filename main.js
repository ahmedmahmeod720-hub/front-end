// 1. تهيئة Firebase (تأكد من وضع رابط قاعدة البيانات الخاصة بك هنا)
const firebaseConfig = {
    databaseURL: "https://el-ammar-egypt-default-rtdb.firebaseio.com" // استبدله برابطك الحقيقي
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const WHATSAPP_NUMBER = "201143348433";

// 2. حالة تسجيل الدخول المحلية
let isAdminLoggedIn = false;

// 3. دالة إظهار التنبيهات (Toast)
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 4. تحميل المنتجات والمحافظات فور فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
    loadBricks();
    loadGovernorates();
});

// 5. جلب وعرض أنواع الطوب
function loadBricks() {
    db.ref('bricks').on('value', (snapshot) => {
        const data = snapshot.val();
        const catalogGrid = document.getElementById("catalogGrid");
        const adminTable = document.getElementById("adminBricksTable");
        const selectType = document.getElementById("reqType");

        if (catalogGrid) catalogGrid.innerHTML = "";
        if (adminTable) adminTable.innerHTML = "";
        if (selectType) selectType.innerHTML = `<option value="">اختر نوع الطوب...</option>`;

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];

                // عرض في الكتالوج للزوار
                if (catalogGrid) {
                    catalogGrid.innerHTML += `
                        <div class="brick-card">
                            <h3>${item.name}</h3>
                            <p>المقاس: ${item.size || 'قياسي'}</p>
                            <p class="price">السعر: ${item.price} ج.م / ألف</p>
                        </div>`;
                }

                // عرض في لوحة التحكم
                if (adminTable) {
                    adminTable.innerHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.size || '-'}</td>
                            <td>${item.price} ج.م</td>
                            <td><button onclick="deleteBrick('${key}')" class="btn-danger">حذف</button></td>
                        </tr>`;
                }

                // إضافة للـ Select في حاسبة الطلب
                if (selectType) {
                    selectType.innerHTML += `<option value="${item.name}">${item.name}</option>`;
                }
            });
        }
    });
}

// 6. إضافة نوع طوب جديد
document.getElementById("addBrickForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("brickName").value;
    const size = document.getElementById("brickSize").value;
    const price = document.getElementById("brickPrice").value;

    db.ref('bricks').push({ name, size, price }).then(() => {
        showToast("تمت إضافة نوع الطوب بنجاح ✨");
        e.target.reset();
    });
});

// 7. حذف نوع طوب
function deleteBrick(id) {
    if (confirm("هل أنت تأكد من حذف هذا النوع؟")) {
        db.ref(`bricks/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}

// 8. جلب وعرض المحافظات
function loadGovernorates() {
    db.ref('governorates').on('value', (snapshot) => {
        const data = snapshot.val();
        const adminGovTable = document.getElementById("adminGovTable");
        const selectGov = document.getElementById("reqGovernorate");

        if (adminGovTable) adminGovTable.innerHTML = "";
        if (selectGov) selectGov.innerHTML = `<option value="">اختر المحافظة...</option>`;

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];

                if (adminGovTable) {
                    adminGovTable.innerHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.price} ج.م</td>
                            <td><button onclick="deleteGovernorate('${key}')" class="btn-danger">حذف</button></td>
                        </tr>`;
                }

                if (selectGov) {
                    selectGov.innerHTML += `<option value="${item.name}" data-price="${item.price}">${item.name}</option>`;
                }
            });
        }
    });
}

// 9. إضافة محافظة جديدة
document.getElementById("addGovForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("govName").value;
    const price = document.getElementById("govPrice").value;

    db.ref('governorates').push({ name, price }).then(() => {
        showToast("تمت إضافة المحافظة بنجاح ✨");
        e.target.reset();
    });
});

// 10. حذف محافظة
function deleteGovernorate(id) {
    if (confirm("هل أنت تأكد من حذف هذه المحافظة؟")) {
        db.ref(`governorates/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}

// 11. تسجيل الدخول للوحة التحكم
document.getElementById("adminLoginForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;

    db.ref('adminCredentials').once('value').then(snapshot => {
        const creds = snapshot.val() || { username: "admin", password: "123" };
        if (user === creds.username && pass === creds.password) {
            isAdminLoggedIn = true;
            document.getElementById("adminLoginModal").style.display = "none";
            document.getElementById("adminDashboard").style.display = "block";
            showToast("تم تسجيل الدخول بنجاح بنجاح");
            loadOrders();
        } else {
            alert("اسم المستخدم أو كلمة المرور غير صحيحة!");
        }
    });
});

// 12. إرسال الطلب وحفظه + تحويل للواتساب
document.getElementById("clientOrderForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById("reqName").value,
        phone: document.getElementById("reqPhone").value,
        type: document.getElementById("reqType").value,
        qty: document.getElementById("reqQty").value,
        governorate: document.getElementById("reqGovernorate").value,
        address: document.getElementById("reqAddress").value,
        total: document.getElementById("estimatedPrice")?.value || "حسب الاتفاق",
        date: new Date().toLocaleString('ar-EG')
    };

    db.ref('orders').push(payload).then(() => {
        const message = `*طلب توريد جديد من موقع العمار مصر 🧱*%0A%0A` +
            `*اسم العميل:* ${payload.name}%0A` +
            `*التليفون:* ${payload.phone}%0A` +
            `*النوع:* ${payload.type}%0A` +
            `*الكمية:* ${payload.qty} طوبة%0A` +
            `*المحافظة:* ${payload.governorate}%0A` +
            `*العنوان:* ${payload.address}%0A` +
            `*الإجمالي التقديري:* ${payload.total}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        showToast("تم تسجيل طلبك بنجاح ✨");
        e.target.reset();
    });
});

// 13. عرض الطلبات للأدمن
function loadOrders() {
    db.ref('orders').on('value', (snapshot) => {
        const data = snapshot.val();
        const ordersTable = document.getElementById("adminOrdersTable");
        if (!ordersTable) return;
        ordersTable.innerHTML = "";

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];
                ordersTable.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.name}</td>
                        <td>${item.phone}</td>
                        <td>${item.type} (${item.qty})</td>
                        <td>${item.governorate} - ${item.address}</td>
                        <td>${item.total}</td>
                        <td><button onclick="deleteOrder('${key}')" class="btn-danger">حذف</button></td>
                    </tr>`;
            });
        }
    });
}

function deleteOrder(id) {
    if (confirm("حذف هذا الطلب؟")) {
        db.ref(`orders/${id}`).remove();
    }
}
