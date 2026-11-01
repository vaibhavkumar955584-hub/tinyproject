import type { ProfileInput, RequirementType, Verdict } from '@tenderguard/shared';

export interface TenderRequirementItem {
  id: string;
  type: RequirementType;
  valueJson: Record<string, unknown>;
  sourceUrl: string;
  sourceQuote: string;
  confidence: number;
}

export interface TenderOpportunity {
  id: string;
  source: 'CPPP' | 'GEM';
  sourceTenderId: string;
  url: string;
  title: string;
  department: string;
  location: string;
  estimatedValueInr: number;
  emdInr: number;
  publishedAt: string;
  closingAt: string;
  rawText: string;
  fetchStatus: 'OK' | 'FETCH_FAILED' | 'NEEDS_MANUAL_STEP';
  requirements: TenderRequirementItem[];
  matchScore: number;
  verdict: Verdict;
  summary: string;
  disqualificationRisks: string[];
  recommendations: string[];
  isWatched?: boolean;
}

export interface CorrigendumAlert {
  id: string;
  changeType: 'DEADLINE' | 'EMD' | 'CONDITION' | 'OTHER';
  beforeJson: Record<string, unknown>;
  afterJson: Record<string, unknown>;
  verdictBefore: Verdict | null;
  verdictAfter: Verdict | null;
  sentAt: string;
  createdAt: string;
  tender: {
    id: string;
    title: string;
    source: 'CPPP' | 'GEM';
    url: string;
  };
}

export interface AgentLogEntry {
  id: string;
  step: 'DISCOVER' | 'FETCH' | 'EXTRACT' | 'EVALUATE' | 'VERIFY' | 'MONITOR';
  detail: string;
  ts: string;
  portal?: string;
  url?: string;
  confidence?: number;
}

export interface ReadinessDocument {
  id: string;
  name: string;
  category: 'STATUTORY' | 'FINANCIAL' | 'TECHNICAL' | 'LEGAL';
  required: boolean;
  status: 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'MISSING';
  uploadedFile?: { name: string; size: string; date: string } | null;
  reason: string;
  supportingClause?: string;
}

export const DEMO_PROFILE: ProfileInput & {
  companyName: string;
  email: string;
  pan: string;
  gstin: string;
  udyam: string;
} = {
  companyName: 'Apex Infotech Solutions Pvt. Ltd.',
  email: 'procurement@apexinfotech.in',
  pan: 'AABCA1234F',
  gstin: '09AABCA1234F1Z5',
  udyam: 'UDYAM-UP-28-0018921',
  category: 'IT Services & Infrastructure Maintenance',
  state: 'Uttar Pradesh',
  annualTurnoverInr: 3000000,
  experienceYears: 2,
  msmeStatus: 'SMALL',
  certifications: ['ISO 9001', 'Startup India'],
  documentsHeld: [
    'PAN',
    'GST Registration',
    'Udyam Registration',
    'Audited financial statements',
    'Income tax returns',
    'Work completion certificates',
  ],
};

