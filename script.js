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
}

// --- GESTION DES SOURCES ---
function useStorage(mode) {
    storageMode = "local";
    currentNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    document.getElementById('modeBadge').innerText = "🌐 Mémoire Navigateur (Auto-save)";
    
    // En mode Local : On garde EXPORT et on montre IMPORT
    document.getElementById('exportBtn').classList.remove('hidden');
    document.getElementById('importBtn').classList.remove('hidden');
    
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
            id: n.ID || Date.now() + Math.random(),
            content: String(n.Contenu || ""),
            created: n.Creation || new Date().toLocaleString()
        }));
        
        storageMode = "file";
        document.getElementById('modeBadge').innerText = "📂 Fichier Excel (Auto-save)";
        document.getElementById('modeBadge').classList.replace('bg-secondary', 'bg-success');
        
        // En mode Fichier : On SUPPRIME le bouton Export et Import
        document.getElementById('exportBtn').classList.add('hidden');
        document.getElementById('importBtn').classList.add('hidden');
        
        launchApp();
    } catch (err) { alert("Erreur d'accès au fichier."); }
}

function launchApp() {
    document.getElementById('lockScreen').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    loadNotes();
}

// --- IMPORT & DOUBLONS (Mode Local Seulement) ---
function importToLocalStorage(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        
        let newCount = 0;
        let dupCount = 0;

        json.forEach(row => {
            const content = String(row.Contenu || "").trim();
            const isDuplicate = currentNotes.some(note => note.content.trim() === content);
            
            if (!isDuplicate && content !== "") {
                currentNotes.push({
                    id: row.ID || Date.now() + Math.random(),
                    content: content,
                    created: row.Creation || new Date().toLocaleString()
                });
                newCount++;
            } else if (isDuplicate) {
                dupCount++;
            }
        });

        localStorage.setItem('notes', JSON.stringify(currentNotes));
        loadNotes();
        alert(`${newCount} notes importées. ${dupCount} doublons ignorés.`);
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
}

// --- PERSISTANCE ---
async function persistData() {
    if (storageMode === "local") {
        localStorage.setItem('notes', JSON.stringify(currentNotes));
    } else if (storageMode === "file" && fileHandle) {
        try {
            const data = currentNotes.map(n => ({ "ID": n.id, "Contenu": n.content, "Creation": n.created }));
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

// --- ACTIONS NOTES ---
function addNote() {
    const input = document.getElementById('noteInput');
    if (!input.value.trim()) return;
    currentNotes.push({ id: Date.now(), content: input.value, created: new Date().toLocaleString() });
    persistData();
    input.value = '';
    loadNotes();
}

function loadNotes(filter = "") {
    const container = document.getElementById('notesContainer');
    const filtered = currentNotes.filter(n => n.content.toLowerCase().includes(filter.toLowerCase()));
    container.innerHTML = filtered.slice().reverse().map(note => `
        <div class="card mb-3 shadow-sm note-card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="w-100 note-text" contenteditable="true" onblur="updateNote(${note.id}, this.innerText)">${note.content}</div>
                    <button class="btn btn-sm text-danger" onclick="deleteNote(${note.id})">&times;</button>
                </div>
                <div class="text-muted small mt-2 border-top pt-1">📅 ${note.created}</div>
            </div>
        </div>
    `).join('');
}

async function updateNote(id, text) {
    const idx = currentNotes.findIndex(n => n.id === id);
    if (idx !== -1 && currentNotes[idx].content !== text) {
        currentNotes[idx].content = text;
        await persistData();
    }
}

async function deleteNote(id) {
    if (confirm("Supprimer cette note ?")) {
        currentNotes = currentNotes.filter(n => n.id !== id);
        await persistData();
        loadNotes();
    }
}

function filterNotes() { loadNotes(document.getElementById('searchInput').value); }

function manualExport() {
    const data = currentNotes.map(n => ({ "ID": n.id, "Contenu": n.content, "Creation": n.created }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, "Notes_Export.xlsx");
}

function toggleSettings() {
    const p = document.getElementById('settingsPanel');
    p.style.display = (p.style.display === 'block') ? 'none' : 'block';
}

async function updatePassword() {
    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;
    const hash = localStorage.getItem('app_password_hash');
    if (await hashPassword(oldP) !== hash) return alert("Ancien MDP incorrect");
    localStorage.setItem('app_password_hash', await hashPassword(newP));
    alert("MDP modifié");
    toggleSettings();
}

function resetApp() {
    if (confirm("Tout effacer ?")) { localStorage.clear(); location.reload(); }
}

window.onload = () => {
    if (!localStorage.getItem('app_password_hash')) {
        document.getElementById('lockTitle').innerText = "Initialisation";
        document.getElementById('lockDesc').innerText = "Créez votre mot de passe.";
    }
};