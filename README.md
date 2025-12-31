Here is the updated **Markdown** documentation for your application, translated into English and reflecting all the new features (JSON support, character counter, and direct file linking).

---

# 📓 Secure Vault Notes (v3.0)

A lightweight, privacy-first web application for managing personal notes. This version operates entirely offline, ensuring **total data ownership** with no third-party server involvement.

## 🚀 Key Features

* **🔒 Locked Vault**: Access protected by a Master Password using industry-standard **SHA-256 hashing**.
* **💾 Hybrid Storage**:
* **Browser Memory**: Uses LocalStorage for quick, file-free access.
* **Direct File Link**: The app writes directly to a `.json` or `.xlsx` file on your computer using the File System Access API.


* **📂 Multi-format Management**: Real-time sync, import, and export supporting both **JSON** (recommended for speed) and **Excel**.
* **✍️ Optimized Writing**:
* **Real-time Character Counter**: Monitor your note length as you type.
* **Tagging System**: Organize notes with clickable, editable tags.
* **Color Coding**: 5 distinct colors (including Yellow) to categorize your thoughts.


* **🌍 Bilingual Interface**: Toggle instantly between **English** and **French**.

---

## 🛠️ Installation & Getting Started

1. **Setup**: Save the three core files (`index.html`, `style.css`, `script.js`) into a single folder.
2. **Launch**: Open `index.html` in any modern web browser (Chrome, Edge, or Brave are recommended for the "Direct File Link" feature).
3. **Initialization**: Set your master password on the first run, then select your preferred data destination.

---

## 💡 Storage Modes Explained

| Mode | Description | Key Advantage |
| --- | --- | --- |
| **Browser Memory** | Data is stored within your browser's internal cache. | No files to manage; instant access. |
| **Link JSON File** | The app acts as an editor for a specific `.json` file on your drive. | **Maximum Portability**. Your notes are human-readable in any text editor. |
| **Link Excel File** | Data is synchronized with an Excel spreadsheet. | Perfect for office archiving and advanced data sorting. |

---

## ⌨️ Shortcuts & Tips

* **Edit on the fly**: Click directly on the text of an existing note to edit it. Saving is automatic when you click away (on blur).
* **Rename Tags**: Click on a note's tag badge to rename it instantly across that specific note.
* **Smart Search**: The search bar filters through both note content and tags simultaneously.
* **Char Count**: Located right below the text area to help you track the length of your entries.

---

## 📋 Data Structure (JSON)

When using the JSON mode, your data is organized as follows:

```json
[
  {
    "id": 1704021000000,
    "content": "This is an example note.",
    "tag": "Work",
    "color": "#f1c40f",
    "created": "01/01/2025 12:00:00"
  }
]

```

---

## 🔒 Security & Privacy

* **Zero Servers**: Your data never leaves your machine. No cloud, no leaks.
* **Privacy First**: No registration, no accounts, and no tracking scripts.
* **Hard Reset**: A "Reset All" function in the Security panel allows you to wipe all local data and settings instantly.

---

**Developed by Your Name - 2025**

---

Would you like me to help you create a **Desktop Shortcut** (icon) so you can launch this app just like a professional software?
