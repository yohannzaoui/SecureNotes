let currentNotes = [];
let storageMode = "local"; 
let fileHandle = null;
let currentLang = localStorage.getItem('app_lang') || 'fr';
let draggedItemId = null;

const translations = {
    fr: {
        lock_title: "Coffre-fort", lock_desc: "Authentification requise.", unlock_btn: "Déverrouiller",
        source_title: "DESTINATION DES DONNÉES", source_local: "Mémoire Navigateur", source_file: "Lier un fichier JSON/Excel",
        nav_security: "Sécurité", nav_quit: "Quitter", search_placeholder: "Rechercher...",
        input_note: "Votre note ici...", input_tag: "Tag", btn_add: "Ajouter", char_label: "caractères",
        sec_title: "Sécurité", sec_old: "Ancien MDP", sec_new: "Nouveau MDP", sec_reset: "Tout effacer",
        badge_local: "Mémoire Navigateur", badge_file: "Fichier Direct"
    },
    en: {
        lock_title: "Safe Vault", lock_desc: "Authentication required.", unlock_btn: "Unlock",
        source_title: "DATA DESTINATION", source_local: "Browser Memory", source_file: "Link JSON/Excel File",
        nav_security: "Security", nav_quit: "Quit", search_placeholder: "Search...",
        input_note: "Your note here...", input_tag: "Tag", btn_add: "Add", char_label: "characters",
        sec_title: "Security Settings", sec_old: "Old Password", sec_new: "New Password", sec_reset: "Reset All",
        badge_local: "Browser Storage", badge_file: "Linked File"
    }
};

// --- UI DYNAMIQUE ---
function handleInput(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
    document.getElementById('charCount').innerText = el.value.length;
}

// --- DRAG & DROP ---
function dragStart(e, id) { draggedItemId = id; e.target.classList.add('dragging'); }
function dragEnd(e) { e.target.classList.remove('dragging'); }
function dragOver(e) { e.preventDefault(); }
async function drop(e, targetId) {
    e.preventDefault();
    if (draggedItemId === targetId) return;
    const fromIdx = currentNotes.findIndex(n => n.id === draggedItemId);
    const toIdx = currentNotes.findIndex(n => n.id === targetId);
    const [item] = currentNotes.splice(fromIdx, 1);
    currentNotes.splice(toIdx, 0, item);
    await persistData();
    loadNotes(document.getElementById('searchInput').value);
}

// --- AUTH & LANG ---
async function hashPassword(p) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword() {
    const h = await hashPassword(document.getElementById('passwordInput').value);
    const stored = localStorage.getItem('app_password_hash');
    if (!stored) { localStorage.setItem('app_password_hash', h); unlockAuth(); }
    else if (h === stored) unlockAuth();
    else alert("Invalide");
}

function unlockAuth() {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('sourceSelector').classList.remove('hidden');
    lucide.createIcons();
}

function updateInterfaceLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerText = translations[currentLang][key] || el.innerText;
    });
    document.getElementById('searchInput').placeholder = translations[currentLang].search_placeholder;
    document.getElementById('noteInput').placeholder = translations[currentLang].input_note;
    document.getElementById('tagInput').placeholder = translations[currentLang].input_tag;
    document.getElementById('langBtnText').innerText = currentLang === 'fr' ? 'EN' : 'FR';
    
    const badge = document.getElementById('modeBadge');
    if(badge) {
        let txt = storageMode === "local" ? translations[currentLang].badge_local : translations[currentLang].badge_file;
        badge.innerHTML = `<i data-lucide="database" class="btn-icon"></i> ${txt}`;
        lucide.createIcons();
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('app_lang', currentLang);
    updateInterfaceLanguage();
}

