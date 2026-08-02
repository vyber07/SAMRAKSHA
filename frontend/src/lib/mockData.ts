import {
  CCTVCamera,
  PatrolUnit,
  DispatchRoute,
  HeatmapPoint,
  CaseFIR,
  Officer,
  LegalSection,
  AuditLog,
  AnalyticsData,
  StationSettings,
  CrimeGptMessage,
  DocumentTemplate,
  TranslationItem,
  ExecutiveKpiStats,
  WardRiskSummary
} from './types';

// GeoJSON FeatureCollection of 12 Ahmedabad City Municipal Wards with Risk Scores
export const ahmedabadWardsGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        id: "W01",
        name: "Navrangpura",
        riskScore: 78,
        activeIncidents: 6,
        activePatrols: 4,
        cctvCount: 18,
        populationDensity: "14,200 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.550, 23.045],
          [72.572, 23.045],
          [72.570, 23.030],
          [72.548, 23.030],
          [72.550, 23.045]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W02",
        name: "Ellisbridge",
        riskScore: 84, // Critical risk
        activeIncidents: 9,
        activePatrols: 5,
        cctvCount: 24,
        populationDensity: "18,500 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.560, 23.028],
          [72.580, 23.028],
          [72.578, 23.012],
          [72.558, 23.012],
          [72.560, 23.028]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W03",
        name: "Satellite",
        riskScore: 42, // Medium risk
        activeIncidents: 3,
        activePatrols: 3,
        cctvCount: 15,
        populationDensity: "11,800 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.505, 23.035],
          [72.535, 23.035],
          [72.535, 23.018],
          [72.505, 23.018],
          [72.505, 23.035]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W04",
        name: "Bodakdev",
        riskScore: 25, // Low risk
        activeIncidents: 1,
        activePatrols: 2,
        cctvCount: 12,
        populationDensity: "9,400 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.500, 23.052],
          [72.530, 23.052],
          [72.530, 23.036],
          [72.500, 23.036],
          [72.500, 23.052]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W05",
        name: "Paldi",
        riskScore: 65, // High risk
        activeIncidents: 5,
        activePatrols: 3,
        cctvCount: 16,
        populationDensity: "16,100 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.552, 23.012],
          [72.575, 23.012],
          [72.570, 22.998],
          [72.548, 22.998],
          [72.552, 23.012]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W06",
        name: "Kalupur (Walled City)",
        riskScore: 91, // Critical risk
        activeIncidents: 12,
        activePatrols: 6,
        cctvCount: 32,
        populationDensity: "26,500 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.582, 23.036],
          [72.605, 23.036],
          [72.605, 23.020],
          [72.582, 23.020],
          [72.582, 23.036]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W07",
        name: "Maninagar",
        riskScore: 58, // Medium risk
        activeIncidents: 4,
        activePatrols: 3,
        cctvCount: 14,
        populationDensity: "15,800 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.590, 23.008],
          [72.620, 23.008],
          [72.615, 22.985],
          [72.585, 22.985],
          [72.590, 23.008]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W08",
        name: "Jamalpur",
        riskScore: 82, // Critical risk
        activeIncidents: 8,
        activePatrols: 4,
        cctvCount: 20,
        populationDensity: "22,100 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.575, 23.020],
          [72.595, 23.020],
          [72.595, 23.005],
          [72.575, 23.005],
          [72.575, 23.020]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W09",
        name: "Shahibaug",
        riskScore: 35, // Medium risk
        activeIncidents: 2,
        activePatrols: 2,
        cctvCount: 16,
        populationDensity: "12,900 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.572, 23.065],
          [72.600, 23.065],
          [72.595, 23.040],
          [72.568, 23.040],
          [72.572, 23.065]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W10",
        name: "Vastrapur",
        riskScore: 28, // Low risk
        activeIncidents: 1,
        activePatrols: 2,
        cctvCount: 14,
        populationDensity: "10,200 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.520, 23.045],
          [72.548, 23.045],
          [72.545, 23.030],
          [72.518, 23.030],
          [72.520, 23.045]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W11",
        name: "Nikol",
        riskScore: 72, // High risk
        activeIncidents: 7,
        activePatrols: 3,
        cctvCount: 11,
        populationDensity: "17,400 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.630, 23.055],
          [72.665, 23.055],
          [72.660, 23.035],
          [72.625, 23.035],
          [72.630, 23.055]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        id: "W12",
        name: "Thaltej",
        riskScore: 22, // Low risk
        activeIncidents: 1,
        activePatrols: 2,
        cctvCount: 15,
        populationDensity: "8,900 / sq km"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [72.490, 23.070],
          [72.522, 23.070],
          [72.520, 23.052],
          [72.488, 23.052],
          [72.490, 23.070]
        ]]
      }
    }
  ]
};

// Derived Ward Risk Summaries
export const mockWardRiskSummaries: WardRiskSummary[] = ahmedabadWardsGeoJSON.features.map(f => ({
  wardId: f.properties.id,
  wardName: f.properties.name,
  riskScore: f.properties.riskScore,
  activeIncidents: f.properties.activeIncidents,
  activePatrols: f.properties.activePatrols,
  cctvCount: f.properties.cctvCount
}));

