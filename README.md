🛡️ Secure NoteVault Pro
Owner & Developer: Yohann Zaoui

Version: 2.0 (Bilingual & Hybrid Edition)

📝 Overview
This application is a hybrid secure note manager designed to provide total privacy. It allows users to capture, organize, and secure information without ever relying on a third-party server or cloud provider. The user has absolute control over where their data is stored (Browser memory or physical Local File).

🚀 Key Features
🔐 Security & Privacy
Master Access: Mandatory password lock screen upon startup.

Crypto Hashing: Uses the SHA-256 algorithm for password hashing (no plain-text passwords are ever stored).

Zero Server Policy: 100% of data processing is done client-side (Edge Computing), ensuring your data never leaves your machine.

💾 Hybrid Storage Flexibility
Local Mode: Automatically saves data to the browser's LocalStorage for quick and easy access.

Direct Excel Mode: Establishes a live link with a .xlsx file on your hard drive. Every change made in the app is synced in real-time to the physical file using the File System Access API.

🎨 Note Organization
In-Place Editing: Instantly modify text, tags, and colors directly on the note card without complex menus.

Dynamic Tagging: Categorize notes with clickable and renameable badges.

Color Coding: 5 visual themes to prioritize tasks (Urgent, Reminder, Work, etc.).

Smart Search: Instant filtering by keywords or specific tags.

🌍 Advanced Tools
Bilingual Interface: Toggle the entire UI between French and English with one click.

Import/Export: Bulk inject or extract data using Microsoft Excel files.

Ownership Branding: Official developer identification integrated into the UI and metadata.

🛠️ Technical Stack
Languages: HTML5, CSS3 (Bootstrap / Flatly), JavaScript (ES6+).

Libraries: * SheetJS (XLSX.js): For Excel file manipulation.

Lucide Icons: For a clean, vector-based visual experience.

Web Crypto API: For secure password hashing.

📦 Setup & Usage
Save the three files (index.html, style.css, script.js) in the same folder.

Open index.html in a modern browser (Chrome, Edge, or Opera recommended for full File System support).

Set your master password during the first launch.
