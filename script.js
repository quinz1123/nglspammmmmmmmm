

const firebaseConfig = {
  apiKey: "AIzaSyD6YeP5f1AQD-abEjT5puQqT7HhysptLQs",
  authDomain: "ngl-project-9eb40.firebaseapp.com",
  projectId: "ngl-project-9eb40",
  storageBucket: "ngl-project-9eb40.appspot.com",
  messagingSenderId: "744594564980",
  appId: "1:744594564980:web:26137932ef850ed0c3ee21"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


const linkInput = document.getElementById('link');
const pesanInput = document.getElementById('pesan');
const kirimBtn = document.getElementById('kirim');
const resetBtn = document.getElementById('reset');
const lihatStatusBtn = document.getElementById('lihat-status');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const logContent = document.getElementById('log-content');
const clearLogBtn = document.getElementById('clear-log');
const confirmationModal = document.getElementById('confirmation-modal');
const successModal = document.getElementById('success-modal');
const confirmLink = document.getElementById('confirm-link');
const confirmPesan = document.getElementById('confirm-pesan');
const successCount = document.getElementById('success-count');
const failCount = document.getElementById('fail-count');
const resultMessage = document.getElementById('result-message');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const statusIcon = document.getElementById('status-icon');
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const statusPage = document.getElementById("statusPage");
const statPage = document.getElementById("statPage");


let isSending = false;
let sentCount = 0;
let failedCount = 0;
const totalAttempts = 25;
let logs = [];
let currentLink = '';
let currentPesan = '';


window.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    kirimBtn.onclick = showConfirmationModal;
    resetBtn.onclick = resetForm;
    clearLogBtn.onclick = clearLogs;
    
    
    menuBtn.addEventListener('click', openSidebar);
    menuBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        openSidebar();
    }, { passive: false });
    
    overlay.addEventListener('click', closeSidebar);
    overlay.addEventListener('touchstart', function(e) {
        e.preventDefault();
        closeSidebar();
    }, { passive: false });
    
    
    if (lihatStatusBtn) {
        lihatStatusBtn.onclick = openStatusPage;
    }
    
    
    closeSidebar();
    closeStatusPage();
    closeStatistikPage();
    
    
    initCounter();
    

    if (loadHistory().length > 0) {
        updateStatus("📋 Riwayat Tersedia", "Ada riwayat pengiriman sebelumnya", "fa-history");
    }
    
    
    setupSidebarScroll();
    
    
    setupButtonTapEffects();
}


function setupButtonTapEffects() {
    const allButtons = document.querySelectorAll('button');

    allButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.classList.add('active-touch');
        }, { passive: true });

        button.addEventListener('touchend', function() {
            this.classList.remove('active-touch');
        }, { passive: true });
    });
}


function setupSidebarScroll() {
    const originalStyle = document.body.style.cssText;
    
    menuBtn.addEventListener('click', function() {
        if (sidebar.classList.contains('active')) {
            
            document.body.style.cssText = originalStyle;
        } else {

            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        }
    });
    
    overlay.addEventListener('click', function() {
        
        document.body.style.cssText = originalStyle;
    });
}


function openSidebar() {
    sidebar.classList.add("active");
    overlay.classList.add("active");
    

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}

function closeSidebar() {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
}

function openStatusPage() {
    renderHistory();
    statusPage.classList.add("active");
    closeSidebar();
}

function closeStatusPage() {
    statusPage.classList.remove("active");
}


function openStatistikPage() {
    statPage.classList.add("active");
    closeSidebar();
}

function closeStatistikPage() {
    statPage.classList.remove("active");
}

function showInfo(){
openInfoPage();
}


function showConfirmationModal() {
    currentLink = linkInput.value.trim();
    currentPesan = pesanInput.value.trim();

if (!currentLink) {
    showAlert("Error", "Link NGL harus diisi!");
    return;
}

if (!currentPesan) {
    showAlert("Error", "Pesan harus diisi!");
    return;
}

    
    if (!currentLink.startsWith("https://") && !currentLink.startsWith("http://")) {
        currentLink = "https://" + currentLink;
    }

    
    if (!currentLink.includes("ngl.link/")) {
        if (confirm("Link tidak mengandung 'ngl.link/'. Apakah Anda yakin ini link NGL yang valid?")) {
           
        } else {
            return;
        }
    }

    
    const displayLink = currentLink.length > 25 ? currentLink.substring(0, 22) + "..." : currentLink;
    const displayPesan = currentPesan.length > 25 ? currentPesan.substring(0, 22) + "..." : currentPesan;
    
    confirmLink.textContent = displayLink;
    confirmPesan.textContent = displayPesan;
    confirmationModal.classList.add("active");
}

function cancelSending() {
    confirmationModal.classList.remove("active");
}

function confirmSending() {
    confirmationModal.classList.remove("active");
    startSending();
}