// 12 Realistic Case / FIR Records with BNS & IPC Sections & Detailed Notes
export const mockCases: CaseFIR[] = [
  {
    id: "FIR-2026-0042",
    fir_no: "FIR/NAV/2026/0042",
    ps_id: "PS-NAV-01",
    ps_name: "Navrangpura Police Station",
    incident_date: "2026-07-29T21:45:00Z",
    reported_date: "2026-07-29T22:15:00Z",
    crime_type: "Robbery Attempt",
    bns_sections: ["Section 309", "Section 311"],
    ipc_sections: ["IPC Section 392", "IPC Section 397"],
    status: "under_investigation",
    io_name: "Sub-Inspector Anita Roy",
    complainant_name: "Rameshchandra Shah",
    complainant_phone: "+91 98250 11223",
    description: "Two unidentified suspects on a black motorcycle attempted to snatch a jewelry bag outside C.G. Road showroom at gunpoint.",
    location: {
      lat: 23.0380,
      lng: 72.5640,
      address: "Near Tanishq Showroom, C.G. Road, Navrangpura, Ahmedabad",
      ward: "Navrangpura"
    },
    priority: "critical",
    evidence_count: 5,
    diary_notes: [
      {
        id: "DN-101",
        timestamp: "2026-07-29T22:30:00Z",
        author: "Sub-Inspector Anita Roy",
        note: "Arrived at crime scene. Secured CCTV footage from CAM-101 and CAM-115."
      },
      {
        id: "DN-102",
        timestamp: "2026-07-30T01:15:00Z",
        author: "Inspector Vikram Jadeja",
        note: "Dispatched CHETAK-1 patrol unit to sweep Ashram Road and Swastik Cross Roads."
      },
      {
        id: "DN-103",
        timestamp: "2026-07-30T06:00:00Z",
        author: "Sub-Inspector Anita Roy",
        note: "Partial license plate identified from CCTV ANPR analysis: GJ-01-XX-9412."
      }
    ]
  },
  {
    id: "FIR-2026-0089",
    fir_no: "FIR/KAL/2026/0089",
    ps_id: "PS-KAL-02",
    ps_name: "Kalupur Police Station",
    incident_date: "2026-07-28T03:20:00Z",
    reported_date: "2026-07-28T07:00:00Z",
    crime_type: "Commercial Burglary",
    bns_sections: ["Section 305", "Section 331(4)"],
    ipc_sections: ["IPC Section 380", "IPC Section 457"],
    status: "under_investigation",
    io_name: "Sub-Inspector Anand Shah",
    complainant_name: "Mohammad Iqbal Shaikh",
    complainant_phone: "+91 98980 44332",
    description: "Shutter lock broken at wholesale textile shop in Relief Road Market. Currency notes worth ₹4.5 Lakh and silk goods stolen.",
    location: {
      lat: 23.0295,
      lng: 72.5980,
      address: "Shop #44, Relief Road Textile Market, Kalupur, Ahmedabad",
      ward: "Kalupur (Walled City)"
    },
    priority: "high",
    evidence_count: 3,
    diary_notes: [
      {
        id: "DN-201",
        timestamp: "2026-07-28T08:00:00Z",
        author: "Sub-Inspector Anand Shah",
        note: "Forensic team collected fingerprint samples from broken padlock and cash register."
      },
      {
        id: "DN-202",
        timestamp: "2026-07-28T14:30:00Z",
        author: "Sub-Inspector Anand Shah",
        note: "Face match anomaly triggered on CAM-113. Suspect matches habitual offender profile."
      }
    ]
  },
  {
    id: "FIR-2026-0112",
    fir_no: "FIR/JAM/2026/0112",
    ps_id: "PS-JAM-03",
    ps_name: "Jamalpur Police Station",
    incident_date: "2026-07-29T18:10:00Z",
    reported_date: "2026-07-29T19:00:00Z",
    crime_type: "Vehicle Theft",
    bns_sections: ["Section 303(2)"],
    ipc_sections: ["IPC Section 379"],
    status: "pending",
    io_name: "Sub-Inspector Kamesh Rathod",
    complainant_name: "Bhavesh Patel",
    complainant_phone: "+91 97243 88901",
    description: "White Royal Enfield Bullet (Reg: GJ-01-ER-5521) stolen from Jamalpur Flower Market parking bay.",
    location: {
      lat: 23.0115,
      lng: 72.5840,
      address: "Flower Market Gate 2, Jamalpur, Ahmedabad",
      ward: "Jamalpur"
    },
    priority: "medium",
    evidence_count: 2,
    diary_notes: [
      {
        id: "DN-301",
        timestamp: "2026-07-29T19:30:00Z",
        author: "Sub-Inspector Kamesh Rathod",
        note: "ANPR alert sent to all toll plazas on Sardar Patel Ring Road."
      }
    ]
  },
  {
    id: "FIR-2026-0134",
    fir_no: "FIR/SAT/2026/0134",
    ps_id: "PS-SAT-04",
    ps_name: "Satellite Police Station",
    incident_date: "2026-07-27T11:00:00Z",
    reported_date: "2026-07-27T15:45:00Z",
    crime_type: "Cyber Fraud & Phishing",
    bns_sections: ["Section 318(4)", "Section 319"],
    ipc_sections: ["IPC Section 420", "IPC Section 419"],
    status: "under_investigation",
    io_name: "Sub-Inspector Anita Roy",
    complainant_name: "Mehta Sunita Ben",
    complainant_phone: "+91 98240 77112",
    description: "Victim defrauded of ₹12.8 Lakh via fake bank APK download and screen share application.",
    location: {
      lat: 23.0265,
      lng: 72.5090,
      address: "Iscon Platinum Apartments, SG Highway, Satellite, Ahmedabad",
      ward: "Satellite"
    },
    priority: "high",
    evidence_count: 8,
    diary_notes: [
      {
        id: "DN-401",
        timestamp: "2026-07-27T16:30:00Z",
        author: "Sub-Inspector Anita Roy",
        note: "Bank accounts frozen via Cyber Crime Helpline 1930 portal integration."
      },
      {
        id: "DN-402",
        timestamp: "2026-07-28T10:00:00Z",
        author: "Inspector Sunita Varma",
        note: "Mule account beneficiary traced to Jamtara module. Node IP address flagged."
      }
    ]
  },
  {
    id: "FIR-2026-0156",
    fir_no: "FIR/PAL/2026/0156",
    ps_id: "PS-PAL-05",
    ps_name: "Paldi Police Station",
    incident_date: "2026-07-26T20:30:00Z",
    reported_date: "2026-07-26T21:00:00Z",
    crime_type: "Public Riot & Unlawful Assembly",
    bns_sections: ["Section 189(2)", "Section 191"],
    ipc_sections: ["IPC Section 143", "IPC Section 147"],
    status: "chargesheeted",
    io_name: "Inspector Vikram Jadeja",
    complainant_name: "State of Gujarat (Police Suo Moto)",
    complainant_phone: "+91 79265 77100",
    description: "Group of 15 youth gathered near Paldi Cross Roads damaging public transport buses after argument.",
    location: {
      lat: 23.0090,
      lng: 72.5610,
      address: "Paldi Bus Rapid Transit Station, Paldi, Ahmedabad",
      ward: "Paldi"
    },
    priority: "high",
    evidence_count: 12,
    diary_notes: [
      {
        id: "DN-501",
        timestamp: "2026-07-26T21:30:00Z",
        author: "Inspector Vikram Jadeja",
        note: "Crowd surge anomaly triggered on CAM-107. PCR Van RANGER-4 dispersed crowd in 6 mins."
      },
      {
        id: "DN-502",
        timestamp: "2026-07-27T14:00:00Z",
        author: "Inspector Vikram Jadeja",
        note: "7 prime accused arrested and chargesheet prepared under BNS Section 189."
      }
    ]
  },
  {
    id: "FIR-2026-0178",
    fir_no: "FIR/ELL/2026/0178",
    ps_id: "PS-ELL-06",
    ps_name: "Ellisbridge Police Station",
    incident_date: "2026-07-25T14:15:00Z",
    reported_date: "2026-07-25T16:00:00Z",
    crime_type: "Extortion Threat",
    bns_sections: ["Section 308(2)"],
    ipc_sections: ["IPC Section 384"],
    status: "under_investigation",
    io_name: "Inspector D. Mehta",
    complainant_name: "Kiritbhai Patel",
    complainant_phone: "+91 94260 55443",
    description: "Extortion phone calls demanding ₹25 Lakh protection money delivered to local builder.",
    location: {
      lat: 23.0245,
      lng: 72.5585,
      address: "Law Garden Commercial Complex, Ellisbridge, Ahmedabad",
      ward: "Ellisbridge"
    },
    priority: "critical",
    evidence_count: 4,
    diary_notes: [
      {
        id: "DN-601",
        timestamp: "2026-07-25T17:00:00Z",
        author: "Inspector D. Mehta",
        note: "Call Detail Records (CDR) analyzed. VoIP gateway IP traced to international VPN endpoint."
      }
    ]
  },
  {
    id: "FIR-2026-0190",
    fir_no: "FIR/MAN/2026/0190",
    ps_id: "PS-MAN-07",
    ps_name: "Maninagar Police Station",
    incident_date: "2026-07-24T19:30:00Z",
    reported_date: "2026-07-24T20:10:00Z",
    crime_type: "Snatching",
    bns_sections: ["Section 304"],
    ipc_sections: ["IPC Section 379A"],
    status: "pending",
    io_name: "Sub-Inspector Bhavesh Zala",
    complainant_name: "Urmilaben Trivedi",
    complainant_phone: "+91 98791 22334",
    description: "Gold chain weighing 15 grams snatched from pedestrian near Kankaria Lake Gate 3.",
    location: {
      lat: 22.9975,
      lng: 72.6010,
      address: "Kankaria Lakefront Walkway, Maninagar, Ahmedabad",
      ward: "Maninagar"
    },
    priority: "medium",
    evidence_count: 2,
    diary_notes: [
      {
        id: "DN-701",
        timestamp: "2026-07-24T21:00:00Z",
        author: "Sub-Inspector Bhavesh Zala",
        note: "Footage from CAM-114 requested for review."
      }
    ]
  },
  {
    id: "FIR-2026-0205",
    fir_no: "FIR/NIK/2026/0205",
    ps_id: "PS-NIK-08",
    ps_name: "Nikol Police Station",
    incident_date: "2026-07-23T02:00:00Z",
    reported_date: "2026-07-23T04:30:00Z",
    crime_type: "Organized Narcotics Trafficking",
    bns_sections: ["Section 111", "NDPS Act Section 21"],
    ipc_sections: ["IPC Section 120B"],
    status: "chargesheeted",
    io_name: "Sub-Inspector K. Patel",
    complainant_name: "State of Gujarat (Anti-Narcotics Cell)",
    complainant_phone: "+91 79228 66100",
    description: "Seizure of 420 grams of contraband substances from commercial truck intercepted at Nikol Ring Road.",
    location: {
      lat: 23.0440,
      lng: 72.6480,
      address: "Nikol Circle, Sardar Patel Ring Road, Nikol, Ahmedabad",
      ward: "Nikol"
    },
    priority: "critical",
    evidence_count: 14,
    diary_notes: [
      {
        id: "DN-801",
        timestamp: "2026-07-23T05:00:00Z",
        author: "Sub-Inspector K. Patel",
        note: "Truck impounded. 3 interstate traffickers remanded to police custody."
      }
    ]
  },
  {
    id: "FIR-2026-0220",
    fir_no: "FIR/SHA/2026/0220",
    ps_id: "PS-SHA-09",
    ps_name: "Shahibaug Police Station",
    incident_date: "2026-07-22T17:45:00Z",
    reported_date: "2026-07-22T18:30:00Z",
    crime_type: "Assault & Threat",
    bns_sections: ["Section 115(2)", "Section 351(2)"],
    ipc_sections: ["IPC Section 323", "IPC Section 506"],
    status: "closed",
    io_name: "Inspector Harshad Trivedi",
    complainant_name: "Sanjay Parmar",
    complainant_phone: "+91 98255 99001",
    description: "Physical brawl following road rage collision near Shahibaug Underpass.",
    location: {
      lat: 23.0520,
      lng: 72.5830,
      address: "Shahibaug Underbridge Exit, Shahibaug, Ahmedabad",
      ward: "Shahibaug"
    },
    priority: "low",
    evidence_count: 1,
    diary_notes: [
      {
        id: "DN-901",
        timestamp: "2026-07-22T19:30:00Z",
        author: "Inspector Harshad Trivedi",
        note: "Parties reached compromise at police station. Statement recorded and case closed."
      }
    ]
  },
  {
    id: "FIR-2026-0235",
    fir_no: "FIR/BOD/2026/0235",
    ps_id: "PS-BOD-10",
    ps_name: "Bodakdev Police Station",
    incident_date: "2026-07-21T13:00:00Z",
    reported_date: "2026-07-21T14:15:00Z",
    crime_type: "Residential Burglary",
    bns_sections: ["Section 305"],
    ipc_sections: ["IPC Section 380"],
    status: "pending",
    io_name: "Sub-Inspector Anita Roy",
    complainant_name: "Chintan Shah",
    complainant_phone: "+91 99090 33211",
    description: "Gold ornament theft from locked bungalow while family was out of town.",
    location: {
      lat: 23.0500,
      lng: 72.5150,
      address: "Judges Bungalow Road, Bodakdev, Ahmedabad",
      ward: "Bodakdev"
    },
    priority: "medium",
    evidence_count: 3,
    diary_notes: [
      {
        id: "DN-1001",
        timestamp: "2026-07-21T15:00:00Z",
        author: "Sub-Inspector Anita Roy",
        note: "Society gate CCTV records verified. Domestic help summoned for inquiry."
      }
    ]
  },
  {
    id: "FIR-2026-0250",
    fir_no: "FIR/THA/2026/0250",
    ps_id: "PS-THA-11",
    ps_name: "Thaltej Police Station",
    incident_date: "2026-07-20T23:10:00Z",
    reported_date: "2026-07-20T23:45:00Z",
    crime_type: "Hit and Run Rash Driving",
    bns_sections: ["Section 281", "Section 106(1)"],
    ipc_sections: ["IPC Section 279", "IPC Section 304A"],
    status: "under_investigation",
    io_name: "Sub-Inspector Anand Shah",
    complainant_name: "Prakash Vaghela",
    complainant_phone: "+91 98251 44556",
    description: "Speeding SUV collided with two-wheeler near Iskcon Circle and fled towards Bopal.",
    location: {
      lat: 23.0600,
      lng: 72.5000,
      address: "Iskcon Circle Flyover, Thaltej, Ahmedabad",
      ward: "Thaltej"
    },
    priority: "high",
    evidence_count: 6,
    diary_notes: [
      {
        id: "DN-1101",
        timestamp: "2026-07-21T00:30:00Z",
        author: "Sub-Inspector Anand Shah",
        note: "Victim admitted to Sola Civil Hospital. Vehicle tail lamp fragment collected as evidence."
      }
    ]
  },
  {
    id: "FIR-2026-0268",
    fir_no: "FIR/VAS/2026/0268",
    ps_id: "PS-VAS-12",
    ps_name: "Vastrapur Police Station",
    incident_date: "2026-07-19T10:30:00Z",
    reported_date: "2026-07-19T12:00:00Z",
    crime_type: "ATM Card Skimming Fraud",
    bns_sections: ["Section 318(4)"],
    ipc_sections: ["IPC Section 420"],
    status: "closed",
    io_name: "Inspector Sunita Varma",
    complainant_name: "Deepak Patel",
    complainant_phone: "+91 98981 12345",
    description: "Unauthorised withdrawal of ₹60,000 via cloned debit card at Vastrapur Lake ATM.",
    location: {
      lat: 23.0360,
      lng: 72.5290,
      address: "Vastrapur Lake Commercial Complex, Vastrapur, Ahmedabad",
      ward: "Vastrapur"
    },
    priority: "low",
    evidence_count: 4,
    diary_notes: [
      {
        id: "DN-1201",
        timestamp: "2026-07-19T14:00:00Z",
        author: "Inspector Sunita Varma",
        note: "Skimmer device recovered from ATM card slot. Suspect apprehended in Surat."
      }
    ]
  }
];

