let currentNotes = [];
let storageMode = "local"; 
let fileHandle = null;
let currentLang = localStorage.getItem('app_lang') || 'fr';

const translations = {
    fr: {
        lock_title: "Coffre-fort", lock_desc: "Authentification requise.", unlock_btn: "Déverrouiller",
        source_title: "DESTINATION DES DONNÉES", source_local: "Mémoire Navigateur", source_file: "Lier un fichier JSON/Excel",
        nav_security: "Sécurité", nav_quit: "Quitter", search_placeholder: "Rechercher une note ou un tag...",
        input_note: "Votre note ici...", input_tag: "Tag", btn_add: "Ajouter", char_label: "caractères",
        footer_owner: "Propriétaire & Développeur", sec_title: "Sécurité", sec_old: "Ancien MDP", sec_new: "Nouveau MDP", sec_reset: "Tout effacer",
        badge_local: "Mémoire Navigateur", badge_file: "Fichier Direct"
    },
    en: {
        lock_title: "Safe Vault", lock_desc: "Authentication required.", unlock_btn: "Unlock",
        source_title: "DATA DESTINATION", source_local: "Browser Memory", source_file: "Link JSON/Excel File",
        nav_security: "Security", nav_quit: "Quit", search_placeholder: "Search notes or tags...",
        input_note: "Your note here...", input_tag: "Tag", btn_add: "Add", char_label: "characters",
        footer_owner: "Owner & Developer", sec_title: "Security Settings", sec_old: "Old Password", sec_new: "New Password", sec_reset: "Reset All",
        badge_local: "Browser Storage", badge_file: "Linked File"
    }
};

function updateInterfaceLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) el.innerText = translations[currentLang][key];
    });
    document.getElementById('searchInput').placeholder = translations[currentLang].search_placeholder;
    document.getElementById('noteInput').placeholder = translations[currentLang].input_note;
    document.getElementById('tagInput').placeholder = translations[currentLang].input_tag;
    document.getElementById('oldPass').placeholder = translations[currentLang].sec_old;
    document.getElementById('newPass').placeholder = translations[currentLang].sec_new;
    document.getElementById('langBtnText').innerText = currentLang === 'fr' ? 'EN' : 'FR';

    const badge = document.getElementById('modeBadge');
    if(badge) {
        let icon = storageMode === "local" ? "database" : (fileHandle?.name.endsWith('.json') ? "file-json" : "file-spreadsheet");
        let txt = storageMode === "local" ? translations[currentLang].badge_local : translations[currentLang].badge_file;
        badge.innerHTML = `<i data-lucide="${icon}" class="btn-icon"></i> ${txt}`;
        lucide.createIcons();
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('app_lang', currentLang);
    updateInterfaceLanguage();
}

// --- COMPTEUR ---
function updateCharCount() {
    const text = document.getElementById('noteInput').value;
    document.getElementById('charCount').innerText = text.length;
}

// --- SECURITÉ ---
async function hashPassword(p) {
    const m = new TextEncoder().encode(p);
    const h = await crypto.subtle.digest('SHA-256', m);
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const i = document.getElementById('passwordInput');
    const h = await hashPassword(i.value);
    const stored = localStorage.getItem('app_password_hash');
    if (!stored) { localStorage.setItem('app_password_hash', h); unlockAuth(); }
    else if (h === stored) { unlockAuth(); }
    else { alert("Invalide"); }
}

function unlockAuth() {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('sourceSelector').classList.remove('hidden');
    lucide.createIcons();
}

// --- PERSISTANCE ---
async function persistData() {
    if (storageMode === "local") {
        localStorage.setItem('notes', JSON.stringify(currentNotes));
    } else if (storageMode === "file" && fileHandle) {
        let content;
        if (fileHandle.name.endsWith('.json')) {
            content = JSON.stringify(currentNotes, null, 2);
        } else {
            const ws = XLSX.utils.json_to_sheet(currentNotes);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Notes");
            content = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        }
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }
}

function useStorage() {
    storageMode = "local";
    currentNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    launchApp();
}

async function useFileDirect() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [
                { description: 'JSON', accept: {'application/json': ['.json']} },
                { description: 'Excel', accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']} }
            ]
        });
        const file = await fileHandle.getFile();
        if (file.name.endsWith('.json')) {
            currentNotes = JSON.parse(await file.text() || '[]');
        } else {
            const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
            currentNotes = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        }
        storageMode = "file";
        launchApp();
    } catch (e) {}
}

function launchApp() {
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    updateInterfaceLanguage();
    loadNotes();
}