// --- DATA ---
async function persistData() {
    if (storageMode === "local") localStorage.setItem('notes', JSON.stringify(currentNotes));
    else if (fileHandle) {
        let data = fileHandle.name.endsWith('.json') ? JSON.stringify(currentNotes, null, 2) : XLSX.write(XLSX.utils.book_append_sheet(XLSX.utils.book_new(), XLSX.utils.json_to_sheet(currentNotes), "Notes"), {bookType:'xlsx', type:'array'});
        const w = await fileHandle.createWritable(); await w.write(data); await w.close();
    }
}

function useStorage() { storageMode = "local"; currentNotes = JSON.parse(localStorage.getItem('notes') || '[]'); launchApp(); }
async function useFileDirect() {
    try {
        [fileHandle] = await window.showOpenFilePicker();
        const f = await fileHandle.getFile();
        currentNotes = f.name.endsWith('.json') ? JSON.parse(await f.text() || '[]') : XLSX.utils.sheet_to_json(XLSX.read(await f.arrayBuffer(), {type:'array'}).Sheets["Notes"]);
        storageMode = "file"; launchApp();
    } catch(e) {}
}

function launchApp() { document.getElementById('lockScreen').classList.add('hidden'); document.getElementById('mainContent').classList.remove('hidden'); updateInterfaceLanguage(); loadNotes(); }

// --- CRUD ---
function addNote() {
    const i = document.getElementById('noteInput');
    if (!i.value.trim()) return;
    currentNotes.unshift({ id: Date.now(), content: i.value, tag: document.getElementById('tagInput').value || "Général", color: document.querySelector('input[name="colorOpt"]:checked').value, created: new Date().toLocaleString() });
    persistData(); i.value = ''; i.style.height = 'auto'; document.getElementById('charCount').innerText = "0"; loadNotes();
}

function loadNotes(f = "") {
    const c = document.getElementById('notesContainer');
    c.innerHTML = currentNotes.filter(n => n.content.toLowerCase().includes(f.toLowerCase()) || n.tag.toLowerCase().includes(f.toLowerCase())).map(n => `
        <div class="card mb-3 shadow-sm note-card" draggable="true" ondragstart="dragStart(event, ${n.id})" ondragend="dragEnd(event)" ondragover="dragOver(event)" ondrop="drop(event, ${n.id})" style="border-left-color: ${n.color} !important;">
            <div class="card-body">
                <div class="d-flex align-items-center mb-2 gap-2">
                    <span class="badge bg-light text-muted tag-edit" contenteditable="true" onblur="updateTag(${n.id}, this.innerText)">${n.tag}</span>
                    <div class="d-flex gap-1 ms-auto opacity-hover">
                        ${['#2c3e50','#e74c3c','#27ae60','#f1c40f','#3498db'].map(col => `<div onclick="changeColor(${n.id},'${col}')" class="dot-color" style="background:${col}"></div>`).join('')}
                    </div>
                </div>
                <div class="note-text" contenteditable="true" onblur="updateNote(${n.id}, this.innerText)">${n.content}</div>
                <div class="d-flex justify-content-between align-items-center mt-3">
                    <small class="text-muted" style="font-size: 0.7rem;"><i data-lucide="calendar" style="width:10px;"></i> ${n.created}</small>
                    <button class="btn btn-link text-danger p-0 opacity-25" onclick="deleteNote(${n.id})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function updateTag(id, v) { currentNotes.find(x => x.id === id).tag = v; await persistData(); }
async function changeColor(id, c) { currentNotes.find(x => x.id === id).color = c; await persistData(); loadNotes(); }
async function updateNote(id, t) { currentNotes.find(x => x.id === id).content = t; await persistData(); }
async function deleteNote(id) { if(confirm("Supprimer ?")) { currentNotes = currentNotes.filter(x => x.id !== id); await persistData(); loadNotes(); } }
function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

function toggleSettings() { const s = document.getElementById('settingsPanel'); s.style.display = s.style.display === 'block' ? 'none' : 'block'; }
function resetApp() { if(confirm("Reset ?")) { localStorage.clear(); location.reload(); } }
window.onload = () => lucide.createIcons();
