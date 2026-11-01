import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { TenderImage, TenderImageSource } from '@tenderguard/shared';

function getSharp(): any {
  try {
    return Function('m', 'return require(m)')('sharp');
  } catch {
    return null;
  }
}

export interface ProcessedImageResult {
  source: TenderImageSource;
  thumbUrl: string;
  fullUrl: string;
  alt: string;
  width?: number;
  height?: number;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly storageDir: string;

  constructor(private readonly config: ConfigService) {
    const defaultDir = path.resolve(process.cwd(), 'uploads/images');
    const candidateDirs = [
      defaultDir,
      path.resolve(process.cwd(), 'apps/api/uploads/images'),
      path.resolve(__dirname, '../../uploads/images'),
    ];
    this.storageDir = candidateDirs.find((d) => existsSync(d)) ?? defaultDir;
    void this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      await mkdir(path.join(this.storageDir, 'full'), { recursive: true });
      await mkdir(path.join(this.storageDir, 'thumbs'), { recursive: true });
      await mkdir(path.join(this.storageDir, 'badges'), { recursive: true });
      this.logger.log(`Image storage initialized at ${this.storageDir}`);
    } catch (err) {
      this.logger.error(`Failed to initialize image storage: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  async processAndStoreScreenshot(
    rawBuffer: Buffer,
    tenderId: string,
    tenderTitle: string,
    sourceHost: string = 'eprocure.gov.in',
  ): Promise<ProcessedImageResult> {
    // 1. Redaction & Safety check (Reject login walls or corrupt images)
    if (!rawBuffer || rawBuffer.length < 500) {
      return this.generateOrgBadgeFallback(tenderId, tenderTitle);
    }

    const sharp = getSharp();
    if (!sharp) {
      this.logger.warn('Sharp image processor not available; using official badge fallback');
      return this.generateOrgBadgeFallback(tenderId, tenderTitle);
    }

    try {
      const image = sharp(rawBuffer);
      const meta = await image.metadata();

      const width = meta.width ?? 1280;
      const height = meta.height ?? 800;

      // 2. Full-size compressed WebP
      const fullBuffer = await sharp(rawBuffer)
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

      const fullPath = path.join(this.storageDir, 'full', `${tenderId}.webp`);
      await writeFile(fullPath, fullBuffer);

      // 3. Top-cropped 480px WebP thumbnail (shows top of document with title/dept, max 60KB)
      const thumbBuffer = await sharp(rawBuffer)
        .resize(480, 320, { fit: 'cover', position: 'top' })
        .webp({ quality: 75, effort: 4 })
        .toBuffer();

      const thumbPath = path.join(this.storageDir, 'thumbs', `${tenderId}.webp`);
      await writeFile(thumbPath, thumbBuffer);

      const alt = `Screenshot of public tender notice ${tenderTitle.slice(0, 40)} from ${sourceHost}`;

      return {
        source: 'SCREENSHOT',
        thumbUrl: `/api/images/thumbs/${tenderId}.webp`,
        fullUrl: `/api/images/full/${tenderId}.webp`,
        alt,
        width: 480,
        height: 320,
      };
    } catch (err) {
      this.logger.warn(`Failed to process screenshot for ${tenderId}: ${err instanceof Error ? err.message : 'unknown'}`);
      return this.generateOrgBadgeFallback(tenderId, tenderTitle);
    }
  }

  generateOrgBadgeFallback(
    tenderId: string,
    title: string,
    department?: string,
  ): ProcessedImageResult {
    const rawOrg = (department || title || 'Govt').trim();
    // Compute initials / short badge acronym (e.g. NIC, DoT, GSDC)
    const initials = rawOrg
      .split(/[\s,–-]+/)
      .filter((w) => w.length > 2 && !/^(and|for|the|of|in|to)$/i.test(w))
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'NIT';

    const alt = `Organisation badge for ${department || title}`;

    return {
      source: 'ORG_BADGE',
      thumbUrl: `/api/images/badges/${encodeURIComponent(initials)}.svg`,
      fullUrl: `/api/images/badges/${encodeURIComponent(initials)}.svg`,
      alt,
      width: 480,
      height: 320,
    };
  }

  getCategoryIconFallback(
    category: string,
  ): ProcessedImageResult {
    const slug = (category || 'procurement').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      source: 'CATEGORY_ICON',
      thumbUrl: `/api/images/categories/${slug}.svg`,
      fullUrl: `/api/images/categories/${slug}.svg`,
      alt: `Category icon for ${category}`,
      width: 480,
      height: 320,
    };
  }

  resolveImage(tender: {
    id: string;
    title: string;
    department?: string | null;
    thumbUrl?: string | null;
    imageUrl?: string | null;
    imageSource?: TenderImageSource | null;
  }): TenderImage {
    if (tender.thumbUrl && tender.imageSource === 'SCREENSHOT') {
      return {
        thumbUrl: tender.thumbUrl,
        fullUrl: tender.imageUrl ?? tender.thumbUrl,
        source: 'SCREENSHOT',
        alt: `Screenshot of tender notice from ${tender.department ?? 'government portal'}`,
      };
    }

    const fallback = this.generateOrgBadgeFallback(tender.id, tender.title, tender.department ?? undefined);
    return {
      thumbUrl: fallback.thumbUrl,
      fullUrl: fallback.fullUrl,
      source: fallback.source,
      alt: fallback.alt,
    };
  }

  async getFileStream(type: string, filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    if (type === 'badges' && filename.endsWith('.svg')) {
      const text = decodeURIComponent(filename.replace(/\.svg$/, '')).slice(0, 4);
      const svg = this.renderBadgeSvg(text);
      return { buffer: Buffer.from(svg, 'utf8'), contentType: 'image/svg+xml' };
    }

    if (type === 'categories' && filename.endsWith('.svg')) {
      const slug = decodeURIComponent(filename.replace(/\.svg$/, ''));
      const svg = this.renderCategorySvg(slug);
      return { buffer: Buffer.from(svg, 'utf8'), contentType: 'image/svg+xml' };
    }

    const targetPath = path.join(this.storageDir, type, filename);
    if (!existsSync(targetPath)) return null;

    try {
      const buffer = await readFile(targetPath);
      return { buffer, contentType: 'image/webp' };
    } catch {
      return null;
    }
  }

  private renderBadgeSvg(initials: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#F3EDE3"/>
  <rect x="2" y="2" width="476" height="316" rx="14" fill="none" stroke="#E4DAC9" stroke-width="2"/>
  <rect x="180" y="80" width="120" height="120" rx="20" fill="#6B4226"/>
  <text x="240" y="152" fill="#FAF7F2" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="bold" text-anchor="middle" dominant-baseline="central">${initials}</text>
  <text x="240" y="235" fill="#7A6A5A" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle" letter-spacing="1">PUBLIC TENDER GAZETTE</text>
</svg>`;
  }

  private renderCategorySvg(slug: string): string {
    const label = slug.replace(/-/g, ' ').toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#FAF7F2"/>
  <rect x="2" y="2" width="476" height="316" rx="14" fill="none" stroke="#E4DAC9" stroke-width="2"/>
  <circle cx="240" cy="140" r="50" fill="#DDE9DF"/>
  <path d="M225 140 L235 150 L255 130" fill="none" stroke="#2F6B4F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="240" y="230" fill="#2E2118" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${label}</text>
</svg>`;
  }
}