// 16 Smart CCTV Cameras Data across 12 Wards
export const mockCctvCameras: CCTVCamera[] = [
  {
    id: "CAM-101",
    name: "Ashram Rd Junction #4",
    ward: "Navrangpura",
    lat: 23.0380,
    lng: 72.5640,
    status: "online",
    anomaly: "face_match",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-101",
    last_ping: "2026-07-30T18:45:00Z",
    resolution: "4K UHD (3840x2160)",
    camera_type: "ptz"
  },
  {
    id: "CAM-102",
    name: "Law Garden Circle North",
    ward: "Ellisbridge",
    lat: 23.0245,
    lng: 72.5585,
    status: "warning",
    anomaly: "crowd_surge",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-102",
    last_ping: "2026-07-30T18:44:30Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-103",
    name: "Kalupur Railway Station Main Gate",
    ward: "Kalupur (Walled City)",
    lat: 23.0295,
    lng: 72.5980,
    status: "online",
    anomaly: "plate_recognised",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-103",
    last_ping: "2026-07-30T18:45:10Z",
    resolution: "4K UHD",
    camera_type: "anpr"
  },
  {
    id: "CAM-104",
    name: "Jamalpur Darwaja Plaza",
    ward: "Jamalpur",
    lat: 23.0115,
    lng: 72.5840,
    status: "warning",
    anomaly: "weapon_detected",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-104",
    last_ping: "2026-07-30T18:43:00Z",
    resolution: "1080p FHD",
    camera_type: "thermal"
  },
  {
    id: "CAM-105",
    name: "SG Highway Iskcon Flyover",
    ward: "Satellite",
    lat: 23.0265,
    lng: 72.5090,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-105",
    last_ping: "2026-07-30T18:45:12Z",
    resolution: "4K UHD",
    camera_type: "anpr"
  },
  {
    id: "CAM-106",
    name: "Vastrapur Lake East Entry",
    ward: "Vastrapur",
    lat: 23.0360,
    lng: 72.5290,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-106",
    last_ping: "2026-07-30T18:45:00Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-107",
    name: "Paldi Cross Road South",
    ward: "Paldi",
    lat: 23.0090,
    lng: 72.5610,
    status: "online",
    anomaly: "crowd_surge",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-107",
    last_ping: "2026-07-30T18:44:50Z",
    resolution: "4K UHD",
    camera_type: "ptz"
  },
  {
    id: "CAM-108",
    name: "Maninagar Railway Underpass",
    ward: "Maninagar",
    lat: 22.9975,
    lng: 72.6010,
    status: "offline",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-108",
    last_ping: "2026-07-30T14:20:00Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-109",
    name: "Shahibaug Underbridge Exit",
    ward: "Shahibaug",
    lat: 23.0520,
    lng: 72.5830,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-109",
    last_ping: "2026-07-30T18:45:05Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-110",
    name: "Nikol Cross Road Ring",
    ward: "Nikol",
    lat: 23.0440,
    lng: 72.6480,
    status: "warning",
    anomaly: "plate_recognised",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-110",
    last_ping: "2026-07-30T18:44:10Z",
    resolution: "4K UHD",
    camera_type: "anpr"
  },
  {
    id: "CAM-111",
    name: "Thaltej Metro Station Entrance",
    ward: "Thaltej",
    lat: 23.0600,
    lng: 72.5000,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-111",
    last_ping: "2026-07-30T18:45:00Z",
    resolution: "1080p FHD",
    camera_type: "ptz"
  },
  {
    id: "CAM-112",
    name: "Bodakdev Judges Bungalow Road",
    ward: "Bodakdev",
    lat: 23.0500,
    lng: 72.5150,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-112",
    last_ping: "2026-07-30T18:45:00Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-113",
    name: "Relief Road Commercial Hub",
    ward: "Kalupur (Walled City)",
    lat: 23.0310,
    lng: 72.5950,
    status: "warning",
    anomaly: "face_match",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-113",
    last_ping: "2026-07-30T18:44:00Z",
    resolution: "4K UHD",
    camera_type: "ptz"
  },
  {
    id: "CAM-114",
    name: "Kankaria Gate #3",
    ward: "Maninagar",
    lat: 23.0000,
    lng: 72.5990,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-114",
    last_ping: "2026-07-30T18:45:00Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  },
  {
    id: "CAM-115",
    name: "C.G. Road Shopping District",
    ward: "Navrangpura",
    lat: 23.0360,
    lng: 72.5630,
    status: "online",
    anomaly: "weapon_detected",
    stream_url: "https://stream.surveillance.amd.gov.in/cam-115",
    last_ping: "2026-07-30T18:44:45Z",
    resolution: "4K UHD",
    camera_type: "ptz"
  },
  {
    id: "CAM-116",
    name: "Ellisbridge Town Hall Junction",
    ward: "Ellisbridge",
    lat: 23.0230,
    lng: 72.5600,
    status: "online",
    anomaly: null,
    stream_url: "https://stream.surveillance.amd.gov.in/cam-116",
    last_ping: "2026-07-30T18:45:10Z",
    resolution: "1080p FHD",
    camera_type: "fixed"
  }
];

// 8 Patrol Units with Callsigns, Speeds, Ward Assignments, & Officer Crews
export const mockPatrolUnits: PatrolUnit[] = [
  {
    id: "PU-01",
    callsign: "CHETAK-1",
    vehicle_type: "car",
    status: "dispatched",
    lat: 23.0320,
    lng: 72.5590,
    speed: 48,
    assigned_ward: "Navrangpura",
    assigned_case_id: "FIR-2026-0042",
    officers: ["Inspector V. Jadeja", "Constable R. Patel"],
    fuel_level: 85,
    contact_number: "+91 98765 00001"
  },
  {
    id: "PU-02",
    callsign: "EAGLE-3",
    vehicle_type: "bike",
    status: "dispatched",
    lat: 23.0270,
    lng: 72.5920,
    speed: 62,
    assigned_ward: "Kalupur (Walled City)",
    assigned_case_id: "FIR-2026-0089",
    officers: ["Sub-Inspector A. Shah"],
    fuel_level: 90,
    contact_number: "+91 98765 00002"
  },
  {
    id: "PU-03",
    callsign: "FALCON-2",
    vehicle_type: "car",
    status: "patrolling",
    lat: 23.0230,
    lng: 72.5210,
    speed: 28,
    assigned_ward: "Satellite",
    officers: ["Inspector S. Varma", "Constable M. Solanki"],
    fuel_level: 72,
    contact_number: "+91 98765 00003"
  },
  {
    id: "PU-04",
    callsign: "RANGER-4",
    vehicle_type: "van",
    status: "dispatched",
    lat: 23.0070,
    lng: 72.5810,
    speed: 40,
    assigned_ward: "Jamalpur",
    assigned_case_id: "FIR-2026-0112",
    officers: ["Inspector K. Rathod", "Constable P. Joshi", "Constable D. Parmar"],
    fuel_level: 64,
    contact_number: "+91 98765 00004"
  },
  {
    id: "PU-05",
    callsign: "SABARMATI-1",
    vehicle_type: "car",
    status: "patrolling",
    lat: 23.0530,
    lng: 72.5780,
    speed: 32,
    assigned_ward: "Shahibaug",
    officers: ["Inspector H. Trivedi", "Constable N. Chavda"],
    fuel_level: 95,
    contact_number: "+91 98765 00005"
  },
  {
    id: "PU-06",
    callsign: "VIKRAM-5",
    vehicle_type: "bike",
    status: "patrolling",
    lat: 23.0010,
    lng: 72.6040,
    speed: 35,
    assigned_ward: "Maninagar",
    officers: ["Sub-Inspector B. Zala"],
    fuel_level: 80,
    contact_number: "+91 98765 00006"
  },
  {
    id: "PU-07",
    callsign: "CHEETAH-1",
    vehicle_type: "bike",
    status: "patrolling",
    lat: 23.0450,
    lng: 72.6450,
    speed: 42,
    assigned_ward: "Nikol",
    officers: ["Sub-Inspector K. Patel"],
    fuel_level: 88,
    contact_number: "+91 98765 00007"
  },
  {
    id: "PU-08",
    callsign: "BRAVO-3",
    vehicle_type: "car",
    status: "dispatched",
    lat: 23.0250,
    lng: 72.5550,
    speed: 54,
    assigned_ward: "Ellisbridge",
    assigned_case_id: "FIR-2026-0178",
    officers: ["Inspector D. Mehta", "Constable A. Joshi"],
    fuel_level: 78,
    contact_number: "+91 98765 00008"
  }
];

// Mock OSRM Dispatch Routes
export const mockDispatchRoutes: DispatchRoute[] = [
  {
    id: "ROUTE-101",
    unitId: "PU-01",
    unitCallsign: "CHETAK-1",
    incidentId: "FIR-2026-0042",
    incidentTitle: "Armed Robbery Attempt at C.G. Road",
    etaMinutes: 3,
    distanceKm: 1.4,
    coordinates: [
      [23.0320, 72.5590],
      [23.0335, 72.5615],
      [23.0360, 72.5630],
      [23.0380, 72.5640]
    ]
  },
  {
    id: "ROUTE-102",
    unitId: "PU-02",
    unitCallsign: "EAGLE-3",
    incidentId: "FIR-2026-0089",
    incidentTitle: "Public Commotion near Relief Road",
    etaMinutes: 4,
    distanceKm: 1.8,
    coordinates: [
      [23.0270, 72.5920],
      [23.0280, 72.5950],
      [23.0295, 72.5980]
    ]
  },
  {
    id: "ROUTE-103",
    unitId: "PU-04",
    unitCallsign: "RANGER-4",
    incidentId: "FIR-2026-0112",
    incidentTitle: "Suspicious Vehicle Flare at Jamalpur Gate",
    etaMinutes: 2,
    distanceKm: 0.9,
    coordinates: [
      [23.0070, 72.5810],
      [23.0090, 72.5825],
      [23.0115, 72.5840]
    ]
  },
  {
    id: "ROUTE-104",
    unitId: "PU-08",
    unitCallsign: "BRAVO-3",
    incidentId: "FIR-2026-0178",
    incidentTitle: "Extortion Attempt on Builder",
    etaMinutes: 5,
    distanceKm: 2.3,
    coordinates: [
      [23.0250, 72.5550],
      [23.0248, 72.5570],
      [23.0245, 72.5585]
    ]
  }
];

// Incident Heatmap Points across Ahmedabad Wards
export const mockHeatmapPoints: HeatmapPoint[] = [
  // Navrangpura & Ellisbridge Cluster
  { lat: 23.0380, lng: 72.5640, intensity: 0.95 },
  { lat: 23.0370, lng: 72.5620, intensity: 0.88 },
  { lat: 23.0390, lng: 72.5660, intensity: 0.82 },
  { lat: 23.0245, lng: 72.5585, intensity: 0.90 },
  { lat: 23.0230, lng: 72.5600, intensity: 0.75 },
  { lat: 23.0260, lng: 72.5570, intensity: 0.85 },

  // Kalupur & Jamalpur Walled City Cluster
  { lat: 23.0295, lng: 72.5980, intensity: 1.00 },
  { lat: 23.0310, lng: 72.5950, intensity: 0.92 },
  { lat: 23.0280, lng: 72.6000, intensity: 0.89 },
  { lat: 23.0115, lng: 72.5840, intensity: 0.96 },
  { lat: 23.0130, lng: 72.5860, intensity: 0.80 },

  // Paldi & Maninagar Cluster
  { lat: 23.0090, lng: 72.5610, intensity: 0.70 },
  { lat: 23.0060, lng: 72.5580, intensity: 0.65 },
  { lat: 22.9975, lng: 72.6010, intensity: 0.58 },
  { lat: 23.0000, lng: 72.5990, intensity: 0.52 },

  // Satellite & Vastrapur Cluster
  { lat: 23.0265, lng: 72.5090, intensity: 0.45 },
  { lat: 23.0360, lng: 72.5290, intensity: 0.35 },
  { lat: 23.0320, lng: 72.5250, intensity: 0.30 },

  // Nikol Cluster
  { lat: 23.0440, lng: 72.6480, intensity: 0.78 },
  { lat: 23.0460, lng: 72.6510, intensity: 0.72 }
];

export const mockHotspotPoints = mockHeatmapPoints;

// BNS (Bharatiya Nyaya Sanhita 2023) ↔ IPC Section Legal Dictionary
export const mockLegalSections: LegalSection[] = [
  {
    id: "LEG-001",
    bns_section: "Section 303(2)",
    bns_code: "BNS-303(2)",
    bns_title: "Theft of Property",
    ipc_section: "IPC Section 379",
    ipc_equivalent: "IPC-379",
    ipc_title: "Punishment for Theft",
    category: "Property Offences",
    description: "Dishonest movement of movable property out of possession of any person without consent.",
    punishment: "Imprisonment up to 3 years, or fine, or both.",
    penalty: "Imprisonment up to 3 years, or fine, or both.",
    bailable: true,
    cognizable: true,
    compoundable: true
  },
  {
    id: "LEG-002",
    bns_section: "Section 305",
    bns_code: "BNS-305",
    bns_title: "Theft in Dwelling House or Building",
    ipc_section: "IPC Section 380",
    ipc_equivalent: "IPC-380",
    ipc_title: "Theft in Dwelling House",
    category: "Property Offences",
    description: "Theft committed in any building, tent or vessel used as human dwelling or custody of property.",
    punishment: "Imprisonment up to 7 years and fine.",
    penalty: "Imprisonment up to 7 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-003",
    bns_section: "Section 309",
    bns_code: "BNS-309",
    bns_title: "Robbery",
    ipc_section: "IPC Section 392",
    ipc_equivalent: "IPC-392",
    ipc_title: "Punishment for Robbery",
    category: "Violent Crimes",
    description: "Theft accompanied by hurt, wrongful restraint, or fear of instant death.",
    punishment: "Rigorously up to 10 years and fine (14 years if on highway).",
    penalty: "Rigorously up to 10 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-004",
    bns_section: "Section 318(4)",
    bns_code: "BNS-318(4)",
    bns_title: "Cheating and Fraudulent Inducement",
    ipc_section: "IPC Section 420",
    ipc_equivalent: "IPC-420",
    ipc_title: "Cheating and dishonestly inducing delivery of property",
    category: "Cyber & Financial Fraud",
    description: "Cheating and thereby dishonestly inducing person to deliver property or make/alter valuable security.",
    punishment: "Imprisonment up to 7 years and fine.",
    penalty: "Imprisonment up to 7 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-005",
    bns_section: "Section 103(1)",
    bns_code: "BNS-103(1)",
    bns_title: "Murder",
    ipc_section: "IPC Section 302",
    ipc_equivalent: "IPC-302",
    ipc_title: "Punishment for Murder",
    category: "Offences Affecting Life",
    description: "Culpable homicide causing death with intention of causing death or bodily injury.",
    punishment: "Death penalty or imprisonment for life, and fine.",
    penalty: "Death penalty or imprisonment for life, and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-006",
    bns_section: "Section 115(2)",
    bns_code: "BNS-115(2)",
    bns_title: "Voluntarily Causing Hurt",
    ipc_section: "IPC Section 323",
    ipc_equivalent: "IPC-323",
    ipc_title: "Punishment for Voluntarily Causing Hurt",
    category: "Offences Affecting Body",
    description: "Doing an act with intention of causing hurt to any person.",
    punishment: "Imprisonment up to 1 year, or fine up to ₹10,000, or both.",
    penalty: "Imprisonment up to 1 year, or fine up to ₹10,000, or both.",
    bailable: true,
    cognizable: true,
    compoundable: true
  },
  {
    id: "LEG-007",
    bns_section: "Section 74",
    bns_code: "BNS-74",
    bns_title: "Assault to Outrage Modesty of Woman",
    ipc_section: "IPC Section 354",
    ipc_equivalent: "IPC-354",
    ipc_title: "Assault or criminal force to woman with intent to outrage modesty",
    category: "Offences Against Women",
    description: "Assaulting or using criminal force against any woman intending to outrage modesty.",
    punishment: "Imprisonment 1 to 5 years and fine.",
    penalty: "Imprisonment 1 to 5 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-008",
    bns_section: "Section 308(2)",
    bns_code: "BNS-308(2)",
    bns_title: "Extortion",
    ipc_section: "IPC Section 384",
    ipc_equivalent: "IPC-384",
    ipc_title: "Punishment for Extortion",
    category: "Property Offences",
    description: "Intentionally putting any person in fear of injury to extract property or valuable security.",
    punishment: "Imprisonment up to 7 years, or fine, or both.",
    penalty: "Imprisonment up to 7 years, or fine, or both.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-009",
    bns_section: "Section 140(2)",
    bns_code: "BNS-140(2)",
    bns_title: "Kidnapping",
    ipc_section: "IPC Section 363",
    ipc_equivalent: "IPC-363",
    ipc_title: "Punishment for Kidnapping",
    category: "Offences Affecting Body",
    description: "Kidnapping any person from India or from lawful guardianship.",
    punishment: "Imprisonment up to 7 years and fine.",
    penalty: "Imprisonment up to 7 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-010",
    bns_section: "Section 331(4)",
    bns_code: "BNS-331(4)",
    bns_title: "House-breaking by Night",
    ipc_section: "IPC Section 457",
    ipc_equivalent: "IPC-457",
    ipc_title: "Lurking house-trespass or house-breaking by night",
    category: "Property Offences",
    description: "Committing lurking house-trespass or house-breaking by night in order to commit offence punishable with imprisonment.",
    punishment: "Imprisonment up to 5 years and fine (14 years if theft intended).",
    penalty: "Imprisonment up to 5 years and fine.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-011",
    bns_section: "Section 111",
    bns_code: "BNS-111",
    bns_title: "Organized Crime Syndicate",
    ipc_section: "IPC Section 120B / MCOCA Special",
    ipc_equivalent: "IPC-120B",
    ipc_title: "Criminal Conspiracy & Organized Crime",
    category: "Organized & Syndicate Crime",
    description: "Continuing unlawful activity including extortion, land grabbing, cybercrime, or trafficking by organized crime syndicate.",
    punishment: "Life imprisonment or death penalty if death results, fine min ₹5 Lakh.",
    penalty: "Life imprisonment or death penalty, fine min ₹5 Lakh.",
    bailable: false,
    cognizable: true,
    compoundable: false
  },
  {
    id: "LEG-012",
    bns_section: "Section 281",
    bns_code: "BNS-281",
    bns_title: "Rash Driving on Public Way",
    ipc_section: "IPC Section 279",
    ipc_equivalent: "IPC-279",
    ipc_title: "Rash driving or riding on a public way",
    category: "Public Safety",
    description: "Driving vehicle or riding on any public way in a manner so rash or negligent as to endanger human life.",
    punishment: "Imprisonment up to 6 months, or fine up to ₹1,000, or both.",
    penalty: "Imprisonment up to 6 months, or fine up to ₹1,000, or both.",
    bailable: true,
    cognizable: true,
    compoundable: false
  }
];

export const mockBnsSections = mockLegalSections;

// 10 Officers Covering All 5 Roles
export const mockOfficers: Officer[] = [
  {
    id: "OFF-001",
    badge_no: "GJ-AMD-0010",
    name: "DCP Vikramaditya Sharma",
    role: "dcp",
    ps_id: "PS-HQ-01",
    ps_name: "Ahmedabad City Police HQ",
    email: "dcp.zone1@gujaratpolice.gov.in",
    phone: "+91 98765 43200",
    status: "on_duty",
    rank: "Deputy Commissioner of Police",
    avatar_url: "/avatars/dcp_sharma.png"
  },
  {
    id: "OFF-002",
    badge_no: "GJ-AMD-1002",
    name: "Inspector Vikram Jadeja",
    role: "sho",
    ps_id: "PS-NAV-01",
    ps_name: "Navrangpura Police Station",
    email: "v.jadeja@gujaratpolice.gov.in",
    phone: "+91 98765 43210",
    status: "on_duty",
    rank: "Senior Police Inspector (SHO)",
    avatar_url: "/avatars/insp_jadeja.png"
  },
  {
    id: "OFF-003",
    badge_no: "GJ-AMD-1003",
    name: "Inspector Sunita Varma",
    role: "sho",
    ps_id: "PS-SAT-04",
    ps_name: "Satellite Police Station",
    email: "s.varma@gujaratpolice.gov.in",
    phone: "+91 98765 43215",
    status: "on_duty",
    rank: "Police Inspector (SHO)",
    avatar_url: "/avatars/insp_varma.png"
  },
  {
    id: "OFF-004",
    badge_no: "GJ-AMD-2041",
    name: "Sub-Inspector Anita Roy",
    role: "io",
    ps_id: "PS-NAV-01",
    ps_name: "Navrangpura Police Station",
    email: "a.roy@gujaratpolice.gov.in",
    phone: "+91 98765 43211",
    status: "on_duty",
    rank: "Sub-Inspector (Investigating Officer)",
    avatar_url: "/avatars/si_roy.png"
  },
  {
    id: "OFF-005",
    badge_no: "GJ-AMD-2042",
    name: "Sub-Inspector Anand Shah",
    role: "io",
    ps_id: "PS-KAL-02",
    ps_name: "Kalupur Police Station",
    email: "a.shah@gujaratpolice.gov.in",
    phone: "+91 98765 43219",
    status: "on_duty",
    rank: "Sub-Inspector (Investigating Officer)"
  },
  {
    id: "OFF-006",
    badge_no: "GJ-AMD-5012",
    name: "Constable Rahul Verma",
    role: "constable",
    ps_id: "PS-NAV-01",
    ps_name: "Navrangpura Police Station",
    email: "r.verma@gujaratpolice.gov.in",
    phone: "+91 98765 43212",
    status: "on_duty",
    rank: "Head Constable"
  },
  {
    id: "OFF-007",
    badge_no: "GJ-AMD-5015",
    name: "Constable Mahesh Solanki",
    role: "constable",
    ps_id: "PS-SAT-04",
    ps_name: "Satellite Police Station",
    email: "m.solanki@gujaratpolice.gov.in",
    phone: "+91 98765 43222",
    status: "on_duty",
    rank: "Police Constable"
  },
  {
    id: "OFF-008",
    badge_no: "GJ-AMD-1009",
    name: "Inspector Harshad Trivedi",
    role: "sho",
    ps_id: "PS-SHA-09",
    ps_name: "Shahibaug Police Station",
    email: "h.trivedi@gujaratpolice.gov.in",
    phone: "+91 98765 43250",
    status: "active",
    rank: "Police Inspector"
  },
  {
    id: "OFF-009",
    badge_no: "GJ-AMD-9999",
    name: "Priya Desai (Systems Admin)",
    role: "admin",
    ps_id: "PS-HQ-01",
    ps_name: "Command & Control Center",
    email: "admin.samraksha@gujaratpolice.gov.in",
    phone: "+91 98765 43999",
    status: "active",
    rank: "Senior System Administrator"
  },
  {
    id: "OFF-010",
    badge_no: "GJ-AMD-2050",
    name: "Sub-Inspector Bhavesh Zala",
    role: "io",
    ps_id: "PS-MAN-07",
    ps_name: "Maninagar Police Station",
    email: "b.zala@gujaratpolice.gov.in",
    phone: "+91 98765 43265",
    status: "on_duty",
    rank: "Sub-Inspector"
  }
];

// Analytics & Trends Data
export const mockAnalyticsData: AnalyticsData = {
  crimeCategories: [
    { category: "Theft & Burglary", count: 87, percentage: 35.1, monthlyChange: -2.4 },
    { category: "Robbery & Extortion", count: 44, percentage: 17.7, monthlyChange: +1.2 },
    { category: "Cybercrime & Fraud", count: 38, percentage: 15.3, monthlyChange: +5.8 },
    { category: "Violent Assault & Riot", count: 30, percentage: 12.1, monthlyChange: -0.9 },
    { category: "Narcotics Trafficking", count: 25, percentage: 10.1, monthlyChange: +3.4 },
    { category: "Traffic Accidents & Hit-and-Run", count: 24, percentage: 9.7, monthlyChange: -1.1 }
  ],
  timeOfDayTrends: [
    { hour: "00:00 - 02:00", incidentCount: 42, riskLevel: "critical" },
    { hour: "02:00 - 04:00", incidentCount: 38, riskLevel: "critical" },
    { hour: "04:00 - 06:00", incidentCount: 18, riskLevel: "medium" },
    { hour: "06:00 - 08:00", incidentCount: 12, riskLevel: "low" },
    { hour: "08:00 - 10:00", incidentCount: 22, riskLevel: "medium" },
    { hour: "10:00 - 12:00", incidentCount: 29, riskLevel: "medium" },
    { hour: "12:00 - 14:00", incidentCount: 26, riskLevel: "medium" },
    { hour: "14:00 - 16:00", incidentCount: 31, riskLevel: "high" },
    { hour: "16:00 - 18:00", incidentCount: 35, riskLevel: "high" },
    { hour: "18:00 - 20:00", incidentCount: 48, riskLevel: "critical" },
    { hour: "20:00 - 22:00", incidentCount: 56, riskLevel: "critical" },
    { hour: "22:00 - 00:00", incidentCount: 51, riskLevel: "critical" }
  ],
  monthlyTrends: [
    { month: "Aug 2025", totalCases: 210, resolvedCases: 175, pendingCases: 35, chargesheeted: 160 },
    { month: "Sep 2025", totalCases: 225, resolvedCases: 190, pendingCases: 35, chargesheeted: 172 },
    { month: "Oct 2025", totalCases: 240, resolvedCases: 202, pendingCases: 38, chargesheeted: 185 },
    { month: "Nov 2025", totalCases: 215, resolvedCases: 188, pendingCases: 27, chargesheeted: 170 },
    { month: "Dec 2025", totalCases: 255, resolvedCases: 210, pendingCases: 45, chargesheeted: 192 },
    { month: "Jan 2026", totalCases: 230, resolvedCases: 198, pendingCases: 32, chargesheeted: 180 },
    { month: "Feb 2026", totalCases: 205, resolvedCases: 180, pendingCases: 25, chargesheeted: 165 },
    { month: "Mar 2026", totalCases: 220, resolvedCases: 192, pendingCases: 28, chargesheeted: 175 },
    { month: "Apr 2026", totalCases: 235, resolvedCases: 200, pendingCases: 35, chargesheeted: 182 },
    { month: "May 2026", totalCases: 250, resolvedCases: 212, pendingCases: 38, chargesheeted: 195 },
    { month: "Jun 2026", totalCases: 242, resolvedCases: 205, pendingCases: 37, chargesheeted: 188 },
    { month: "Jul 2026", totalCases: 248, resolvedCases: 210, pendingCases: 38, chargesheeted: 190 }
  ],
  wardDistribution: [
    { wardName: "Kalupur (Walled City)", count: 48 },
    { wardName: "Ellisbridge", count: 36 },
    { wardName: "Jamalpur", count: 32 },
    { wardName: "Navrangpura", count: 28 },
    { wardName: "Nikol", count: 26 },
    { wardName: "Paldi", count: 22 },
    { wardName: "Maninagar", count: 18 },
    { wardName: "Satellite", count: 14 },
    { wardName: "Shahibaug", count: 10 },
    { wardName: "Vastrapur", count: 6 },
    { wardName: "Bodakdev", count: 5 },
    { wardName: "Thaltej", count: 3 }
  ],
  totalIncidentsThisMonth: 248,
  clearanceRatePercentage: 84.6,
  avgResponseTimeMinutes: 4.2
};

// Station Settings & System Parameters
export const mockStationSettings: StationSettings = {
  stationId: "PS-AMD-001",
  stationName: "Navrangpura Police Station & Command Center",
  name: "Navrangpura Police Station",
  district: "Ahmedabad City Zone 1",
  stationCode: "AMD-Z1-NAV",
  shoName: "Inspector Vikram Jadeja",
  shoContact: "+91 98765 43210",
  email: "ps.navrangpura@gujaratpolice.gov.in",
  totalOfficers: 48,
  activeVehicles: 12,
  cctvCount: 186,
  cctnsSyncStatus: "synced",
  lastCctnsSync: "2026-07-30T18:30:00Z",
  emergencyAlertsEnabled: true,
  darkThemeDefault: true,
  autoDispatchRadiusKm: 3.5,
  jurisdictionWards: ["Navrangpura", "Ellisbridge", "Paldi", "Vastrapur"],
  activeUnitsCount: 8,
  cctvOnlineCount: 178,
  emergencyMode: false,
  cctnsSyncEnabled: true,
  lastSyncTimestamp: "2026-07-30T18:30:00Z"
};

// Audit Trail Logs
export const mockAuditLogs: AuditLog[] = [
  {
    id: "AUD-1001",
    timestamp: "2026-07-30T18:40:12Z",
    officer_id: "OFF-002",
    officer_name: "Inspector Vikram Jadeja",
    action: "DISPATCH_PATROL_UNIT",
    target: "PU-01 (CHETAK-1) -> FIR-2026-0042",
    ip_address: "10.240.12.45",
    status: "success",
    details: "Dispatched CHETAK-1 to armed robbery incident scene."
  },
  {
    id: "AUD-1002",
    timestamp: "2026-07-30T18:30:00Z",
    officer_id: "OFF-009",
    officer_name: "Priya Desai (Systems Admin)",
    action: "CCTNS_DATABASE_SYNC",
    target: "CCTNS National Portal",
    ip_address: "10.240.10.2",
    status: "success",
    details: "Synchronized 14 local FIR records with state CCTNS database."
  },
  {
    id: "AUD-1003",
    timestamp: "2026-07-30T18:15:22Z",
    officer_id: "OFF-004",
    officer_name: "Sub-Inspector Anita Roy",
    action: "CREATE_CASE_FIR",
    target: "FIR-2026-0042",
    ip_address: "10.240.12.50",
    status: "success",
    details: "Registered new FIR under BNS Sections 309 & 311."
  },
  {
    id: "AUD-1004",
    timestamp: "2026-07-30T17:45:00Z",
    officer_id: "OFF-002",
    officer_name: "Inspector Vikram Jadeja",
    action: "TRIGGER_CCTV_ANOMALY",
    target: "CAM-101 (Ashram Rd)",
    ip_address: "10.240.12.45",
    status: "flagged",
    details: "AI face match trigger confirmed for suspect #GJ-8842."
  },
  {
    id: "AUD-1005",
    timestamp: "2026-07-30T16:20:10Z",
    officer_id: "OFF-001",
    officer_name: "DCP Vikramaditya Sharma",
    action: "ROLE_PERMISSIONS_UPDATE",
    target: "Sub-Inspector Anita Roy (OFF-004)",
    ip_address: "10.240.10.1",
    status: "success",
    details: "Granted Cyber Cell investigation supervisor privilege."
  },
  {
    id: "AUD-1006",
    timestamp: "2026-07-30T15:10:05Z",
    officer_id: "OFF-005",
    officer_name: "Sub-Inspector Anand Shah",
    action: "ADD_DIARY_NOTE",
    target: "FIR-2026-0089",
    ip_address: "10.240.14.12",
    status: "success",
    details: "Added forensic evidence note to commercial burglary diary."
  },
  {
    id: "AUD-1007",
    timestamp: "2026-07-30T14:00:00Z",
    officer_id: "OFF-009",
    officer_name: "Priya Desai (Systems Admin)",
    action: "STATION_CONFIG_UPDATE",
    target: "Emergency Alert Broadcast Settings",
    ip_address: "10.240.10.2",
    status: "success",
    details: "Updated auto-dispatch perimeter radius to 3.5 km."
  },
  {
    id: "AUD-1008",
    timestamp: "2026-07-30T12:30:15Z",
    officer_id: "OFF-008",
    officer_name: "Inspector Harshad Trivedi",
    action: "CLOSE_CASE_FILE",
    target: "FIR-2026-0220",
    ip_address: "10.240.18.8",
    status: "success",
    details: "Case closed after mutual compromise recorded in digital diary."
  },
  {
    id: "AUD-1009",
    timestamp: "2026-07-30T11:00:00Z",
    officer_id: "SYSTEM",
    officer_name: "Automated AI Engine",
    action: "PREDICTIVE_HOTSPOT_ALERT",
    target: "W06 Kalupur (Walled City)",
    ip_address: "127.0.0.1",
    status: "success",
    details: "Generated night patrol priority alert for Kalupur ward."
  },
  {
    id: "AUD-1010",
    timestamp: "2026-07-30T09:15:00Z",
    officer_id: "OFF-006",
    officer_name: "Constable Rahul Verma",
    action: "LOGIN_ATTEMPT",
    target: "Samraksha Terminal #04",
    ip_address: "10.240.12.88",
    status: "success",
    details: "Authenticated via Badge GJ-AMD-5012."
  }
];

// Sample Chat History for CrimeGPT Assistant
export const mockCrimeGptHistory: CrimeGptMessage[] = [
  {
    id: "MSG-001",
    sender: "user",
    text: "What are the legal provisions for night commercial burglary under Bharatiya Nyaya Sanhita?",
    timestamp: "2026-07-30T18:00:00Z"
  },
  {
    id: "MSG-002",
    sender: "assistant",
    text: "Under the Bharatiya Nyaya Sanhita (BNS) 2023:\n\n1. **BNS Section 305**: Theft in any building, tent, or vessel used as human dwelling or custody of property (Equivalent to IPC Section 380).\n2. **BNS Section 331(4)**: Lurking house-trespass or house-breaking by night in order to commit an offence (Equivalent to IPC Section 457).\n\n**Recommended Protocol**:\n- Secure all entry point CCTV feeds immediately within 500m radius.\n- Collect fingerprint samples from locks/registers.\n- File FIR with non-bailable, cognizable warrants.",
    timestamp: "2026-07-30T18:00:02Z",
    citedSections: ["BNS Section 305", "BNS Section 331(4)", "IPC Section 380", "IPC Section 457"],
    suggestedActions: ["Dispatch PCR Van to scene", "Request ANPR camera log search", "Generate Chargesheet Draft"]
  }
];

// Legal Document Templates
export const mockDocumentTemplates: DocumentTemplate[] = [
  {
    id: "TMP-01",
    title: "Official First Information Report (FIR) Copy",
    type: "fir_copy",
    description: "Standardized Form 1 FIR document in BNS 2023 format with digital officer signature."
  },
  {
    id: "TMP-02",
    title: "Investigation Chargesheet (BNS Form 173)",
    type: "chargesheet",
    description: "Final investigation report for submission to Metropolitan Magistrate Court."
  },
  {
    id: "TMP-03",
    title: "Police Remand Application",
    type: "remand_application",
    description: "Formal police custody extension petition with evidence justification."
  },
  {
    id: "TMP-04",
    title: "Search & Seizure Warrant Request",
    type: "search_warrant",
    description: "Emergency search authorization warrant under BNS Section 185."
  },
  {
    id: "TMP-05",
    title: "Bail Objection Petition",
    type: "bail_objection",
    description: "Legal opposition memorandum filed by Public Prosecutor against bail."
  }
];

// Multilingual Translation Items
export const mockTranslationSamples: TranslationItem[] = [
  {
    id: "TR-01",
    originalText: "The suspect was wearing a black jacket and fled towards Kalupur Railway Station on a motorcycle.",
    sourceLang: "en",
    translatedText: "આશંકાસ્પદ શખ્સ કાળા રંગનું જેકેટ પહેરેલું હતું અને મોટરસાઇકલ પર કાલુપુર રેલ્વે સ્ટેશન તરફ ભાગી ગયો હતો.",
    targetLang: "gu",
    confidence: 0.98
  },
  {
    id: "TR-02",
    originalText: "દુકાનનો તાળું તોડીને ૪.૫ લાખ રૂપિયાની ચોરી કરવામાં આવી છે.",
    sourceLang: "gu",
    translatedText: "The shop lock was broken and 4.5 Lakh rupees were stolen.",
    targetLang: "en",
    confidence: 0.96
  },
  {
    id: "TR-03",
    originalText: "પીસીઆર વાન ઘટનાસ્થળે ૫ મિનિટમાં પહોંચી ગઈ હતી.",
    sourceLang: "gu",
    translatedText: "पीसीआर वैन 5 मिनट में घटनास्थल पर पहुंच गई थी।",
    targetLang: "hi",
    confidence: 0.97
  }
];

// Executive KPI Summary Data
export const mockExecutiveKpiStats: ExecutiveKpiStats = {
  totalFirsToday: 14,
  activePatrolsCount: 8,
  highRiskWardsCount: 4,
  activeCctvAnomalies: 5,
  pendingInvestigations: 28,
  clearanceRate: 84.6
};