async function startSending() {
if (isSending) {
    showAlert("Info", "Sedang mengirim pesan, tunggu hingga selesai!");
    return;
}
    
    isSending = true;
    
    
    sentCount = 0;
    failedCount = 0;
    logs = [];
    
    
    kirimBtn.disabled = true;
    kirimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM...';
    updateProgress(0);
    updateStatus("📤 Mengirim", "Sedang mengirim 25 pesan sekaligus...", "fa-paper-plane");
    
    
    confirmClearLogs();
    addLog("🚀 Memulai pengiriman 25 pesan...", "start");
    addLog(`📌 Target: ${currentLink}`, "info");
    addLog(`💬 Pesan: "${currentPesan}"`, "info");

    try {
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress > 90) {
                clearInterval(progressInterval);
                progress = 90;
            }
            updateProgress(progress);
            progressText.textContent = `${progress}% (0/25)`;
        }, 50);

        
        const result = await sendBulkMessages(currentLink, currentPesan);
        
        clearInterval(progressInterval);
        
        
        if (result.success) {
            sentCount = result.data.result.berhasil_dikirim || 0;
            failedCount = result.data.result.gagal_dikirim || 0;
            
            
            updateProgress(100);
            progressText.textContent = `100% (25/25)`;
            
            
            addLog(`✅ API Response: Berhasil ${sentCount}, Gagal ${failedCount}`, "success");
            
            
            if (result.data.result.username_target) {
                addLog(`🎯 Target: ${result.data.result.username_target}`, "info");
            }
            
            updateStatus("✅ Selesai", `Berhasil: ${sentCount}, Gagal: ${failedCount}`, "fa-check-circle");
            addLog(`🎉 Pengiriman selesai!`, "complete");
        } else {
            failedCount = 25;
            addLog(`❌ API Error: ${result.error}`, "error");
            updateStatus("❌ Gagal", "API mengembalikan error", "fa-exclamation-circle");
        }
        
    } catch (error) {
        console.error("Error during sending:", error);
        updateStatus("⚠️ Error", "Terjadi kesalahan sistem", "fa-exclamation-triangle");
        addLog("❌ Error sistem: " + error.message, "error");
    } finally {
        
        kirimBtn.disabled = false;
        kirimBtn.innerHTML = '<i class="fas fa-paper-plane"></i> KIRIM PESAN';
        isSending = false;
        
        
        saveToHistory();
        

        setTimeout(showSuccessModal, 1000);
    }
}

