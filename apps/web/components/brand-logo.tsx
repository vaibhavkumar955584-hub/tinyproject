import Image from 'next/image';

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ compact = false, className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={compact ? '/brand/tenderguard-mark.png' : '/brand/tenderguard-wordmark.png'}
      alt="TenderGuard"
      width={compact ? 250 : 1221}
      height={compact ? 290 : 294}
      priority={priority}
      className={className}
      sizes={compact ? '40px' : '(max-width: 640px) 170px, 220px'}
    />
  );
}
