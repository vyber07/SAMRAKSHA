# SAMRAKSHA User Guide

![Dashboard placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474731_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2Rhc2hib2FyZC1wbGFjZWhvbGRlcg.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3MzFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyUmhjMmhpYjJGeVpDMXdiR0ZqWldodmJHUmxjZy5zdmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3ODgyMjA4MDB9fX1dfQ__&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIQDGd9BkTzC-kWs0JAFTg1Suoz-0z7JPNnFIfgTrzXhXDwIgPA4BEvk67N72DhnKkV-zw3fQS5scNCAFY-qbap8ec98_)

This guide explains how an authorized officer uses SAMRAKSHA for daily case intelligence and operations. The visible options depend on the officer’s role and permissions. Use official records as the source of truth; AI suggestions and predictive views support review and do not replace statutory procedures or supervisory approval.

## Contents

1. [Signing in and understanding the workspace](#1-signing-in-and-understanding-the-workspace)
2. [Registering an FIR](#2-registering-an-fir)
3. [Reviewing a case and adding diary entries](#3-reviewing-a-case-and-adding-diary-entries)
4. [Using maps, patrols, CCTV, and analytics](#4-using-maps-patrols-cctv-and-analytics)
5. [Using translation](#5-using-translation)
6. [Generating and downloading documents](#6-generating-and-downloading-documents)
7. [Administration and audit records](#7-administration-and-audit-records)
8. [Troubleshooting and safe operating practice](#8-troubleshooting-and-safe-operating-practice)

## 1. Signing in and understanding the workspace

Open the SAMRAKSHA web address provided by your administrator. Enter your assigned badge number and password, then select **Sign in**. The server creates an HttpOnly session cookie; the browser does not store the access token or officer profile in `localStorage`. When the page is refreshed, SAMRAKSHA checks the active server session and restores the authorized workspace if the session is still valid.

![Login placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474731_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2xvZ2luLXBsYWNlaG9sZGVy.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3MzFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyeHZaMmx1TFhCc1lXTmxhRzlzWkdWeS5zdmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3ODgyMjA4MDB9fX1dfQ__&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIQDzCy4xrD5fKqH4LImrgtR~nv8wqoQ2i-wHJaLDKjsmwAIgcHU~lUUxJ5lL03zpHaXYMxX~maB~s0Xcf7QchmSMMlA_)

After signing in, the sidebar provides access to the modules allowed for your role. The dashboard is populated from the API and database. If a module has no records, it should show an empty state rather than inventing a case, officer, patrol, or alert.

To sign out, select **Logout**. This clears the session cookie and requests token revocation. Always sign out before leaving a shared workstation.

## 2. Registering an FIR

Open **New FIR** from the navigation. Complete the victim information, crime information, location, narrative, and any known accused details. Required fields are marked in the form. Use the actual incident details; do not enter placeholder names, coordinates, or section numbers.

Use **Analyze Narrative** or the legal-intelligence action to request section suggestions. Suggestions are read from the configured legal-intelligence service and should be reviewed by the investigating officer. If the service is unavailable, the interface does not substitute a fabricated legal section.

Review the final data and submit the FIR. A successful response returns the FIR number created by the backend. The application displays that persisted number and then returns to the cases list. If submission fails, read the displayed error, correct the form, and submit again only after confirming that the first request was not accepted.

## 3. Reviewing a case and adding diary entries

Open **Cases**, search by FIR number, victim, accused, or crime type, and select the required case. The case detail page presents the persisted narrative, location, victim information, applicable sections, status, and diary timeline.

To add an investigation record, select **Quick-Log Case Diary**. Choose the entry category, enter the official observation, optionally add an evidence tag, and submit. The entry is stored in `case_diary` and is associated with the case and officer session. Refresh the case if you need to confirm that the record has been returned by the backend.

The **Chat With Me** panel can be used for review-oriented assistance where enabled. Treat its responses as advisory. Confirm every legal, evidentiary, and procedural statement against official records and applicable law.

![Case detail placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474731_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2Nhc2UtZGV0YWlsLXBsYWNlaG9sZGVy.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3MzFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyTmhjMlV0WkdWMFlXbHNMWEJzWVdObGFHOXNaR1Z5LnN2ZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4ODIyMDgwMH19fV19&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEQCIEbqCv4MB3UL497aDGNtKl7rGpk5VtgxuC9gBoqdF0BUAiBAiYCohkQIcdiQPNgTtpz0hfes2vBK6TaUbLKmMN8eBQ__)

## 4. Using maps, patrols, CCTV, and analytics

The **Crime Map** displays ward and incident information returned by the backend. Select a ward or case marker to review its context. Do not interpret an empty map as evidence that no incidents exist until the data source and time range have been confirmed.

The **Patrol** module displays units returned by the patrol API. To add a unit, enter the real unit name, assigned officer, vehicle, and status. The system does not create random coordinates or placeholder phone numbers. Status changes and dispatch actions are sent to the API and should be confirmed by the response.

The **CCTV** module displays available camera feeds and alerts. A feed marked offline is not a successful monitoring result. Investigate the camera or integration status through the approved operational process.

The **Analytics** module summarizes data available to the current role. Review the selected time period, jurisdiction, and data freshness before using a chart in an operational decision.

## 5. Using translation

The translation system supports backend language codes including English (`en`), Hindi (`hi`), Gujarati (`gu`), Marathi (`mr`), Tamil (`ta`), Telugu (`te`), Kannada (`kn`), Punjabi (`pa`), Bengali (`bn`), Odia (`or`), Malayalam (`ml`), Assamese (`as`), and Urdu (`ur`). The document dialog presents human-readable names while submitting the codes expected by the API.

To translate text, open the translation action, select the source and target language, review the returned text, and verify names, legal terms, dates, addresses, and section references against the source. Translation is not a substitute for an official interpreter or certified translation where one is required.

The backend first attempts IndicTrans2. If that engine is unavailable and `LLAMACPP_URL` is configured, it attempts the configured local fallback. If neither engine is available, SAMRAKSHA returns an unavailable-service error rather than displaying an English glossary substitution as if it were a completed translation.

## 6. Generating and downloading documents

Open a case and select **Generate Document**, or open **Documents** and select a case context. The case selector submits the database `case_id` UUID, not the FIR display number. Select a template discovered from the backend and choose the target language.

Select **Generate**. The backend validates access to the case, resolves the template from `backend/templates/documents`, renders the DOCX with persisted case data, records the generated document metadata in `doc_log`, adds an automatic case-diary event, and returns the binary file. The browser reads the response as a Blob and starts a DOCX download with a safe filename.

![Document generation placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474731_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2RvY3VtZW50LWdlbmVyYXRpb24tcGxhY2Vob2xkZXI.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3MzFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyUnZZM1Z0Wlc1MExXZGxibVZ5WVhScGIyNHRjR3hoWTJWb2IyeGtaWEkuc3ZnIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzg4MjIwODAwfX19XX0_&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEYCIQDqHBOffnl5GvTkOAD0LmC6CIroKUMLRGqPyyo8JCGO3wIhAMlN2-dWMbcE7tfoWGQiKJ9ocPvc-OIgMionq08eztfL)

The **Created Documents** list is loaded from the database for the selected case. It shows the template identifier, FIR number, language, generation timestamp, generator, and SHA-256 digest. Select **DOCX** to re-download a persisted document. The backend regenerates it from the current case data and logged template metadata, so a re-download is not a local browser-only copy.

To translate and download a document, select the globe action, choose a target language, and select **Translate**. The operation creates a new document log entry through the same secure generation path. If translation is unavailable, correct the backend model or fallback configuration before treating the document as complete.

## 7. Administration and audit records

Administrators can use the **Admin** module to review officers, roles, permissions, and audit records. Officer creation, status changes, and role changes are persisted through the administration API. A successful UI update is not complete until the API returns success and the record can be reloaded.

Audit entries should be treated as append-only operational evidence. Do not edit an audit record to correct a display issue. Record a new corrective action through the approved administrative process.

## 8. Troubleshooting and safe operating practice

| Symptom | Checks |
|---|---|
| The login form keeps reappearing | Confirm the API is reachable, the session cookie is accepted for the configured origin, `COOKIE_SECURE` matches HTTPS usage, and Redis/database health is available. |
| Cases or patrols are empty | Confirm the officer has the required role, the API request returns a non-error response, and the database contains records for the authorized station or jurisdiction. |
| Document template list is empty | Confirm DOCX files exist in `DOCUMENT_TEMPLATE_DIR`, the backend container can read them, and the API is authenticated. |
| Document generation returns 400 | Check the selected case UUID, template identifier, language code, medical-letter injury requirement, and officer access to the case. |
| Document generation returns 503 | Check IndicTrans2 and the optional `LLAMACPP_URL` configuration when a non-English document is requested. |
| A downloaded file is corrupt or empty | Confirm the response is a DOCX response, do not revoke the Blob URL immediately, and inspect the browser download event. The repaired frontend delays URL revocation. |
| Voice transcription is unavailable | Confirm the upload uses an accepted audio MIME type, is under 25 MB, and the Whisper model is installed and loadable. |
| WebSocket status is disconnected | Confirm the browser is using the same secure origin as the API, the HttpOnly session is valid, and the API can validate the session cookie. |

Never paste passwords, JWTs, API keys, database URLs, or private case records into support tickets or browser consoles. Use redacted request IDs and timestamps when reporting an issue.
