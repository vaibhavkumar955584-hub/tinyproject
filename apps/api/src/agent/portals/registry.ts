import type { PortalKind } from '@tenderguard/shared';

export interface PortalRegistryEntry {
  id: string;
  name: string;
  kind: PortalKind;
  baseUrl: string;
  domains: string[];
  states: string[];
  sectors: string[];
  publicListUrl: string;
  capabilities: {
    tinyfishSearch: boolean;
    fetch: boolean;
    agentNav: boolean;
  };
  captchaOnSearch: boolean | 'unknown';
  priority: number; // 1 to 5, 5 is highest
  enabled: boolean;
  goalTemplate: string;
  rateLimitPerMin?: number;
}

export const PORTAL_REGISTRY: PortalRegistryEntry[] = [
  {
    id: 'CPPP',
    name: 'Central Public Procurement Portal (CPPP)',
    kind: 'CPPP',
    baseUrl: 'https://eprocure.gov.in',
    domains: ['eprocure.gov.in'],
    states: ['All', 'National'],
    sectors: ['Central Govt', 'PSU', 'Defence', 'All'],
    publicListUrl: 'https://eprocure.gov.in/eprocure/app?page=FrontEndTendersByOrganisation&service=page',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: false,
    priority: 5,
    enabled: true,
    goalTemplate: 'cppp_search_goal',
    rateLimitPerMin: 60,
  },
  {
    id: 'GEM',
    name: 'Government e-Marketplace (GeM)',
    kind: 'GEM',
    baseUrl: 'https://gem.gov.in',
    domains: ['gem.gov.in'],
    states: ['All', 'National'],
    sectors: ['Goods', 'Services', 'All'],
    publicListUrl: 'https://gem.gov.in/bids',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: false,
    priority: 5,
    enabled: true,
    goalTemplate: 'gem_search_goal',
    rateLimitPerMin: 60,
  },
  {
    id: 'GEPNIC_UP',
    name: 'Uttar Pradesh e-Procurement (GePNIC UP)',
    kind: 'GEPNIC',
    baseUrl: 'https://etender.up.nic.in',
    domains: ['etender.up.nic.in'],
    states: ['Uttar Pradesh', 'UP'],
    sectors: ['Public Works', 'Irrigation', 'Police', 'Smart Cities', 'IT'],
    publicListUrl: 'https://etender.up.nic.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 40,
  },
  {
    id: 'GEPNIC_MP',
    name: 'Madhya Pradesh e-Tenders (GePNIC MP)',
    kind: 'GEPNIC',
    baseUrl: 'https://mptenders.gov.in',
    domains: ['mptenders.gov.in'],
    states: ['Madhya Pradesh', 'MP'],
    sectors: ['State Works', 'Health', 'Education', 'IT'],
    publicListUrl: 'https://mptenders.gov.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 40,
  },
  {
    id: 'GEPNIC_MH',
    name: 'Maharashtra e-Tendering (GePNIC MH)',
    kind: 'GEPNIC',
    baseUrl: 'https://mahatenders.gov.in',
    domains: ['mahatenders.gov.in'],
    states: ['Maharashtra', 'MH'],
    sectors: ['Infrastructure', 'Urban Development', 'IT', 'Energy'],
    publicListUrl: 'https://mahatenders.gov.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 40,
  },
  {
    id: 'GEPNIC_TN',
    name: 'Tamil Nadu Tenders (GePNIC TN)',
    kind: 'GEPNIC',
    baseUrl: 'https://tntenders.gov.in',
    domains: ['tntenders.gov.in'],
    states: ['Tamil Nadu', 'TN'],
    sectors: ['Highways', 'Water Supply', 'IT Services', 'Health'],
    publicListUrl: 'https://tntenders.gov.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 40,
  },
  {
    id: 'GEPNIC_WB',
    name: 'West Bengal Tenders (GePNIC WB)',
    kind: 'GEPNIC',
    baseUrl: 'https://wbtenders.gov.in',
    domains: ['wbtenders.gov.in'],
    states: ['West Bengal', 'WB'],
    sectors: ['PWD', 'Municipal Affairs', 'IT'],
    publicListUrl: 'https://wbtenders.gov.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 40,
  },
  {
    id: 'GEPNIC_GJ',
    name: 'Gujarat e-Procurement',
    kind: 'GEPNIC',
    baseUrl: 'https://eproc.gujarat.gov.in',
    domains: ['eproc.gujarat.gov.in', 'tender.nprocure.com'],
    states: ['Gujarat', 'GJ'],
    sectors: ['GIDC', 'Power', 'Roads', 'IT'],
    publicListUrl: 'https://tender.nprocure.com',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: false },
    captchaOnSearch: true,
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 30,
  },
  {
    id: 'GEPNIC_KA',
    name: 'Karnataka Public Procurement (KPPP)',
    kind: 'GEPNIC',
    baseUrl: 'https://kppp.karnataka.gov.in',
    domains: ['kppp.karnataka.gov.in'],
    states: ['Karnataka', 'KA'],
    sectors: ['IT & BT', 'Irrigation', 'Municipal', 'Smart City'],
    publicListUrl: 'https://kppp.karnataka.gov.in/portal-ui/public-tenders',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: false },
    captchaOnSearch: true,
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 30,
  },
  {
    id: 'IREPS',
    name: 'Indian Railways E-Procurement System (IREPS)',
    kind: 'IREPS',
    baseUrl: 'https://ireps.gov.in',
    domains: ['ireps.gov.in'],
    states: ['All', 'National'],
    sectors: ['Railways', 'Rolling Stock', 'Signalling', 'Civil Works', 'Telecom'],
    publicListUrl: 'https://ireps.gov.in/eps/search.do',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: false,
    priority: 4,
    enabled: true,
    goalTemplate: 'ireps_search_goal',
    rateLimitPerMin: 45,
  },
  {
    id: 'DEFENCE',
    name: 'Defence eProcurement Portal',
    kind: 'DEFENCE',
    baseUrl: 'https://defproc.gov.in',
    domains: ['defproc.gov.in'],
    states: ['All', 'National'],
    sectors: ['Armed Forces', 'Ordnance', 'DRDO', 'Security', 'Electronics'],
    publicListUrl: 'https://defproc.gov.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 4,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 30,
  },
  {
    id: 'PSU_IOCL',
    name: 'Indian Oil e-Tenders',
    kind: 'PSU',
    baseUrl: 'https://iocletenders.nic.in',
    domains: ['iocletenders.nic.in'],
    states: ['All', 'National'],
    sectors: ['Oil & Gas', 'Pipelines', 'Refineries', 'IT Services'],
    publicListUrl: 'https://iocletenders.nic.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 3,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 30,
  },
  {
    id: 'PSU_NTPC',
    name: 'NTPC e-Procurement Portal',
    kind: 'PSU',
    baseUrl: 'https://eprocurentpc.nic.in',
    domains: ['eprocurentpc.nic.in'],
    states: ['All', 'National'],
    sectors: ['Power', 'Renewable Energy', 'Thermal', 'Turbines', 'IT'],
    publicListUrl: 'https://eprocurentpc.nic.in/nicgep/app',
    capabilities: { tinyfishSearch: true, fetch: true, agentNav: true },
    captchaOnSearch: 'unknown',
    priority: 3,
    enabled: true,
    goalTemplate: 'gepnic_state_goal',
    rateLimitPerMin: 30,
  },
];

export function getPortalById(id: string): PortalRegistryEntry | undefined {
  return PORTAL_REGISTRY.find((p) => p.id === id);
}

export function getAllEnabledPortals(): PortalRegistryEntry[] {
  return PORTAL_REGISTRY.filter((p) => p.enabled);
}

export function findPortalForUrl(urlStr: string): PortalRegistryEntry | undefined {
  try {
    const url = new URL(urlStr);
    return PORTAL_REGISTRY.find((p) =>
      p.domains.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`)),
    );
  } catch {
    return undefined;
  }
}

