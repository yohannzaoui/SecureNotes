let currentNotes = [];
let storageMode = "local"; 
let fileHandle = null;

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
    } else {
        alert("Mot de passe incorrect.");
    }
}

function unlockAuth() {
    document.getElementById('authActions').classList.add('hidden');
    document.getElementById('sourceSelector').classList.remove('hidden');
    lucide.createIcons();
}

// --- GESTION DES SOURCES ---
function useStorage(mode) {
    storageMode = "local";
    currentNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    document.getElementById('modeBadge').innerHTML = `<i data-lucide="database" class="btn-icon"></i> Mémoire Navigateur`;
    launchApp();
}

async function useFileDirect() {
    try {
        [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'Excel', accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']} }],
            multiple: false
        });
        const file = await fileHandle.getFile();
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        currentNotes = XLSX.utils.sheet_to_json(sheet).map(n => ({
            id: n.ID || Date.now(),
            content: String(n.Contenu || ""),
            tag: String(n.Tag || "Général"),
            color: String(n.Couleur || "#2c3e50"),
            created: n.Creation || new Date().toLocaleString()
        }));
        storageMode = "file";
        const badge = document.getElementById('modeBadge');
        badge.innerHTML = `<i data-lucide="file-check" class="btn-icon"></i> Fichier Excel Direct`;
        badge.classList.replace('bg-secondary', 'bg-success');
        document.getElementById('exportBtn').classList.add('hidden');
        document.getElementById('importBtn').classList.add('hidden');
        launchApp();
    } catch (err) { if(err.name !== 'AbortError') alert("Erreur d'accès."); }
}

function launchApp() {
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    loadNotes();
}

// --- PERSISTANCE ---
async function persistData() {
    if (storageMode === "local") {
        localStorage.setItem('notes', JSON.stringify(currentNotes));
    } else if (storageMode === "file" && fileHandle) {
        try {
            const data = currentNotes.map(n => ({ "ID": n.id, "Tag": n.tag, "Couleur": n.color, "Contenu": n.content, "Creation": n.created }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Notes");
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const writable = await fileHandle.createWritable();
            await writable.write(excelBuffer);
            await writable.close();
        } catch (e) { console.error("Sauvegarde échouée", e); }
    }
}

// --- ACTIONS ---
function addNote() {
    const input = document.getElementById('noteInput');
    const tagInput = document.getElementById('tagInput');
    const color = document.querySelector('input[name="colorOpt"]:checked').value;
    if (!input.value.trim()) return;
    currentNotes.push({ id: Date.now(), content: input.value, tag: tagInput.value.trim() || "Général", color: color, created: new Date().toLocaleString() });
    persistData();
    input.value = ''; tagInput.value = '';
    loadNotes();
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
                                <div onclick="changeNoteColor(${note.id}, '#2c3e50')" class="dot-color" style="background:#2c3e50;"></div>
                                <div onclick="changeNoteColor(${note.id}, '#e74c3c')" class="dot-color" style="background:#e74c3c;"></div>
                                <div onclick="changeNoteColor(${note.id}, '#27ae60')" class="dot-color" style="background:#27ae60;"></div>
                                <div onclick="changeNoteColor(${note.id}, '#f1c40f')" class="dot-color" style="background:#f1c40f;"></div>
                                <div onclick="changeNoteColor(${note.id}, '#3498db')" class="dot-color" style="background:#3498db;"></div>
                            </div>
                        </div>
                        <div class="note-text" contenteditable="true" onblur="updateNote(${note.id}, this.innerText)">${note.content}</div>
                    </div>
                    <button class="btn btn-link text-danger p-0 ms-2 opacity-25" onclick="deleteNote(${note.id})"><i data-lucide="trash-2"></i></button>
                </div>
                <div class="text-muted small mt-3 pt-2 border-top d-flex align-items-center">
                    <i data-lucide="calendar" style="width:12px; height:12px; margin-right:5px;"></i> ${note.created}
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

async function updateTag(id, newTag) {
    const idx = currentNotes.findIndex(n => n.id === id);
    const cleanTag = newTag.replace(/[\n\r]/g, "").trim();
    if (idx !== -1 && currentNotes[idx].tag !== cleanTag) {
        currentNotes[idx].tag = cleanTag || "Général";
        await persistData();
        loadNotes(document.getElementById('searchInput').value);
    }
}

async function changeNoteColor(id, newColor) {
    const idx = currentNotes.findIndex(n => n.id === id);
    if (idx !== -1) {
        currentNotes[idx].color = newColor;
        await persistData();
        loadNotes(document.getElementById('searchInput').value);
    }
}

async function updateNote(id, text) {
    const idx = currentNotes.findIndex(n => n.id === id);
    if (idx !== -1 && currentNotes[idx].content !== text) {
        currentNotes[idx].content = text;
        await persistData();
    }
}

async function deleteNote(id) {
    if (confirm("Supprimer ?")) { currentNotes = currentNotes.filter(n => n.id !== id); await persistData(); loadNotes(); }
}

function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

function manualExport() {
    const data = currentNotes.map(n => ({ "ID": n.id, "Tag": n.tag, "Couleur": n.color, "Contenu": n.content, "Creation": n.created }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, "Notes_Export.xlsx");
}

function importToLocalStorage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type:'array'});
        XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]).forEach(row => {
            if (!currentNotes.some(n => n.content === row.Contenu)) {
                currentNotes.push({ id: row.ID || Date.now(), tag: row.Tag || "Import", color: row.Couleur || "#2c3e50", content: row.Contenu, created: row.Creation || new Date().toLocaleString() });
            }
        });
        persistData(); loadNotes(); alert("Import réussi !");
    };
    reader.readAsArrayBuffer(file);
}

function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
    lucide.createIcons();
}

async function updatePassword() {
    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;
    if (await hashPassword(oldP) !== localStorage.getItem('app_password_hash')) return alert("Ancien MDP incorrect");
    localStorage.setItem('app_password_hash', await hashPassword(newP));
    alert("Modifié !"); toggleSettings();
}

function resetApp() { if (confirm("Tout supprimer ?")) { localStorage.clear(); location.reload(); } }

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active.id === 'passwordInput') checkPassword();
        if (active.id === 'noteInput' && !e.shiftKey) { e.preventDefault(); addNote(); }
    }
});

window.onload = () => {
    lucide.createIcons();
    if (!localStorage.getItem('app_password_hash')) {
        document.getElementById('lockTitle').innerText = "Bienvenue";
        document.getElementById('lockDesc').innerText = "Créez votre mot de passe maître.";
    }
};
