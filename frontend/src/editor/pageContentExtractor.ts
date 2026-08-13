// ─── Page Content Extractor ───────────────────────────────────────────────────
// Generates EditorElement snapshots from the known static content of each page.
// This gives the editor real content to work with instead of a blank canvas.

import type { EditorElement, PageSnapshot } from './types';
import { genId } from './storage';

// ─── Helper factories ─────────────────────────────────────────────────────────

function heading(content: string, extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'heading', content, children: [],
    style: {
      fontSize: '22px', fontWeight: '800', color: '#e8f0fe',
      fontFamily: 'Montserrat, sans-serif', lineHeight: '1.3',
      marginBottom: '4px',
    },
    label: 'Page Title',
    ...extra,
  };
}

function subheading(content: string, extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'heading', content, children: [],
    style: {
      fontSize: '16px', fontWeight: '700', color: '#e8f0fe',
      fontFamily: 'Montserrat, sans-serif', lineHeight: '1.3',
      marginBottom: '2px',
    },
    label: 'Subheading',
    ...extra,
  };
}

function text(content: string, extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'text', content, children: [],
    style: {
      fontSize: '13px', color: '#7a9cc8', lineHeight: '1.5',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    },
    ...extra,
  };
}

function badge(content: string, color = '#10B981', extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'badge', content, children: [],
    style: {
      display: 'inline-flex', alignItems: 'center',
      paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px',
      backgroundColor: `${color}22`, color,
      border: `1px solid ${color}44`,
      borderRadius: '20px', fontSize: '12px', fontWeight: '600',
    },
    ...extra,
  };
}

function button(content: string, extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'button', content, children: [],
    style: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      paddingTop: '8px', paddingBottom: '8px', paddingLeft: '16px', paddingRight: '16px',
      backgroundColor: '#004B87', color: '#ffffff',
      fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: '600', fontSize: '13px',
      borderRadius: '8px', cursor: 'pointer', border: 'none',
    },
    ...extra,
  };
}

function metricCard(label: string, value: string, trend?: string, colorHex = '#3B82F6'): EditorElement {
  const children: EditorElement[] = [
    {
      id: genId(), type: 'text', content: label, children: [],
      style: {
        fontSize: '11px', fontWeight: '600', color: '#7a9cc8',
        letterSpacing: '0.08em', textTransform: 'uppercase' as unknown as undefined,
        marginBottom: '6px',
      },
      label: 'Metric Label',
    } as EditorElement,
    {
      id: genId(), type: 'heading', content: value, children: [],
      style: {
        fontSize: '28px', fontWeight: '800', color: colorHex,
        fontFamily: 'Montserrat, sans-serif', lineHeight: '1.1',
      },
      label: 'Metric Value',
    },
  ];
  if (trend) {
    children.push({
      id: genId(), type: 'text', content: trend, children: [],
      style: { fontSize: '11px', color: '#7a9cc8', marginTop: '4px' },
      label: 'Metric Trend',
    });
  }
  return {
    id: genId(), type: 'card', content: '', children,
    style: {
      background: 'rgba(13,27,46,0.75)',
      border: '1px solid rgba(168,202,255,0.1)',
      borderRadius: '12px',
      paddingTop: '16px', paddingBottom: '16px',
      paddingLeft: '16px', paddingRight: '16px',
      display: 'flex', flexDirection: 'column', gap: '0',
    },
    label,
  };
}

function row(children: EditorElement[], extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'container', content: '', children,
    style: {
      display: 'flex', flexDirection: 'row', gap: '16px',
      flexWrap: 'wrap',
    },
    ...extra,
  };
}

function section(children: EditorElement[], extra?: Partial<EditorElement>): EditorElement {
  return {
    id: genId(), type: 'section', content: '', children,
    style: {
      display: 'flex', flexDirection: 'column', gap: '16px',
      paddingTop: '0', paddingBottom: '16px',
    },
    ...extra,
  };
}

function divider(): EditorElement {
  return {
    id: genId(), type: 'divider', content: '', children: [],
    style: {
      width: '100%', height: '1px',
      backgroundColor: 'rgba(168,202,255,0.08)',
      marginTop: '8px', marginBottom: '8px',
    },
  };
}

// ─── Per-page content extractors ──────────────────────────────────────────────

