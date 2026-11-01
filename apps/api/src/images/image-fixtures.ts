import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

function getSharp(): any {
  try {
    return Function('m', 'return require(m)')('sharp');
  } catch {
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateDemoSvg(rawOpts: {
  portal: string;
  tenderId: string;
  dept: string;
  title: string;
  value: string;
  emd: string;
  closing: string;
  highlightText: string;
}): string {
  const opts = {
    portal: escapeXml(rawOpts.portal),
    tenderId: escapeXml(rawOpts.tenderId),
    dept: escapeXml(rawOpts.dept),
    title: escapeXml(rawOpts.title),
    value: escapeXml(rawOpts.value),
    emd: escapeXml(rawOpts.emd),
    closing: escapeXml(rawOpts.closing),
    highlightText: escapeXml(rawOpts.highlightText),
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="960" viewBox="0 0 1280 960">
  <defs>
    <style>
      .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    </style>
  </defs>
  
  <!-- Browser Chrome Header -->
  <rect width="1280" height="960" fill="#FAF7F2"/>
  <rect width="1280" height="48" fill="#F3EDE3" stroke="#E4DAC9" stroke-width="1"/>
  <circle cx="28" cy="24" r="6" fill="#B23A2E"/>
  <circle cx="48" cy="24" r="6" fill="#B7791F"/>
  <circle cx="68" cy="24" r="6" fill="#2E7D4F"/>
  <rect x="100" y="10" width="800" height="28" rx="6" fill="#FFFFFF" stroke="#E4DAC9" stroke-width="1"/>
  <text x="120" y="28" class="font-sans" font-size="12" fill="#7A6A5A">https://${opts.portal.toLowerCase() === 'gem' ? 'gem.gov.in' : 'eprocure.gov.in'}/eprocure/app?page=FrontEndTenderDetails&amp;service=page&amp;tenderId=${opts.tenderId}</text>

  <!-- Portal Header Bar -->
  <rect y="48" width="1280" height="64" fill="#6B4226"/>
  <text x="32" y="86" class="font-sans" font-size="20" font-weight="700" fill="#FAF7F2">${opts.portal === 'GEM' ? 'Government e-Marketplace (GeM)' : 'Central Public Procurement Portal (CPPP)'}</text>
  <text x="32" y="102" class="font-sans" font-size="11" fill="#E4DAC9">Government of India — Official Public Procurement Portal</text>

  <!-- Breadcrumb -->
  <rect y="112" width="1280" height="36" fill="#F8F5F0" stroke="#E4DAC9" stroke-width="1"/>
  <text x="32" y="135" class="font-sans" font-size="12" fill="#7A6A5A">Home &gt; Tender Search &gt; Tender Notice &gt; <tspan fill="#2E2118" font-weight="600">${opts.tenderId}</tspan></text>

  <!-- Tender Header Container -->
  <rect x="32" y="168" width="1216" height="740" rx="8" fill="#FFFFFF" stroke="#E4DAC9" stroke-width="1"/>
  
  <rect x="32" y="168" width="1216" height="48" fill="#F3EDE3" rx="8" stroke="#E4DAC9" stroke-width="1"/>
  <text x="56" y="198" class="font-sans" font-size="16" font-weight="700" fill="#2E2118">TENDER DOCUMENT &amp; NOTICE SUMMARY</text>
  <rect x="1100" y="178" width="120" height="28" rx="4" fill="#DDE9DF" stroke="#2F6B4F" stroke-width="1"/>
  <text x="1160" y="196" class="font-sans" font-size="12" font-weight="700" fill="#2F6B4F" text-anchor="middle">ACTIVE NOTICE</text>

  <!-- Metadata Grid -->
  <g transform="translate(56, 236)">
    <text x="0" y="16" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">Tender Reference ID:</text>
    <text x="220" y="16" class="font-sans" font-size="13" font-weight="700" fill="#2E2118">${opts.tenderId}</text>

    <text x="0" y="44" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">Procuring Department:</text>
    <text x="220" y="44" class="font-sans" font-size="13" font-weight="600" fill="#2E2118">${opts.dept}</text>

    <text x="0" y="72" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">Work Description / Title:</text>
    <text x="220" y="72" class="font-sans" font-size="14" font-weight="700" fill="#6B4226">${opts.title}</text>

    <text x="0" y="100" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">Estimated Value:</text>
    <text x="220" y="100" class="font-sans" font-size="13" font-weight="700" fill="#2E2118">${opts.value}</text>

    <text x="600" y="100" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">EMD (Earnest Money Deposit):</text>
    <text x="820" y="100" class="font-sans" font-size="13" font-weight="700" fill="#2E2118">${opts.emd}</text>

    <text x="0" y="128" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">Bid Submission Closing:</text>
    <text x="220" y="128" class="font-sans" font-size="13" font-weight="700" fill="#B23A2E">${opts.closing}</text>

    <!-- Divider Line -->
    <line x1="0" y1="150" x2="1160" y2="150" stroke="#E4DAC9" stroke-width="1"/>

    <!-- Eligibility Criteria Section with Green Evidence Highlight -->
    <text x="0" y="180" class="font-sans" font-size="15" font-weight="700" fill="#2E2118">QUALIFICATION &amp; TECHNICAL ELIGIBILITY CRITERIA</text>
    
    <rect x="0" y="200" width="1160" height="96" rx="6" fill="#DDE9DF" stroke="#2F6B4F" stroke-width="1.5"/>
    <text x="20" y="230" class="font-sans" font-size="12" font-weight="700" fill="#2F6B4F">CLAUSE 4.1.2 — VERIFIED REQUIREMENT CLAUSE (EVIDENCE)</text>
    <text x="20" y="260" class="font-sans" font-size="14" font-weight="600" fill="#2E2118">"${opts.highlightText}"</text>

    <!-- Additional clauses -->
    <rect x="0" y="316" width="1160" height="70" rx="6" fill="#FAF7F2" stroke="#E4DAC9" stroke-width="1"/>
    <text x="20" y="344" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">CLAUSE 4.1.3 — STATUTORY DOCUMENTS</text>
    <text x="20" y="366" class="font-sans" font-size="13" fill="#2E2118">Bidders must submit self-attested copies of valid Permanent Account Number (PAN) and GST Registration certificate.</text>

    <rect x="0" y="400" width="1160" height="70" rx="6" fill="#FAF7F2" stroke="#E4DAC9" stroke-width="1"/>
    <text x="20" y="428" class="font-sans" font-size="12" font-weight="600" fill="#7A6A5A">CLAUSE 4.1.4 — MSME EXEMPTION</text>
    <text x="20" y="450" class="font-sans" font-size="13" fill="#2E2118">Micro and Small Enterprises (MSEs) registered with Udyam Registration are exempted from payment of EMD.</text>
  </g>
</svg>`;
}

export async function ensureDemoFixtures(storageDir: string): Promise<void> {
  const fullDir = path.join(storageDir, 'full');
  const thumbsDir = path.join(storageDir, 'thumbs');
  await mkdir(fullDir, { recursive: true });
  await mkdir(thumbsDir, { recursive: true });

  const demos = [
    {
      id: 'demo-cppp-001',
      portal: 'CPPP',
      tenderId: 'DEMO-CPPP-001',
      dept: 'Public Works Department (PWD), Uttar Pradesh',
      title: 'Managed IT helpdesk and endpoint support across District Collectorates',
      value: '₹1,20,00,000 (1.20 Cr)',
      emd: '₹50,000 (MSE Exempt)',
      closing: '20-Dec-2026 15:30 IST',
      highlightText: 'The bidder shall have average annual turnover of at least Rs. 15 lakh during the last three financial years.',
    },
    {
      id: 'demo-cppp-002',
      portal: 'CPPP',
      tenderId: 'DEMO-CPPP-002',
      dept: 'State Infrastructure Development Unit, Lucknow',
      title: 'Annual network maintenance and enterprise SLA support',
      value: '₹1,80,00,000 (1.80 Cr)',
      emd: '₹1,80,000',
      closing: '03-Nov-2026 15:30 IST',
      highlightText: 'The bidder shall have average annual turnover of at least Rs. 28 lakh during the last three financial years.',
    },
    {
      id: 'demo-gem-001',
      portal: 'GEM',
      tenderId: 'DEMO-GEM-001',
      dept: 'National Digital Services Agency, Gujarat',
      title: 'Statewide enterprise network operations & surveillance contract',
      value: '₹12,50,00,000 (12.50 Cr)',
      emd: '₹25,00,000',
      closing: '30-Nov-2026 15:30 IST',
      highlightText: 'The bidder shall have average annual turnover of at least Rs. 1 crore during the last three financial years.',
    },
  ];

  const sharp = getSharp();
  if (!sharp) {
    return;
  }

  for (const demo of demos) {
    const svg = generateDemoSvg(demo);
    const svgBuffer = Buffer.from(svg, 'utf8');

    // Full WebP (1280 wide)
    const fullBuffer = await sharp(svgBuffer)
      .resize(1280, 960)
      .webp({ quality: 85, effort: 4 })
      .toBuffer();
    await writeFile(path.join(fullDir, `${demo.id}.webp`), fullBuffer);

    // Thumb WebP (480x320 top-cropped)
    const thumbBuffer = await sharp(svgBuffer)
      .resize(480, 320, { fit: 'cover', position: 'top' })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    await writeFile(path.join(thumbsDir, `${demo.id}.webp`), thumbBuffer);
  }
}

