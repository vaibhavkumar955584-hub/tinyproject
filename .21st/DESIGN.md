# TenderGuard AI — 21st.dev design context

## Product and stack

- Procurement decision-support app for Indian MSMEs.
- Next.js App Router, React, TypeScript, and Tailwind CSS 4; shared API is NestJS.
- Light and dark themes with a responsive desktop sidebar and mobile bottom navigation.

## Brand and palette

- Use the supplied transparent TenderGuard wordmark from `apps/web/public/brand/tenderguard-wordmark.png` and shield from `apps/web/public/brand/tenderguard-mark.png` through the shared `BrandLogo` component.
- Canvas `#f7f5ef`; paper `#fffefa`; ink `#2b2926`; brown primary `#694d38`; steel blue `#355a78`; green `#3f7458`; red `#b9473f`; warm border `#e6e1d8`.
- Amber signals unknown evidence and approaching deadlines. Green and red statuses always include text labels and icons.
- 21st.dev `SeaGreen Minimal` is a reference for calm surfaces, clear hierarchy, and restrained green accents. Keep TenderGuard's warmer canvas and brown/blue actions.
- Keep both themes readable: paper, muted, status, and border tokens must remain distinct in dark mode. Theme switching is available on the landing, auth, and workspace surfaces.

## Interface rules

- Keep tender evidence and source links visually prominent; show unknowns honestly and never fabricate facts.
- Preserve keyboard focus rings, clear form labels, responsive behavior, and the Responsible AI notice.
- Prefer reusable components and existing tokens. Keep surfaces lightly bordered with restrained shadows and rounded corners.
- Use shared skeletons for asynchronous list loading and global toasts for action confirmation or recoverable errors.
- Avoid dark/neon themes, color-only statuses, dense decoration, and replacing or recoloring the supplied logo.
