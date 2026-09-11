const FIREBASE_DB_URL = "ضع_رابط_قاعدة_البيانات_هنا"; // مثال: https://xxx-default-rtdb.firebaseio.com/
const WHATSAPP_NUMBER = "201143348433";

// التهيئة الأكيدة
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp({ databaseURL: FIREBASE_DB_URL });
}
const db = (typeof firebase !== 'undefined') ? firebase.database() : null;

function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    if (!db) {
        alert("لم يتم الربط مع Firebase! تأكد من وضع الرابط في ملف main.js");
        return;
    }
    initBricksListener();
    initGovsListener();
    setupForms();
});

function initBricksListener() {
    db.ref('bricks').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        const catalogGrid = document.getElementById("catalogGrid");
        const adminBricksList = document.getElementById("adminBricksList");
        const reqTypeSelect = document.getElementById("reqType");

        if (catalogGrid) catalogGrid.innerHTML = "";
        if (adminBricksList) adminBricksList.innerHTML = "";
        if (reqTypeSelect) reqTypeSelect.innerHTML = `<option value="">اختر نوع الطوب...</option>`;

        Object.keys(data).forEach(id => {
            const item = data[id];
            const img = item.imageUrl || 'https://via.placeholder.com/300x180?text=طوب+العمار+مصر';

            if (catalogGrid) {
                catalogGrid.innerHTML += `
                    <div class="brick-card">
                        <img src="${img}" alt="${item.name}" class="brick-img">
                        <div class="brick-info">
                            <h3>${item.name}</h3>
                            <p>المقاس: ${item.size || 'قياسي'}</p>
                            <p class="price">${item.price} ج.م / ألف</p>
                        </div>
                    </div>`;
            }

            if (adminBricksList) {
                adminBricksList.innerHTML += `
                    <li>
                        <span>${item.name} - ${item.price} ج.م</span>
                        <button onclick="deleteItem('bricks', '${id}')" class="btn-del">حذف</button>
                    </li>`;
            }

            if (reqTypeSelect) {
                reqTypeSelect.innerHTML += `<option value="${item.name}">${item.name}</option>`;
            }
        });
    });
}

function initGovsListener() {
    db.ref('governorates').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        const adminGovList = document.getElementById("adminGovList");
        const reqGovSelect = document.getElementById("reqGovernorate");

        if (adminGovList) adminGovList.innerHTML = "";
        if (reqGovSelect) reqGovSelect.innerHTML = `<option value="">اختر المحافظة...</option>`;

        Object.keys(data).forEach(id => {
            const item = data[id];

            if (adminGovList) {
                adminGovList.innerHTML += `
                    <li>
                        <span>${item.name} (${item.price} ج.م)</span>
                        <button onclick="deleteItem('governorates', '${id}')" class="btn-del">حذف</button>
                    </li>`;
            }

            if (reqGovSelect) {
                reqGovSelect.innerHTML += `<option value="${item.name}">${item.name}</option>`;
            }
        });
    });
}

function setupForms() {
    const addBrickForm = document.getElementById("addBrickForm");
    if (addBrickForm) {
        addBrickForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("brickName").value;
            const size = document.getElementById("brickSize").value;
            const price = document.getElementById("brickPrice").value;
            const imageUrl = document.getElementById("brickImage").value;

            db.ref('bricks').push({ name, size, price, imageUrl }).then(() => {
                showToast("تمت إضافة الطوب بنجاح ✅");
                addBrickForm.reset();
            }).catch(err => alert("خطأ: " + err.message));
        });
    }

    const addGovForm = document.getElementById("addGovForm");
    if (addGovForm) {
        addGovForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("govName").value;
            const price = document.getElementById("govPrice").value;

            db.ref('governorates').push({ name, price }).then(() => {
                showToast("تمت إضافة المحافظة بنجاح ✅");
                addGovForm.reset();
            }).catch(err => alert("خطأ: " + err.message));
        });
    }

    const clientOrderForm = document.getElementById("clientOrderForm");
    if (clientOrderForm) {
        clientOrderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("reqName").value;
            const phone = document.getElementById("reqPhone").value;
            const type = document.getElementById("reqType").value;
            const qty = document.getElementById("reqQty").value;
            const gov = document.getElementById("reqGovernorate").value;
            const address = document.getElementById("reqAddress").value;

            const msg = `*طلب توريد طوب جديد - العمار مصر 🧱*%0A%0A` +
                        `*الاسم:* ${name}%0A` +
                        `*الهاتف:* ${phone}%0A` +
                        `*النوع:* ${type}%0A` +
                        `*الكمية:* ${qty} ألف طوبة%0A` +
                        `*المحافظة:* ${gov}%0A` +
                        `*العنوان:* ${address}`;

            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
            showToast("جاري تحويلك للواتساب... 💬");
            clientOrderForm.reset();
        });
    }
}

window.deleteItem = function(path, id) {
    if (confirm("هل أنت متأكد من الحذف؟")) {
        db.ref(`${path}/${id}`).remove().then(() => showToast("تم الحذف بنجاح ✅"));
    }
};