export const DEMO_TENDERS: TenderOpportunity[] = [
  {
    id: 'demo-cppp-001',
    source: 'CPPP',
    sourceTenderId: 'CPPP/2026/PWD/IT-0941',
    url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
    title: 'Managed IT Helpdesk and Endpoint Support Services for District Collectorate & Tehsils',
    department: 'Directorate of Public Works & IT Governance, Government of Uttar Pradesh',
    location: 'Lucknow, Uttar Pradesh',
    estimatedValueInr: 12000000,
    emdInr: 50000,
    publishedAt: '2026-10-20T09:00:00.000Z',
    closingAt: '2026-12-20T10:00:00.000Z',
    matchScore: 95,
    verdict: 'BID',
    summary: 'High suitability for Small MSME. Turnover threshold of ₹15L is well covered by your ₹30L turnover. 1-year past experience matches your 2-year operating history.',
    fetchStatus: 'OK',
    disqualificationRisks: [
      'Bidder must submit certified proof of local support engineer presence within Lucknow within 7 days of contract award.',
    ],
    recommendations: [
      'Claim full EMD waiver under Public Procurement Policy 2012 by submitting valid Udyam Registration Certificate.',
      'Attach audited balance sheets for FY 2023-24 and FY 2024-25 with UDIN stamp to verify turnover.',
    ],
    requirements: [
      {
        id: 'req-1',
        type: 'TURNOVER',
        valueJson: { minimumInr: 1500000, periodYears: 3 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
        confidence: 0.99,
      },
      {
        id: 'req-2',
        type: 'EXPERIENCE',
        valueJson: { minimumYears: 1, field: 'IT helpdesk services' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'The bidder shall have at least 1 year of relevant IT services experience.',
        confidence: 0.98,
      },
      {
        id: 'req-3',
        type: 'DOCUMENT',
        valueJson: { name: 'PAN' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'The bidder shall submit PAN and GST Registration certificates.',
        confidence: 0.99,
      },
      {
        id: 'req-4',
        type: 'DOCUMENT',
        valueJson: { name: 'GST Registration' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'The bidder shall submit PAN and GST Registration certificates.',
        confidence: 0.99,
      },
      {
        id: 'req-5',
        type: 'LOCATION',
        valueJson: { state: 'Uttar Pradesh' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'The bidder shall maintain operational service readiness within Uttar Pradesh.',
        confidence: 0.97,
      },
      {
        id: 'req-6',
        type: 'EMD',
        valueJson: { amountInr: 50000, msmeExemption: true },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
        sourceQuote: 'EMD is Rs. 50,000. Micro and Small Enterprises registered under Udyam are exempted from EMD deposit.',
        confidence: 0.99,
      },
    ],
    rawText: 'Managed IT helpdesk and endpoint support services for Uttar Pradesh. The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years. The bidder shall have at least 1 year of relevant IT services experience. The bidder shall submit PAN and GST Registration certificates. The bidder shall maintain operational service readiness within Uttar Pradesh. EMD is Rs. 50,000. Micro and Small Enterprises registered under Udyam are exempted from EMD deposit. Bids close on 20 December 2026 at 15:30 IST.',
  },
  {
    id: 'demo-cppp-002',
    source: 'CPPP',
    sourceTenderId: 'CPPP/2026/SIU/NET-8820',
    url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
    title: 'Comprehensive Annual Maintenance Contract (AMC) for LAN, Optical Fiber & CCTV Surveillance',
    department: 'State Infrastructure & Homeland Security Unit',
    location: 'Kanpur / Lucknow, Uttar Pradesh',
    estimatedValueInr: 18000000,
    emdInr: 180000,
    publishedAt: '2026-10-25T09:00:00.000Z',
    closingAt: '2026-11-10T10:00:00.000Z',
    matchScore: 78,
    verdict: 'RISKY',
    summary: 'Potentially viable but close financial tolerances. Turnover minimum of ₹28L leaves only a 7% cushion above your ₹30L profile turnover. Corrigendum #1 extended submission to Nov 10.',
    fetchStatus: 'OK',
    disqualificationRisks: [
      'Turnover margin is narrow (₹30L vs ₹28L requirement); any audit discrepancy could trigger technical disqualification.',
      'EMD of ₹1.80L is 6% of your annual turnover; confirm if MSME exemption applies to this homeland security division.',
      'Penalty clause: ₹1,000 per hour for downtime exceeding 4 hours during working days.',
    ],
    recommendations: [
      'Submit CA certificate verifying 3-year turnover calculation strictly adhering to Clause 3.2.',
      'Attend the online pre-bid query window or submit query requesting written confirmation of MSME EMD waiver.',
    ],
    requirements: [
      {
        id: 'req-201',
        type: 'TURNOVER',
        valueJson: { minimumInr: 2800000 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'The bidder shall have average annual turnover of at least Rs. 28 lakh during the last three financial years.',
        confidence: 0.98,
      },
      {
        id: 'req-202',
        type: 'EXPERIENCE',
        valueJson: { minimumYears: 2 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'The bidder shall have at least 2 years of relevant experience in enterprise networking.',
        confidence: 0.99,
      },
      {
        id: 'req-203',
        type: 'CERTIFICATION',
        valueJson: { name: 'ISO 9001' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'The bidder shall submit PAN, GST Registration and a valid ISO 9001 certificate.',
        confidence: 0.99,
      },
      {
        id: 'req-204',
        type: 'DOCUMENT',
        valueJson: { name: 'PAN' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'The bidder shall submit PAN, GST Registration and a valid ISO 9001 certificate.',
        confidence: 0.99,
      },
      {
        id: 'req-205',
        type: 'DOCUMENT',
        valueJson: { name: 'GST Registration' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'The bidder shall submit PAN, GST Registration and a valid ISO 9001 certificate.',
        confidence: 0.99,
      },
      {
        id: 'req-206',
        type: 'EMD',
        valueJson: { amountInr: 180000 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
        sourceQuote: 'EMD is Rs. 1,80,000.',
        confidence: 0.97,
      },
    ],
    rawText: 'Annual network maintenance and CCTV surveillance operations in Uttar Pradesh. The bidder shall have average annual turnover of at least Rs. 28 lakh during the last three financial years. The bidder shall have at least 2 years of relevant experience in enterprise networking. The bidder shall submit PAN, GST Registration and a valid ISO 9001 certificate. EMD is Rs. 1,80,000. Bids close on 10 November 2026 at 15:30 IST.',
  },
  {
    id: 'demo-gem-001',
    source: 'GEM',
    sourceTenderId: 'GEM/2026/B/771092',
    url: 'https://gem.gov.in/show_bid_details/771092',
    title: 'Statewide Enterprise Cloud Network Operations & Data Center NOC Tier-3 Management',
    department: 'National Digital Services Agency & Gujarat Informatics Ltd',
    location: 'Gandhinagar, Gujarat',
    estimatedValueInr: 125000000,
    emdInr: 2500000,
    publishedAt: '2026-10-22T09:00:00.000Z',
    closingAt: '2026-11-30T10:00:00.000Z',
    matchScore: 35,
    verdict: 'DONT_BID',
    summary: 'Hard disqualification across 4 separate criteria. Required turnover is ₹1.00 Cr (your profile: ₹30L). Requires registered office in Gujarat and ISO 27001.',
    fetchStatus: 'OK',
    disqualificationRisks: [
      'Turnover deficit of ₹70 Lakhs — non-waivable requirement under NDSA state guidelines.',
      'Mandatory physical office requirement within Gandhinagar or Ahmedabad with valid Gumastadhara / Shop Act license.',
      'Requires ISO 27001 Information Security Management certification, not listed in your business credentials.',
      'Past project citations: 3 completed projects of ₹40L+ value each for public sector or banking clients.',
    ],
    recommendations: [
      'Do not purchase bid documents or submit EMD. Bids failing mandatory turnover are rejected at pre-qualification stage without financial evaluation.',
      'Bookmark this tender for consortium or sub-contracting opportunities only.',
    ],
    requirements: [
      {
        id: 'req-301',
        type: 'TURNOVER',
        valueJson: { minimumInr: 10000000 },
        sourceUrl: 'https://gem.gov.in/show_bid_details/771092',
        sourceQuote: 'The bidder shall have average annual turnover of at least Rs. 1 crore during the last three financial years.',
        confidence: 0.99,
      },
      {
        id: 'req-302',
        type: 'EXPERIENCE',
        valueJson: { minimumYears: 5 },
        sourceUrl: 'https://gem.gov.in/show_bid_details/771092',
        sourceQuote: 'The bidder shall have at least 5 years of relevant enterprise network experience.',
        confidence: 0.99,
      },
      {
        id: 'req-303',
        type: 'CERTIFICATION',
        valueJson: { name: 'ISO 27001' },
        sourceUrl: 'https://gem.gov.in/show_bid_details/771092',
        sourceQuote: 'The bidder shall hold a current ISO 27001 certificate.',
        confidence: 0.98,
      },
      {
        id: 'req-304',
        type: 'LOCATION',
        valueJson: { state: 'Gujarat' },
        sourceUrl: 'https://gem.gov.in/show_bid_details/771092',
        sourceQuote: 'The bidder shall maintain a registered office in Gujarat.',
        confidence: 0.99,
      },
      {
        id: 'req-305',
        type: 'EMD',
        valueJson: { amountInr: 2500000 },
        sourceUrl: 'https://gem.gov.in/show_bid_details/771092',
        sourceQuote: 'EMD is Rs. 25,00,000.',
        confidence: 0.99,
      },
    ],
    rawText: 'Enterprise network operations across Gujarat. The bidder shall have average annual turnover of at least Rs. 1 crore during the last three financial years. The bidder shall have at least 5 years of relevant enterprise network experience. The bidder shall hold a current ISO 27001 certificate. The bidder shall maintain a registered office in Gujarat. EMD is Rs. 25,00,000. Bids close on 30 November 2026 at 15:30 IST.',
  },
  {
    id: 'demo-gem-002',
    source: 'GEM',
    sourceTenderId: 'GEM/2026/B/814421',
    url: 'https://gem.gov.in/show_bid_details/814421',
    title: 'Comprehensive Annual Maintenance for IT Hardware, Workstations & Biometric Attendance System',
    department: 'All India Institute of Medical Sciences (AIIMS), New Delhi',
    location: 'New Delhi, Delhi NCR',
    estimatedValueInr: 4500000,
    emdInr: 90000,
    publishedAt: '2026-10-26T11:00:00.000Z',
    closingAt: '2026-12-15T14:00:00.000Z',
    matchScore: 88,
    verdict: 'RISKY',
    summary: 'Favorable size (₹45L) and turnover requirement (₹20L). Small risk on OEM Authorization certification for biometric attendance devices.',
    fetchStatus: 'OK',
    disqualificationRisks: [
      'Clause 5.3 mandates OEM Authorization Form (MAF) from biometric hardware manufacturer.',
      'Requires statutory PF and ESIC compliance certificates with last 3 months paid challans.',
    ],
    recommendations: [
      'Obtain OEM Partner Letter from Matrix/Essl prior to bid submission.',
      'Claim MSME exemption on ₹90,000 EMD under GeM MSME verified profile.',
    ],
    requirements: [
      {
        id: 'req-401',
        type: 'TURNOVER',
        valueJson: { minimumInr: 2000000 },
        sourceUrl: 'https://gem.gov.in/show_bid_details/814421',
        sourceQuote: 'The bidder must possess average annual turnover of at least Rs. 20 lakh in last three financial years.',
        confidence: 0.98,
      },
      {
        id: 'req-402',
        type: 'EXPERIENCE',
        valueJson: { minimumYears: 2 },
        sourceUrl: 'https://gem.gov.in/show_bid_details/814421',
        sourceQuote: 'Minimum two years operating experience in IT AMC or facility management services.',
        confidence: 0.97,
      },
      {
        id: 'req-403',
        type: 'CERTIFICATION',
        valueJson: { name: 'OEM Authorization' },
        sourceUrl: 'https://gem.gov.in/show_bid_details/814421',
        sourceQuote: 'Bidder shall submit Manufacturer Authorization Form (MAF) for biometric attendance scanners.',
        confidence: 0.96,
      },
      {
        id: 'req-404',
        type: 'DOCUMENT',
        valueJson: { name: 'EPF Registration' },
        sourceUrl: 'https://gem.gov.in/show_bid_details/814421',
        sourceQuote: 'Proof of EPF and ESI registration is mandatory for all bidders.',
        confidence: 0.98,
      },
      {
        id: 'req-405',
        type: 'EMD',
        valueJson: { amountInr: 90000, msmeExemption: true },
        sourceUrl: 'https://gem.gov.in/show_bid_details/814421',
        sourceQuote: 'EMD is Rs. 90,000. Udyam registered MSE bidders are exempt from bid security.',
        confidence: 0.99,
      },
    ],
    rawText: 'IT hardware and biometric attendance AMC for AIIMS New Delhi. The bidder must possess average annual turnover of at least Rs. 20 lakh in last three financial years. Minimum two years operating experience in IT AMC. Bidder shall submit Manufacturer Authorization Form (MAF) for biometric attendance scanners. Proof of EPF and ESI registration is mandatory. EMD is Rs. 90,000. Udyam registered MSE bidders are exempt. Bids close on 15 December 2026 at 14:00 IST.',
  },
  {
    id: 'demo-cppp-003',
    source: 'CPPP',
    sourceTenderId: 'CPPP/2026/DHE/AV-3904',
    url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
    title: 'Supply, Deployment and Technical Operation of Smart Classroom Digital Podiums & Audio Systems',
    department: 'Department of Higher Education & State Universities Council',
    location: 'Uttar Pradesh (Multiple Campuses)',
    estimatedValueInr: 6500000,
    emdInr: 130000,
    publishedAt: '2026-10-28T10:00:00.000Z',
    closingAt: '2026-12-28T17:00:00.000Z',
    matchScore: 92,
    verdict: 'BID',
    summary: 'Excellent commercial fit. Financial criteria of ₹18L turnover easily satisfied. 1-year experience needed. MSME relaxations in place.',
    fetchStatus: 'OK',
    disqualificationRisks: [
      'Must conduct on-site demonstration of audio echo cancellation within 5 working days of technical bid opening.',
    ],
    recommendations: [
      'Submit sample equipment spec sheets alongside technical proposal.',
      'Avail MSME prior turnover relaxation under rule 173(i) of GFR 2017.',
    ],
    requirements: [
      {
        id: 'req-501',
        type: 'TURNOVER',
        valueJson: { minimumInr: 1800000 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
        sourceQuote: 'Average annual turnover should be minimum Rs. 18 Lakh during last 3 financial years.',
        confidence: 0.99,
      },
      {
        id: 'req-502',
        type: 'EXPERIENCE',
        valueJson: { minimumYears: 1 },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
        sourceQuote: 'The firm should have at least 1 year experience in digital classroom or AV technology integration.',
        confidence: 0.97,
      },
      {
        id: 'req-503',
        type: 'DOCUMENT',
        valueJson: { name: 'GST Registration' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
        sourceQuote: 'Valid GST and PAN registration is mandatory.',
        confidence: 0.99,
      },
      {
        id: 'req-504',
        type: 'LOCATION',
        valueJson: { state: 'Uttar Pradesh' },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
        sourceQuote: 'The firm shall have maintenance workshop or branch office in Uttar Pradesh.',
        confidence: 0.98,
      },
      {
        id: 'req-505',
        type: 'EMD',
        valueJson: { amountInr: 130000, msmeExemption: true },
        sourceUrl: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-DHE-AV-3904',
        sourceQuote: 'EMD amount of Rs. 1,30,000. MSE units are exempted from payment of EMD.',
        confidence: 0.99,
      },
    ],
    rawText: 'Smart classroom digital podiums and audio systems for Uttar Pradesh state universities. Average annual turnover should be minimum Rs. 18 Lakh during last 3 financial years. The firm should have at least 1 year experience in AV technology integration. Valid GST and PAN registration is mandatory. The firm shall have maintenance workshop in Uttar Pradesh. EMD amount of Rs. 1,30,000. MSE units are exempted. Bids close on 28 December 2026 at 17:00 IST.',
  },
];

export const DEMO_ALERTS: CorrigendumAlert[] = [
  {
    id: 'alert-01',
    changeType: 'DEADLINE',
    beforeJson: { closingAt: '2026-11-03T10:00:00.000Z', note: 'Original submission deadline' },
    afterJson: { closingAt: '2026-11-10T10:00:00.000Z', note: 'Extended by 7 days via Corrigendum #1' },
    verdictBefore: 'RISKY',
    verdictAfter: 'RISKY',
    sentAt: '2026-11-01T07:45:00.000Z',
    createdAt: '2026-11-01T07:40:00.000Z',
    tender: {
      id: 'demo-cppp-002',
      title: 'Comprehensive Annual Maintenance Contract (AMC) for LAN, Optical Fiber & CCTV Surveillance',
      source: 'CPPP',
      url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-SIU-NET-8820',
    },
  },
  {
    id: 'alert-02',
    changeType: 'CONDITION',
    beforeJson: { turnoverRequirement: '₹25,00,000 mandatory', clause: 'Section 3.1: Minimum turnover strictly ₹25 Lakhs' },
    afterJson: { turnoverRequirement: '₹15,00,000 for MSME', clause: 'Addendum 1: Relaxed turnover to ₹15 Lakhs for valid Udyam registered MSE units' },
    verdictBefore: 'RISKY',
    verdictAfter: 'BID',
    sentAt: '2026-10-30T14:15:00.000Z',
    createdAt: '2026-10-30T14:10:00.000Z',
    tender: {
      id: 'demo-cppp-001',
      title: 'Managed IT Helpdesk and Endpoint Support Services for District Collectorate & Tehsils',
      source: 'CPPP',
      url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
    },
  },
];

export const DEMO_AGENT_LOGS: AgentLogEntry[] = [
  {
    id: 'log-01',
    step: 'DISCOVER',
    detail: 'Autonomous crawler initialized. Target portal nodes: CPPP (eprocure.gov.in), GeM (gem.gov.in), e-Procurement UP (etender.up.nic.in).',
    ts: '2026-11-01T08:00:10.000Z',
    portal: 'CPPP',
  },
  {
    id: 'log-02',
    step: 'DISCOVER',
    detail: 'Executing structured search query: "IT support helpdesk networking AMC" with location filter "Uttar Pradesh / North Zone".',
    ts: '2026-11-01T08:00:14.000Z',
    portal: 'CPPP',
  },
  {
    id: 'log-03',
    step: 'FETCH',
    detail: 'Navigating to public tender notice CPPP/2026/PWD/IT-0941. Verified SSL cert and SHA-256 portal authenticity.',
    ts: '2026-11-01T08:00:22.000Z',
    portal: 'CPPP',
    url: 'https://eprocure.gov.in/eprocure/app?component=view&tender=CPPP-2026-PWD-IT-0941',
  },
  {
    id: 'log-04',
    step: 'EXTRACT',
    detail: 'Parsing Section IV (Eligibility Criteria & Technical Requirements). Extracted 6 verifiable clauses with verbatim quotes.',
    ts: '2026-11-01T08:00:28.000Z',
    portal: 'CPPP',
    confidence: 0.99,
  },
  {
    id: 'log-05',
    step: 'EVALUATE',
    detail: 'Executing deterministic rule engine against profile: Turnover ₹30L vs Required ₹15L -> PASS (Score: 100). MSME EMD waiver confirmed.',
    ts: '2026-11-01T08:00:33.000Z',
  },
  {
    id: 'log-06',
    step: 'VERIFY',
    detail: 'Quoted evidence verified against raw tender HTML text. 6 of 6 clauses validated with zero hallucination. Match score: 95%.',
    ts: '2026-11-01T08:00:36.000Z',
    confidence: 1.0,
  },
  {
    id: 'log-07',
    step: 'MONITOR',
    detail: 'Corrigendum radar active. Discovered Corrigendum #1 for CPPP/2026/SIU/NET-8820: Submission extended to 10 Nov 2026.',
    ts: '2026-11-01T08:00:41.000Z',
    portal: 'CPPP',
  },
];

export const DEMO_READINESS_DOCS: ReadinessDocument[] = [
  {
    id: 'doc-01',
    name: 'Udyam Registration Certificate',
    category: 'STATUTORY',
    required: true,
    status: 'VERIFIED',
    uploadedFile: { name: 'Apex_Udyam_Small_Enterprise.pdf', size: '1.2 MB', date: 'Oct 15, 2026' },
    reason: 'Required to claim mandatory MSME turnover relaxations and 100% EMD fee exemption.',
    supportingClause: 'Micro and Small Enterprises registered under Udyam are exempted from EMD deposit.',
  },
  {
    id: 'doc-02',
    name: 'GST Registration Certificate (Form GST REG-06)',
    category: 'STATUTORY',
    required: true,
    status: 'VERIFIED',
    uploadedFile: { name: 'GSTIN_09AABCA1234F1Z5_REG06.pdf', size: '840 KB', date: 'Sep 10, 2026' },
    reason: 'Proves statutory tax registration in the state of Uttar Pradesh.',
    supportingClause: 'The bidder shall submit PAN and GST Registration certificates.',
  },
  {
    id: 'doc-03',
    name: 'Audited Financial Statements & CA Turnover Certificate (FY 22-23, 23-24, 24-25)',
    category: 'FINANCIAL',
    required: true,
    status: 'VERIFIED',
    uploadedFile: { name: 'Audited_BalanceSheets_UDIN_Stamped.pdf', size: '4.8 MB', date: 'Oct 28, 2026' },
    reason: 'Validates that average annual turnover meets or exceeds the tender threshold of ₹15 Lakhs.',
    supportingClause: 'The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
  },
  {
    id: 'doc-04',
    name: 'Work Completion Certificates & Past Work Orders (Min 1 Year)',
    category: 'TECHNICAL',
    required: true,
    status: 'VERIFIED',
    uploadedFile: { name: 'UP_State_Projects_Completion_Certs.pdf', size: '2.4 MB', date: 'Oct 12, 2026' },
    reason: 'Documents past successful execution in IT helpdesk/networking services.',
    supportingClause: 'The bidder shall have at least 1 year of relevant IT services experience.',
  },
  {
    id: 'doc-05',
    name: 'Non-Blacklisting & Non-Debarment Affidavit on ₹100 Stamp Paper',
    category: 'LEGAL',
    required: true,
    status: 'PENDING',
    reason: 'Self-declaration attested by Notary Public declaring firm has not been debarred by any Central or State Govt dept.',
    supportingClause: 'The bidder must submit an undertaking affirming they have never been debarred from government procurement.',
  },
  {
    id: 'doc-06',
    name: 'Power of Attorney / Board Resolution for Authorized Signatory',
    category: 'LEGAL',
    required: true,
    status: 'PENDING',
    reason: 'Empowers company director or officer to sign digital bids on CPPP / GeM portal.',
    supportingClause: 'Authorization letter or Power of Attorney in favor of signatory submitting the digital bid.',
  },
  {
    id: 'doc-07',
    name: 'ISO 9001:2015 Quality Management Certificate',
    category: 'TECHNICAL',
    required: false,
    status: 'VERIFIED',
    uploadedFile: { name: 'ISO_9001_Certificate_Valid_2027.pdf', size: '610 KB', date: 'Aug 22, 2026' },
    reason: 'Bonus technical qualification for CPPP tender #2.',
    supportingClause: 'The bidder shall submit PAN, GST Registration and a valid ISO 9001 certificate.',
  },
];