function getDashboardElements(): EditorElement[] {
  return [
    section([
      heading('Command Dashboard', { label: 'Page Title' }),
      text('Welcome back, Officer · Ahmedabad City Police Station', { label: 'Welcome text' }),
    ]),
    divider(),
    section([
      subheading('Key Metrics', { label: 'Metrics Section Title' }),
      row([
        metricCard('New Cases Today', '23', '+4 vs yesterday', '#3B82F6'),
        metricCard('Active Investigations', '147', '12 escalated', '#F59E0B'),
        metricCard('Threat Score Index', '84/100', 'ELEVATED', '#EF4444'),
        metricCard('High Risk Zones', '5', 'Nikol, Satellite...', '#EF4444'),
        metricCard('Open Cases', '312', '38 pending review', '#F59E0B'),
        metricCard('Closed Cases', '1,204', '+18 this week', '#10B981'),
      ], { label: 'Metrics Row' }),
    ], { label: 'Metrics Section' }),
    divider(),
    section([
      subheading('Quick Actions', { label: 'Quick Actions Title' }),
      row([
        button('Register FIR', { label: 'Register FIR Button', attrs: { href: '/cases' } }),
        button('Dispatch Patrol', { label: 'Dispatch Patrol Button', attrs: { href: '/patrol' } }),
        button('Query Legal AI', { label: 'Legal AI Button', attrs: { href: '/ai-assistant' } }),
        button('View Threat Map', { label: 'Threat Map Button', attrs: { href: '/map' } }),
      ], { label: 'Actions Row' }),
    ], { label: 'Quick Actions Section' }),
    divider(),
    section([
      subheading('TOTAL FIRs TODAY', { label: 'FIR Count Label' }),
      {
        id: genId(), type: 'heading', content: '312', children: [],
        style: { fontSize: '48px', fontWeight: '900', color: '#3B82F6', fontFamily: 'Montserrat, sans-serif' },
        label: 'FIR Count Value',
      },
      text('Across all police stations in Ahmedabad district', { label: 'FIR subtitle' }),
    ], { label: 'FIR Summary Section' }),
  ];
}

function getCasesElements(): EditorElement[] {
  return [
    section([
      heading('FIR & Cases Management', { label: 'Page Title' }),
      text('Manage, search, and track FIRs and case files.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Total FIRs', '1,204', 'Across all stations', '#3B82F6'),
        metricCard('Open Cases', '312', '38 pending review', '#F59E0B'),
        metricCard('Closed This Month', '189', '+12% vs last month', '#10B981'),
        metricCard('Pending Chargesheet', '47', '12 past deadline', '#EF4444'),
      ]),
    ], { label: 'Case Metrics' }),
    divider(),
    section([
      subheading('Recent FIRs', { label: 'Recent FIRs Title' }),
      text('FIR 2024/SB/1187 — Theft at Satellite Ward', { label: 'FIR Entry 1' }),
      text('FIR 2024/NR/0923 — Armed Robbery at Naranpura PS', { label: 'FIR Entry 2' }),
      text('FIR 2024/BD/0451 — Cyber Fraud Complaint at Bodakdev PS', { label: 'FIR Entry 3' }),
    ], { label: 'Recent FIRs Section' }),
    divider(),
    section([
      button('Register New FIR', { label: 'Register FIR Button' }),
      button('Search Cases', { label: 'Search Cases Button' }),
    ]),
  ];
}

function getCCTVElements(): EditorElement[] {
  return [
    section([
      heading('CCTV Surveillance Network', { label: 'Page Title' }),
      text('Live monitoring of 128 CCTV nodes across Ahmedabad city.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Active Cameras', '128', '6 offline', '#10B981'),
        metricCard('Alerts Today', '23', '4 high priority', '#EF4444'),
        metricCard('Suspects Flagged', '7', 'Face recognition matches', '#F59E0B'),
        metricCard('ANPR Alerts', '14', 'Vehicle tracking active', '#3B82F6'),
      ]),
    ], { label: 'CCTV Metrics' }),
    divider(),
    section([
      subheading('Active Alerts', { label: 'Active Alerts Title' }),
      {
        id: genId(), type: 'badge', content: 'HIGH PRIORITY', children: [],
        style: {
          display: 'inline-flex', alignItems: 'center',
          paddingTop: '4px', paddingBottom: '4px', paddingLeft: '12px', paddingRight: '12px',
          backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '20px', fontSize: '12px', fontWeight: '600',
        },
        label: 'Alert Badge',
      },
      text('Suspicious vehicle detected at SG Highway ANPR Node 4', { label: 'Alert description' }),
    ], { label: 'Alerts Section' }),
  ];
}

