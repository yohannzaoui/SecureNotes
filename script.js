let currentNotes = [];
let storageMode = "local"; 
let fileHandle = null;
let currentLang = localStorage.getItem('app_lang') || 'fr';

// --- DICTIONNAIRE ---
const translations = {
    fr: {
        lock_title: "Coffre-fort", lock_desc: "Authentification requise.", unlock_btn: "Déverrouiller",
        source_title: "DESTINATION DES DONNÉES", source_local: "Mémoire Navigateur", source_file: "Lier un fichier Excel",
        nav_security: "Sécurité", nav_quit: "Quitter", search_placeholder: "Rechercher une note ou un tag...",
        input_note: "Votre note ici...", input_tag: "Tag", btn_add: "Ajouter",
        footer_owner: "Propriétaire & Développeur", sec_title: "Sécurité", sec_old: "Ancien MDP", sec_new: "Nouveau MDP", sec_reset: "Tout effacer",
        badge_local: "Mémoire Navigateur", badge_file: "Fichier Excel lié"
    },
    en: {
        lock_title: "Safe Vault", lock_desc: "Authentication required.", unlock_btn: "Unlock",
        source_title: "DATA DESTINATION", source_local: "Browser Memory", source_file: "Link Excel File",
        nav_security: "Security", nav_quit: "Quit", search_placeholder: "Search notes or tags...",
        input_note: "Your note here...", input_tag: "Tag", btn_add: "Add",
        footer_owner: "Owner & Developer", sec_title: "Security Settings", sec_old: "Old Password", sec_new: "New Password", sec_reset: "Reset All",
        badge_local: "Browser Storage", badge_file: "Excel File Linked"
    }
};

// --- TRADUCTION ---
function updateInterfaceLanguage() {
    // Éléments data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });
    
    // Placeholders
    document.getElementById('searchInput').placeholder = translations[currentLang].search_placeholder;
    document.getElementById('noteInput').placeholder = translations[currentLang].input_note;
    document.getElementById('tagInput').placeholder = translations[currentLang].input_tag;
    document.getElementById('oldPass').placeholder = translations[currentLang].sec_old;
    document.getElementById('newPass').placeholder = translations[currentLang].sec_new;
    document.getElementById('langBtnText').innerText = currentLang === 'fr' ? 'EN' : 'FR';

    // Badge dynamique
    const badge = document.getElementById('modeBadge');
    if(badge && (storageMode === "local" || storageMode === "file")) {
        const icon = storageMode === "local" ? "database" : "file-check";
        const txt = storageMode === "local" ? translations[currentLang].badge_local : translations[currentLang].badge_file;
        badge.innerHTML = `<i data-lucide="${icon}" class="btn-icon"></i> ${txt}`;
        lucide.createIcons();
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('app_lang', currentLang);
    updateInterfaceLanguage();
}

// --- SÉCURITÉ ---
async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const input = document.getElementById('passwordInput');
    const storedHash = localStorage.getItem('app_password_hash');
    const hashedInput = await hashPassword(input.value);
    if (!storedHash) {
        localStorage.setItem('app_password_hash', hashedInput);
        unlockAuth();
    } else if (hashedInput === storedHash) {
        unlockAuth();
    } else { alert("Mot de passe incorrect / Incorrect Password"); }
}

function unlockAuth() {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('sourceSelector').classList.remove('hidden');
    lucide.createIcons();
}

// --- SOURCES ---
function useStorage(mode) {
    storageMode = "local";
    currentNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    launchApp();
}

async function useFileDirect() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Excel', accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']} }]
        });
        const file = await fileHandle.getFile();
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        currentNotes = XLSX.utils.sheet_to_json(sheet).map(n => ({
            id: n.ID || Date.now(), content: String(n.Contenu || ""),
            tag: String(n.Tag || "Général"), color: String(n.Couleur || "#2c3e50"), created: n.Creation || new Date().toLocaleString()
        }));
        storageMode = "file";
        document.getElementById('modeBadge').className = "badge bg-success mb-3 py-2 px-3 rounded-pill";
        launchApp();
    } catch (err) { console.log(err); }
}

function launchApp() {
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    updateInterfaceLanguage();
    loadNotes();
}

