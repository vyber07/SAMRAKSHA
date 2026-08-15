# SAMRAKSHA User Guide: From Beginner to Expert

Welcome to the **SAMRAKSHA Police Command & Control System**. This guide is designed to take you from your first login to mastering the platform's advanced features, including AI-assisted legal intelligence, dynamic document generation, and live incident mapping.

---

## 📑 Table of Contents
1. [Getting Started (Logging In)](#1-getting-started)
2. [Navigating the Dashboard](#2-navigating-the-dashboard)
3. [Case Management & FIRs](#3-case-management--firs)
4. [Document Generation (14 Dynamic Types)](#4-document-generation)
5. [Localization & Multilingual Translation](#5-localization--multilingual-translation)
6. [Patrol & CCTV Monitoring](#6-patrol--cctv-monitoring)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Getting Started

### Accessing the Platform
Open your secure web browser and navigate to the platform URL (default is `http://localhost`). 

### Logging In
- **Badge No:** Your official police identifier (e.g., `ADMIN001`).
- **Password:** Provided by your precinct administrator.
- Once logged in, your session is secured using an encrypted, browser-managed token (HttpOnly cookie) that you don't need to worry about managing manually.

---

## 2. Navigating the Dashboard

The Dashboard is your main command center.
- **Top Navigation Bar:** Contains the **Global Search Bar** (search for FIR numbers, names, or crime types). To the far right, you'll find the **Language Switcher** and **Dark/Light Mode Toggle**.
- **Sidebar (Left):** Gives you access to all core modules (Dashboard, Cases, Patrol, CCTV, Analytics).
- **Live Event Feed:** A real-time WebSocket feed showing you active units and incoming CCTV alerts without needing to refresh the page.

---

## 3. Case Management & FIRs

To view ongoing investigations or register a new First Information Report (FIR), click on **Cases / FIR** in the sidebar.

- **Creating a new FIR:** Click the `+ New FIR` button. You can manually enter details or use the **Voice Input Widget** (the microphone icon) to dictate the crime narrative.
- **AI Legal Assistant (CrimeGPT):** As you type the narrative, SAMRAKSHA’s local AI will automatically suggest the correct legal sections based on the new **BNS, BNSS, and BSA 2024 standards**.
- **Case Diary:** Every action taken on a case (including document generation) is automatically logged here with a cryptographic hash (SHA-256) to ensure court-admissible chain of custody.

---

## 4. Document Generation 

SAMRAKSHA completely automates official paperwork. You can generate 14 different court-ready documents directly from the platform.

### Step-by-Step Guide:
1. Open a specific case from the **Cases** menu.
2. In the Case Detail view, locate the **Generate Document** button (or open the CrimeGPT Document Studio).
3. A modal window will appear.
4. **Document Type:** Select the document you need from the dropdown. Available options include:
   - *First Information Report (FIR)*
   - *Purvani Chargesheet (BNS/BNSS)*
   - *Case Diary Record*
   - *Remand Request Application*
   - *Seizure Receipt / Seizure List*
   - *Court Custody Order*
   - *Accused Panchanama*
   - *Witness Statement*
   - *Face Identification Form*
   - *Medical Treatment Letter*
   - *Arrest Memo*
   - *Search Warrant*
   - *Bail Objection Application*
5. **Language:** Choose English, Hindi, or Gujarati.
6. Click **Download**. The system will process the data, perform AI translation if requested, and immediately trigger a secure `.docx` download to your computer.

---

## 5. Localization & Multilingual Translation

The platform features a fully integrated translation pipeline designed for regional deployment.

- **UI Language:** Change the interface language at any time using the dropdown at the top right of your screen (next to the sun/moon icon). The entire app will instantly translate to English, Hindi, or Gujarati without requiring a page reload.
- **Document Translation:** When generating documents (as explained in Section 4), the backend AI model (`IndicTrans2`) will automatically translate English narratives into Gujarati or Hindi court formats while preserving exact legal terminology.

---

## 6. Patrol & CCTV Monitoring

- **Live Patrol Map:** Under the **Patrol** tab, you can view the live GPS locations of all active police units overlaid on an OpenStreetMap interface. The system uses OSRM (Open Source Routing Machine) to suggest optimized routes.
- **CCTV Integration:** The **CCTV** tab connects to precinct cameras. The AI Vision model monitors these feeds and will generate an alert if it detects a weapon, accident, or unauthorized assembly.

---

## 7. Analytics & Reporting

Click on the **Analytics** tab to view your precinct's crime trends.
- **Interactive Charts:** Data is broken down hourly, weekly, and monthly.
- **Heatmaps:** Displays high-risk zones across Ahmedabad wards.
- All charts can be hovered over for exact statistics and are dynamically generated from the live database.

---

## 8. Troubleshooting

- **"Generation Failed" on Documents:** Ensure that you have selected a valid case. If generating a *Medical Treatment Letter*, the victim injury flag must be marked as 'Yes' in the case file.
- **Translation taking too long:** The first time a document is translated, the AI model loads into memory, which may take an extra 5–10 seconds. Subsequent translations are immediate.
- **Logged out randomly:** For security purposes, idle sessions expire after 60 minutes. Simply log back in.

---
*SAMRAKSHA — Ahmedabad City Police. Authorized Personnel Only.*