function getPatrolElements(): EditorElement[] {
  return [
    section([
      heading('Patrol Fleet Management', { label: 'Page Title' }),
      text('Real-time tracking and dispatch of PCR units.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Active PCR Units', '24', '6 in standby', '#10B981'),
        metricCard('Dispatched Today', '47', 'Avg response: 4.2 min', '#3B82F6'),
        metricCard('Incidents Responded', '31', '+8 vs yesterday', '#F59E0B'),
        metricCard('Fuel Level Alerts', '3', 'Units below 20%', '#EF4444'),
      ]),
    ], { label: 'Patrol Metrics' }),
    divider(),
    section([
      subheading('Active PCR Units', { label: 'PCR Units Title' }),
      text('PCR-11 — Dispatched to Satellite Ward incident — FIR 2024/SB/1187', { label: 'PCR Unit 1' }),
      text('PCR-23 — At Vastrapur Lake checkpoint — all clear', { label: 'PCR Unit 2' }),
      text('PCR-14 — Back in service — SG Highway patrol resumed', { label: 'PCR Unit 3' }),
    ], { label: 'PCR Units Section' }),
    divider(),
    section([
      button('Dispatch PCR Unit', { label: 'Dispatch Button' }),
      button('View All Routes', { label: 'Routes Button' }),
    ]),
  ];
}

function getCrimeMapElements(): EditorElement[] {
  return [
    section([
      heading('Crime Heat Map', { label: 'Page Title' }),
      text('Predictive crime analysis and threat zone mapping for Ahmedabad.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Threat Score Index', '84/100', 'ELEVATED', '#EF4444'),
        metricCard('High Risk Zones', '5', 'Nikol, Satellite, Naranpura...', '#EF4444'),
        metricCard('Active Incidents', '23', 'Last 24 hours', '#F59E0B'),
        metricCard('Incidents This Week', '147', '+12% vs last week', '#3B82F6'),
      ]),
    ], { label: 'Crime Map Metrics' }),
    divider(),
    section([
      subheading('High Risk Areas', { label: 'High Risk Areas Title' }),
      row([
        badge('Satellite Ward — Risk: 82/100', '#EF4444', { label: 'Satellite Risk' }),
        badge('Nikol Ward — Risk: 78/100', '#EF4444', { label: 'Nikol Risk' }),
        badge('Naranpura — Risk: 67/100', '#F59E0B', { label: 'Naranpura Risk' }),
        badge('Maninagar — Risk: 74/100', '#F59E0B', { label: 'Maninagar Risk' }),
      ]),
    ], { label: 'High Risk Areas Section' }),
  ];
}

function getAIAssistantElements(): EditorElement[] {
  return [
    section([
      heading('AI Legal & Investigation Assistant', { label: 'Page Title' }),
      text('Powered by advanced AI models. Query case law, analyze documents, and get investigation guidance.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Queries Today', '47', 'Avg response: 1.2s', '#8B5CF6'),
        metricCard('Documents Analyzed', '12', 'This session', '#3B82F6'),
        metricCard('Case References', '234', 'Matched this week', '#10B981'),
        metricCard('Model Accuracy', '94.3%', 'Legal classification', '#F59E0B'),
      ]),
    ], { label: 'AI Metrics' }),
    divider(),
    section([
      subheading('Quick Queries', { label: 'Quick Queries Title' }),
      button('Analyze FIR Document', { label: 'Analyze FIR Button' }),
      button('Search Case Law (BNS 2023)', { label: 'Case Law Button' }),
      button('Generate Chargesheet', { label: 'Chargesheet Button' }),
    ], { label: 'Quick Queries Section' }),
    divider(),
    section([
      subheading('Recent Queries', { label: 'Recent Queries Title' }),
      text('Section 302 IPC punishment and sentencing guidelines', { label: 'Query 1' }),
      text('Bail conditions for NDPS Act offenses under BNSS', { label: 'Query 2' }),
      text('Evidence chain of custody requirements for digital evidence', { label: 'Query 3' }),
    ], { label: 'Recent Queries Section' }),
  ];
}

