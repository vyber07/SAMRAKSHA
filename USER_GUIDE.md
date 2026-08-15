# 📘 SAMRAKSHA: Comprehensive User Guide

Welcome to the SAMRAKSHA Operating Manual. This guide is designed to help law enforcement officers, dispatchers, and administrators navigate the system effectively.

---

## 📑 Table of Contents
1. [Getting Started (Login & Dashboard)](#1-getting-started)
2. [Managing Cases & FIRs](#2-managing-cases--firs)
3. [Dispatch & Patrol Routing](#3-dispatch--patrol-routing)
4. [CCTV & Threat Monitoring](#4-cctv--threat-monitoring)
5. [Using the AI Assistant](#5-using-the-ai-assistant)
6. [Generating Documents](#6-generating-documents)

---

## 1. Getting Started

### Logging In
1. Navigate to the SAMRAKSHA login portal.
2. Enter your assigned **Badge Number** and **Password**.
3. Upon successful login, you will be redirected to the **Main Dashboard**.

### The Main Dashboard
The dashboard provides a real-time, high-level overview of your jurisdiction:
- **Active Hotspots**: A live map displaying areas with recent high incident frequencies.
- **Recent Incidents**: A scrolling feed of the latest reported crimes.
- **Unit Status**: Quick metrics showing available vs. deployed patrol units.

![Dashboard Overview](/placeholder/dashboard_overview.png)

---

## 2. Managing Cases & FIRs

SAMRAKSHA digitizes the entire lifecycle of a case, fully integrated with CCTNS standards.

### Creating a New FIR
1. Click on **Cases** in the left navigation sidebar.
2. Select **+ New FIR**.
3. Fill out the narrative of the crime. 
4. **Auto-Mapping**: Click **Analyze Narrative**. The Legal Intelligence module will automatically suggest the correct BNS, BNSS, and BSA sections based on your text.
5. Review the suggestions, attach relevant suspect/victim information, and click **Submit FIR**.

### Updating a Case Diary
1. Open an existing case from the **Cases** list.
2. Navigate to the **Case Diary** tab.
3. Add new evidence, witness statements, or daily investigation updates.

---

## 3. Dispatch & Patrol Routing

Ensure your officers are exactly where they need to be, when they need to be there.

1. Navigate to the **Patrol & Dispatch** module.
2. **View Hotspots**: The system automatically clusters recent incidents to identify high-risk areas.
3. **Optimize Routes**: Select available patrol units and click **Generate Patrol Route**.
4. The system utilizes OSRM to calculate the fastest, most efficient paths connecting your units to the identified hotspots, minimizing travel time and maximizing visibility.

![Patrol Routing Map](/placeholder/patrol_map.png)

---

## 4. CCTV & Threat Monitoring

Monitor live feeds equipped with real-time AI anomaly detection.

1. Navigate to the **CCTV & Vision** module.
2. Select a camera feed from the grid.
3. **Anomaly Alerts**: If the system detects suspicious loitering, extreme crowding, or specific threats, an alert will flash red on the screen.
4. Click on an alert to view the system's detailed breakdown of the threat (powered by LLaVA vision models).

---

## 5. Using the AI Assistant

Have a question about procedure or need a quick translation? The built-in AI assistant is ready to help.

1. Click the **Chat Icon** in the bottom right corner of any screen.
2. **Ask Questions**: Type queries like *"What is the standard procedure for securing a digital device at a crime scene?"*
3. **Translation**: You can chat in your native language (e.g., Hindi, Gujarati). The assistant will instantly translate your request, process it, and reply in your preferred language.

---

## 6. Generating Documents

Stop writing boilerplate forms. SAMRAKSHA generates legally compliant paperwork automatically.

1. Open a specific **Case File**.
2. Click the **Generate Document** button in the top right.
3. Select the document type from the dropdown (e.g., *Chargesheet, Seizure Receipt, Arrest Memo*).
4. The system will pull all the relevant data (names, dates, mapped BNS sections, evidence lists) and instantly generate a `.docx` file for you to download, print, and sign.

![Document Generation](/placeholder/doc_gen.png)