async function sendBulkMessages(link, message) {
    try {
        
        const apiUrl = `https://api.deline.web.id/tools/spamngl?url=${encodeURIComponent(link)}&message=${encodeURIComponent(message)}`;
        
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        
        const response = await fetch(apiUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        clearTimeout(timeoutId);
        
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        
        const data = await response.json();
        

        if (data && data.status === true) {
            return { 
                success: true, 
                data: data,
                message: "Berhasil mengirim 25 pesan"
            };
        } else {
            return { 
                success: false, 
                error: data?.message || "API returned false",
                data: data
            };
        }
        
    } catch (error) {
        
        let errorMsg = "Network error";
        if (error.name === 'AbortError') {
            errorMsg = "Timeout (30 detik)";
        } else if (error.message.includes('HTTP')) {
            errorMsg = error.message;
        }
        
        return { 
            success: false, 
            error: errorMsg
        };
    }
}

function updateProgress(percentage) {
    progressFill.style.width = percentage + "%";
}

function updateStatus(title, description, iconClass) {
    statusTitle.textContent = title;
    statusDesc.textContent = description;
    statusIcon.className = "fas " + iconClass;
}

function addLog(message, type = "info") {
    const time = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    
    const emptyState = logContent.querySelector('.log-empty');
    if (emptyState) {
        emptyState.remove();
    }
    
    
    const logItem = document.createElement('div');
    logItem.className = `log-item log-${type}`;
    
    
    const cleanMessage = message
        .replace(/✔/g, '✅')
        .replace(/❌/g, '❌')
        .replace(/\|\s*$/g, '');
    
    logItem.innerHTML = `
        <div class="log-message">${cleanMessage}</div>
        <div class="log-time">${time}</div>
    `;
    
    
    logContent.insertBefore(logItem, logContent.firstChild);
    
    
    logs.unshift({ message: cleanMessage, time, type });
    if (logs.length > 50) logs.pop();
    
    
    logContent.scrollTop = 0;
}

function clearLogs() {
    document.getElementById("clearLogModal").classList.add("active");
}

function confirmClearLogs(){
    logs = [];
    logContent.innerHTML = `
        <div class="log-empty">
            <i class="fas fa-clipboard-list"></i>
            <p>Log aktivitas akan muncul di sini</p>
        </div>
    `;
    closeClearLogs();
}

function closeClearLogs(){
    document.getElementById("clearLogModal").classList.remove("active");
}

function resetForm() {
    if (isSending) {
        if (!confirm("Pengiriman sedang berjalan. Reset form?")) {
            return;
        }
    }
    
    linkInput.value = "";
    pesanInput.value = "";
    linkInput.focus();
}

function showSuccessModal() {
    successCount.textContent = sentCount;
    failCount.textContent = failedCount;
    
    
    if (sentCount === totalAttempts) {
        resultMessage.textContent = "🎉 Semua 25 pesan berhasil dikirim!";
    } else if (sentCount >= 20) {
        resultMessage.textContent = "Done yach";
    } else if (sentCount >= 10) {
        resultMessage.textContent = "👍 Lumayan, setengah lebih berhasil";
    } else if (sentCount > 0) {
        resultMessage.textContent = "⚠️ Hanya sedikit yang berhasil";
    } else {
        resultMessage.textContent = "❌ Semua pesan gagal dikirim";
    }
    
    successModal.classList.add("active");
}

function closeSuccessModal() {
    successModal.classList.remove("active");
}

function saveToHistory() {
    const history = loadHistory();
    
    const historyEntry = {
        link: currentLink,
        pesan: currentPesan.length > 50 ? currentPesan.substring(0, 47) + "..." : currentPesan,
        sukses: sentCount,
        gagal: failedCount,
        waktu: new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: new Date().getTime()
    };
    
    history.unshift(historyEntry);
    
    if (history.length > 10) {
        history.length = 10;
    }
    
    saveHistory(history);
}

function saveHistory(data) {
    try {
        localStorage.setItem("ngl_history", JSON.stringify(data));
    } catch (e) {
        console.error("Error saving history:", e);
    }
}

function loadHistory() {
    try {
        const history = localStorage.getItem("ngl_history");
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error("Error loading history:", e);
        return [];
    }
}

function renderHistory() {
    const history = loadHistory();
    
    logContent.innerHTML = '';
    
    if (history.length === 0) {
        addLog("📋 Belum ada riwayat pengiriman nih", "info");
        return;
    }
    
    addLog("📋 RIWAYAT PENGGUNAAN", "start");
    

    history.slice(0, 5).forEach((entry, index) => {
        let pesanDisplay = entry.pesan;
        if (pesanDisplay.length > 25) {
            pesanDisplay = pesanDisplay.substring(0, 22) + "...";
        }
        
        const waktuParts = entry.waktu.split(', ');
        const tanggal = waktuParts[0];
        const jam = waktuParts[1] || "";
        
        addLog(`${tanggal} | ${jam} | ✅${entry.sukses} ❌${entry.gagal} | ${pesanDisplay}`, "info");
    });
    
    if (history.length > 5) {
        addLog(`📖 Dan ${history.length - 5} riwayat lainnya...`, "info");
    }
}

function showAlert(title, msg) {
    document.getElementById("alertTitle").innerText = title;
    document.getElementById("alertMessage").innerText = msg;
    document.getElementById("alertModal").classList.add("active");
}

function closeAlert() {
    document.getElementById("alertModal").classList.remove("active");
}
const infoPage=document.getElementById("infoPage");

function openInfoPage(){
infoPage.classList.add("active");
closeSidebar();
}

function closeInfoPage(){
infoPage.classList.remove("active");
}

const VISIT_KEY = "ngl_unique_device";
const visitRef = firebase.firestore().collection("stats").doc("visits");

async function initCounter() {

    if (!localStorage.getItem(VISIT_KEY)) {
        try {

            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(visitRef);
                
                let currentCount = 0;
                if (doc.exists) {
                    currentCount = doc.data().total || 0;
                }
                
                
                transaction.set(visitRef, {
                    total: currentCount + 1,
                    lastUpdate: new Date().toISOString(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            
            
            localStorage.setItem(VISIT_KEY, "true");
            console.log("Visitor counted for today");
            
        } catch (error) {
            console.error("Error updating counter:", error);
        }
    }

    
    visitRef.onSnapshot(
        (doc) => {
            if (doc.exists) {
                const count = doc.data().total || 0;
                const visitCountElement = document.getElementById("visitCount");
                if (visitCountElement) {
                    visitCountElement.innerText = count.toLocaleString('id-ID');
                }
            }
        },
        (error) => {
            console.error("Error listening to counter:", error);
            document.getElementById("visitCount").innerText = "0";
        }
    );
}

window.cancelSending = cancelSending;
window.confirmSending = confirmSending;
window.closeSuccessModal = closeSuccessModal;
window.closeSidebar = closeSidebar;
window.openStatusPage = openStatusPage;
window.closeStatusPage = closeStatusPage;
window.openStatistikPage = openStatistikPage;
window.closeStatistikPage = closeStatistikPage;
window.showInfo = showInfo;