function getDocumentStudioElements(): EditorElement[] {
  return [
    section([
      heading('Document Studio', { label: 'Page Title' }),
      text('Generate legal documents, chargesheet templates, and official reports.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Documents Generated', '89', 'This month', '#3B82F6'),
        metricCard('Templates Available', '12', '8 legal, 4 admin', '#10B981'),
        metricCard('Pending Reviews', '7', '3 urgent', '#F59E0B'),
        metricCard('Exports Today', '23', 'PDF & DOCX', '#8B5CF6'),
      ]),
    ], { label: 'Document Metrics' }),
    divider(),
    section([
      subheading('Available Templates', { label: 'Templates Title' }),
      text('Chargesheet (BNS 2024)', { label: 'Template 1' }),
      text('Remand Request (BNSS)', { label: 'Template 2' }),
      text('Court Custody Memo (BNSS)', { label: 'Template 3' }),
      text('Witness Statement Template', { label: 'Template 4' }),
      text('Seizure Receipt Form', { label: 'Template 5' }),
      text('Accused Panchanama', { label: 'Template 6' }),
    ], { label: 'Templates Section' }),
    divider(),
    section([
      button('Generate New Document', { label: 'Generate Button' }),
      button('Search Templates', { label: 'Search Button' }),
    ]),
  ];
}

function getAdminElements(): EditorElement[] {
  return [
    section([
      heading('Admin & User Management', { label: 'Page Title' }),
      text('Manage officers, roles, permissions, and system configuration.', { label: 'Subtitle' }),
    ]),
    divider(),
    section([
      row([
        metricCard('Total Officers', '247', '12 new this month', '#3B82F6'),
        metricCard('Active Roles', '8', 'SI, ASI, Inspector...', '#10B981'),
        metricCard('Pending Approvals', '5', '2 role changes', '#F59E0B'),
        metricCard('Stations Covered', '14', 'Ahmedabad district', '#8B5CF6'),
      ]),
    ], { label: 'Admin Metrics' }),
    divider(),
    section([
      subheading('System Actions', { label: 'System Actions Title' }),
      button('Add New Officer', { label: 'Add Officer Button' }),
      button('Manage Roles & Permissions', { label: 'Manage Roles Button' }),
      button('View Audit Logs', { label: 'Audit Logs Button' }),
      button('System Configuration', { label: 'System Config Button' }),
    ], { label: 'System Actions Section' }),
    divider(),
    section([
      subheading('Recent Activity', { label: 'Recent Activity Title' }),
      text('Officer Ravi Sharma promoted to Inspector — 2 hours ago', { label: 'Activity 1' }),
      text('Role "CCTV Operator" created — 5 hours ago', { label: 'Activity 2' }),
      text('Station configuration updated: Naranpura PS — 1 day ago', { label: 'Activity 3' }),
    ], { label: 'Recent Activity Section' }),
  ];
}

// ─── Page content map ─────────────────────────────────────────────────────────
const PAGE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  cases: 'FIR & Cases',
  cctv: 'CCTV Surveillance',
  patrol: 'Patrol Fleet',
  map: 'Crime Map',
  'ai-assistant': 'AI Assistant',
  'document-studio': 'Document Studio',
  admin: 'Admin & Users',
};

const PAGE_EXTRACTORS: Record<string, () => EditorElement[]> = {
  dashboard: getDashboardElements,
  cases: getCasesElements,
  cctv: getCCTVElements,
  patrol: getPatrolElements,
  map: getCrimeMapElements,
  'ai-assistant': getAIAssistantElements,
  'document-studio': getDocumentStudioElements,
  admin: getAdminElements,
};

/**
 * Generate a PageSnapshot from the existing page's static content.
 * This snapshot is used as the starting point when the user opens the editor
 * for a page that has no saved draft.
 */
export function extractPageContent(pageId: string): PageSnapshot {
  const extractor = PAGE_EXTRACTORS[pageId];
  const elements = extractor ? extractor() : [];
  return {
    id: pageId,
    label: PAGE_LABELS[pageId] ?? pageId,
    elements,
    updatedAt: new Date().toISOString(),
  };
}

export { PAGE_LABELS };