// --- CRUD ---
function addNote() {
    const i = document.getElementById('noteInput');
    const t = document.getElementById('tagInput');
    const c = document.querySelector('input[name="colorOpt"]:checked').value;
    if (!i.value.trim()) return;
    currentNotes.push({ id: Date.now(), content: i.value, tag: t.value.trim() || "Général", color: c, created: new Date().toLocaleString() });
    persistData(); 
    i.value = ''; t.value = ''; 
    document.getElementById('charCount').innerText = "0";
    loadNotes();
}

function loadNotes(f = "") {
    const c = document.getElementById('notesContainer');
    const filtered = currentNotes.filter(n => (n.content||"").toLowerCase().includes(f.toLowerCase()) || (n.tag||"").toLowerCase().includes(f.toLowerCase()));
    c.innerHTML = filtered.slice().reverse().map(n => `
        <div class="card mb-3 shadow-sm note-card" style="border-left-color: ${n.color || '#2c3e50'} !important;">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <div class="w-100">
                        <div class="d-flex align-items-center mb-2 gap-2">
                            <span class="badge bg-light text-muted tag-edit" contenteditable="true" onblur="updateTag(${n.id}, this.innerText)">
                                <i data-lucide="tag" style="width:10px;"></i>${n.tag}
                            </span>
                            <div class="d-flex gap-1 ms-auto opacity-hover">
                                <div onclick="changeColor(${n.id},'#2c3e50')" class="dot-color" style="background:#2c3e50;"></div>
                                <div onclick="changeColor(${n.id},'#e74c3c')" class="dot-color" style="background:#e74c3c;"></div>
                                <div onclick="changeColor(${n.id},'#27ae60')" class="dot-color" style="background:#27ae60;"></div>
                                <div onclick="changeColor(${n.id},'#f1c40f')" class="dot-color" style="background:#f1c40f;"></div>
                                <div onclick="changeColor(${n.id},'#3498db')" class="dot-color" style="background:#3498db;"></div>
                            </div>
                        </div>
                        <div class="note-text" contenteditable="true" onblur="updateNote(${n.id}, this.innerText)">${n.content}</div>
                    </div>
                    <button class="btn btn-link text-danger p-0 ms-2 opacity-25" onclick="deleteNote(${n.id})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function updateTag(id, v) { const n = currentNotes.find(x => x.id === id); if(n) { n.tag = v.trim(); await persistData(); loadNotes(document.getElementById('searchInput').value); } }
async function changeColor(id, c) { const n = currentNotes.find(x => x.id === id); if(n) { n.color = c; await persistData(); loadNotes(document.getElementById('searchInput').value); } }
async function updateNote(id, t) { const n = currentNotes.find(x => x.id === id); if(n && n.content !== t) { n.content = t; await persistData(); } }
async function deleteNote(id) { if(confirm("Supprimer ?")) { currentNotes = currentNotes.filter(x => x.id !== id); await persistData(); loadNotes(); } }
function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

// --- I/O ---
function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentNotes, null, 2));
    const a = document.createElement('a'); a.href = dataStr; a.download = "notes.json"; a.click();
}

function manualExport() {
    const ws = XLSX.utils.json_to_sheet(currentNotes);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, "notes.xlsx");
}

function importFile(e) {
    const f = e.target.files[0];
    const r = new FileReader();
    r.onload = function(evt) {
        let imp = [];
        if (f.name.endsWith('.json')) imp = JSON.parse(evt.target.result);
        else imp = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(evt.target.result), {type:'array'}).Sheets[XLSX.read(new Uint8Array(evt.target.result), {type:'array'}).SheetNames[0]]);
        imp.forEach(note => {
            if (!currentNotes.some(n => n.content === (note.content || note.Contenu))) {
                currentNotes.push({ id: note.id || Date.now(), tag: note.tag || note.Tag || "Import", color: note.color || note.Couleur || "#2c3e50", content: note.content || note.Contenu, created: note.created || note.Creation || new Date().toLocaleString() });
            }
        });
        persistData(); loadNotes();
    };
    if (f.name.endsWith('.json')) r.readAsText(f);
    else r.readAsArrayBuffer(f);
}

function toggleSettings() { const p = document.getElementById('settingsPanel'); p.style.display = (p.style.display === 'block') ? 'none' : 'block'; }
async function updatePassword() {
    const o = document.getElementById('oldPass').value; const n = document.getElementById('newPass').value;
    if (await hashPassword(o) !== localStorage.getItem('app_password_hash')) return alert("Erreur");
    localStorage.setItem('app_password_hash', await hashPassword(n)); alert("Succès");
}
function resetApp() { if(confirm("Reset?")) { localStorage.clear(); location.reload(); } }

window.onload = () => {
    lucide.createIcons();
    if (!localStorage.getItem('app_password_hash')) {
        document.getElementById('lockTitle').innerText = "Bienvenue";
        document.getElementById('lockDesc').innerText = "Définissez votre mot de passe maître.";
    }
};
