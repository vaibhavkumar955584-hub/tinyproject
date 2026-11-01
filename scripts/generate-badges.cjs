const fs = require('fs');
const path = require('path');

function renderBadge(initials) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#F3EDE3"/>
  <rect x="2" y="2" width="476" height="316" rx="14" fill="none" stroke="#E4DAC9" stroke-width="2"/>
  <rect x="150" y="80" width="180" height="120" rx="20" fill="#6B4226"/>
  <text x="240" y="148" fill="#FAF7F2" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" dominant-baseline="central">${initials}</text>
  <text x="240" y="235" fill="#7A6A5A" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="1">PUBLIC TENDER GAZETTE</text>
</svg>`;
}

const badges = ['CPPP', 'GEM', 'GEPNIC', 'IREPS', 'DEFENCE', 'PSU', 'CUSTOM', 'NIC', 'DOT', 'NIT'];
const dirs = [
  path.join(__dirname, '../apps/web/public/api/images/badges'),
  path.join(__dirname, '../apps/web/public/images/badges'),
  path.join(__dirname, '../apps/api/uploads/images/badges'),
];

dirs.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  badges.forEach((b) => {
    fs.writeFileSync(path.join(d, `${b}.svg`), renderBadge(b));
  });
});
console.log('Badges generated successfully');

