
---

# 📓 Secure Notes Pro (v4.0)

A modern, private, and ultra-flexible web application for managing your notes. This version is designed to provide a smooth user experience similar to native apps, while ensuring 100% local privacy.

## 🚀 New Features (v4.0)

* **🖱️ Smart Drag & Drop**: Intuitively reorganize your notes. Click and hold a note to move it up or down the list. Your custom order is saved automatically.
* **📏 Dynamic Input Field**: The text area expands automatically as you type. No more scrolling inside a tiny box.
* **⏱️ Precision Timestamps**: Every note now displays its creation date and time at the bottom of the card.
* **🔢 Real-time Character Counter**: A live indicator keeps you informed of your note's length while drafting.
* **🔐 Advanced Security**: Local SHA-256 hashing and automatic locking upon closing the tab.

---

## 💡 Storage Modes

| Mode | Best For |
| --- | --- |
| **Browser Memory** | Quick daily use on a single device. |
| **JSON File** | **Recommended.** Best for portability and syncing via cloud services (Dropbox/Drive). |
| **Excel File** | Ideal for professional archiving and data processing. |

---

## 🛠️ User Guide

### Reorganizing Notes

To change the order, hover over a note (the cursor will change to a hand ✋), click and hold, then drag it over another note. Your custom sorting is preserved even after refreshing the page or exporting data.

### Quick Editing

* **Text**: Click directly on the body of a note to edit its content.
* **Tags**: Click on the tag badge at the top of the note to rename the category on the fly.
* **Colors**: Use the discreet color palette in the top-right corner of each note to change its visual category instantly.

---

## 📂 Technical Structure

The application is built on a clean three-file architecture:

1. **`index.html`**: Interface structure (Bootstrap + Lucide Icons).
2. **`style.css`**: Modern design, drag-and-drop animations, and dynamic field styling.
3. **`script.js`**: Business logic, sorting algorithms, encryption, and File System Access API integration.

---

## 📋 JSON Specifications

If you choose to manually edit your backup file, please follow this structure:

```json
[
  {
    "id": 1735651200000,
    "content": "Example of a dynamic note",
    "tag": "Project",
    "color": "#3498db",
    "created": "12/31/2025 12:00:00"
  }
]

```

---

## 🔒 Privacy & Trust

This application has **zero internet access**. Your passwords and notes never pass through any server. It is a "Zero-Knowledge" tool: you are the sole owner of your data.

---

**Developed by Yohann Zaoui - 2025**

---