// --- ACTIONS ---
async function persistData() {
    if (storageMode === "local") {
        localStorage.setItem('notes', JSON.stringify(currentNotes));
    } else if (storageMode === "file" && fileHandle) {
        const data = currentNotes.map(n => ({ "ID": n.id, "Tag": n.tag, "Couleur": n.color, "Contenu": n.content, "Creation": n.created }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Notes");
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const writable = await fileHandle.createWritable();
        await writable.write(buf);
        await writable.close();
    }
}

function addNote() {
    const input = document.getElementById('noteInput');
    const tagInput = document.getElementById('tagInput');
    const color = document.querySelector('input[name="colorOpt"]:checked').value;
    if (!input.value.trim()) return;
    currentNotes.push({ id: Date.now(), content: input.value, tag: tagInput.value.trim() || "Général", color: color, created: new Date().toLocaleString() });
    persistData(); input.value = ''; tagInput.value = ''; loadNotes();
}

function loadNotes(filter = "") {
    const container = document.getElementById('notesContainer');
    const filtered = currentNotes.filter(n => n.content.toLowerCase().includes(filter.toLowerCase()) || n.tag.toLowerCase().includes(filter.toLowerCase()));
    
    container.innerHTML = filtered.slice().reverse().map(note => `
        <div class="card mb-3 shadow-sm note-card" style="border-left-color: ${note.color || '#2c3e50'} !important;">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="w-100">
                        <div class="d-flex align-items-center mb-2 gap-2">
                            <span class="badge bg-light text-muted fw-normal tag-edit" contenteditable="true" onblur="updateTag(${note.id}, this.innerText)">
                                <i data-lucide="tag" style="width:10px; height:10px; margin-right:4px;"></i>${note.tag}
                            </span>
                            <div class="d-flex gap-1 ms-auto opacity-hover">
                                <div onclick="changeColor(${note.id},'#2c3e50')" class="dot-color" style="background:#2c3e50;"></div>
                                <div onclick="changeColor(${note.id},'#e74c3c')" class="dot-color" style="background:#e74c3c;"></div>
                                <div onclick="changeColor(${note.id},'#27ae60')" class="dot-color" style="background:#27ae60;"></div>
                                <div onclick="changeColor(${note.id},'#f1c40f')" class="dot-color" style="background:#f1c40f;"></div>
                                <div onclick="changeColor(${note.id},'#3498db')" class="dot-color" style="background:#3498db;"></div>
                            </div>
                        </div>
                        <div class="note-text" contenteditable="true" onblur="updateNote(${note.id}, this.innerText)">${note.content}</div>
                    </div>
                    <button class="btn btn-link text-danger p-0 ms-2 opacity-25" onclick="deleteNote(${note.id})"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="text-muted small mt-3 pt-2 border-top"><i data-lucide="calendar" style="width:12px;"></i> ${note.created}</div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function updateTag(id, val) {
    const n = currentNotes.find(x => x.id === id);
    if(n) { n.tag = val.trim() || "Général"; await persistData(); loadNotes(document.getElementById('searchInput').value); }
}

async function changeColor(id, col) {
    const n = currentNotes.find(x => x.id === id);
    if(n) { n.color = col; await persistData(); loadNotes(document.getElementById('searchInput').value); }
}

async function updateNote(id, txt) {
    const n = currentNotes.find(x => x.id === id);
    if(n && n.content !== txt) { n.content = txt; await persistData(); }
}

async function deleteNote(id) {
    const msg = currentLang === 'fr' ? "Supprimer ?" : "Delete ?";
    if(confirm(msg)) { currentNotes = currentNotes.filter(x => x.id !== id); await persistData(); loadNotes(); }
}

function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

function manualExport() {
    const dataToExport = currentNotes.map(n => ({ "ID": n.id, "Tag": n.tag, "Couleur": n.color, "Contenu": n.content, "Creation": n.created }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, "MyNotes_Export.xlsx");
}

function importExcel(e) {
    const reader = new FileReader();
    reader.onload = function(evt) {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, {type:'array'});
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        json.forEach(row => {
            // Évite les doublons exacts si en mode local
            if (!currentNotes.some(n => n.content === row.Contenu)) {
                currentNotes.push({ 
                    id: row.ID || Date.now() + Math.random(), 
                    tag: row.Tag || "Import", 
                    color: row.Couleur || "#2c3e50", 
                    content: row.Contenu || "", 
                    created: row.Creation || new Date().toLocaleString() 
                });
            }
        });
        persistData(); loadNotes();
        alert(currentLang === 'fr' ? "Import réussi !" : "Import Successful!");
    };
    reader.readAsArrayBuffer(e.target.files[0]);
}

function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

async function updatePassword() {
    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;
    const currentHash = localStorage.getItem('app_password_hash');
    if (await hashPassword(oldP) !== currentHash) return alert("Error");
    localStorage.setItem('app_password_hash', await hashPassword(newP));
    alert("Success"); toggleSettings();
}

function resetApp() { if(confirm("Reset?")) { localStorage.clear(); location.reload(); } }

window.onload = () => {
    lucide.createIcons();
    if (!localStorage.getItem('app_password_hash')) {
        document.getElementById('lockTitle').innerText = "Welcome";
        document.getElementById('lockDesc').innerText = "Set your master password.";
    }
};
