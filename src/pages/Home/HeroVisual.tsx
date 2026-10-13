import { useState } from 'react'
import type { ImageAsset } from '../../data/images.ts'

interface HeroVisualProps {
  image?: ImageAsset
}

/**
 * Hero imagery (LCP: eager, high priority). Falls back to a lightweight SVG illustration
 * when no image is supplied or the file fails to load.
 */
export default function HeroVisual({ image }: HeroVisualProps) {
  const [failed, setFailed] = useState(false)

  if (image && !failed) {
    return (
      <img
        onError={() => setFailed(true)}
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        fetchPriority="high"
        decoding="async"
        className="size-full object-cover object-[60%_center]"
      />
    )
  }

  return (
    <svg
      viewBox="0 0 960 640"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Illustration of a modern concrete and stone house beside a pool"
      className="size-full"
    >
      <defs>
        <linearGradient id="hv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2e7d8" />
          <stop offset="0.6" stopColor="#e6d2b8" />
          <stop offset="1" stopColor="#d8c1a3" />
        </linearGradient>
        <radialGradient id="hv-sun" cx="0.72" cy="0.18" r="0.45">
          <stop offset="0" stopColor="#fff6e6" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6e6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hv-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7cf8e" />
          <stop offset="1" stopColor="#a8652f" />
        </linearGradient>
        <linearGradient id="hv-concrete" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ddd4c7" />
          <stop offset="1" stopColor="#b5a896" />
        </linearGradient>
        <linearGradient id="hv-rock" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ab9a86" />
          <stop offset="1" stopColor="#685a4c" />
        </linearGradient>
        <linearGradient id="hv-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9cbcb5" />
          <stop offset="1" stopColor="#3f6865" />
        </linearGradient>
        <linearGradient id="hv-ledge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a3968a" />
          <stop offset="1" stopColor="#62574c" />
        </linearGradient>
      </defs>

      <rect width="960" height="640" fill="url(#hv-sky)" />
      <rect width="960" height="640" fill="url(#hv-sun)" />

      {/* Distant tree line */}
      <path
        d="M0 380 Q60 340 120 360 T240 350 T380 365 T520 345 T700 360 V460 H0Z"
        fill="#6f7a5a"
        opacity="0.45"
      />

      {/* Stone cliff */}
      <path d="M700 640 L708 300 Q725 160 800 100 Q870 50 960 36 V640Z" fill="url(#hv-rock)" />
      <g stroke="#4f4439" strokeOpacity="0.35" strokeWidth="2" fill="none">
        <path d="M760 160 L790 240 L770 330 L800 420" />
        <path d="M860 90 L840 200 L880 300" />
        <path d="M920 220 L900 360 L930 470" />
      </g>

      {/* Upper volume */}
      <rect x="250" y="176" width="380" height="146" fill="url(#hv-concrete)" />
      <rect x="250" y="176" width="54" height="146" fill="#a2937f" />
      <rect x="318" y="192" width="296" height="122" fill="url(#hv-glass)" />
      <g stroke="#3b332b" strokeWidth="4">
        <path d="M392 192 V314 M466 192 V314 M540 192 V314" />
      </g>
      {/* Cantilevered roof */}
      <rect x="186" y="136" width="512" height="24" fill="#cdc1b0" />
      <rect x="186" y="160" width="512" height="16" fill="#574c41" />

      {/* Lower volume */}
      <rect x="180" y="336" width="470" height="110" fill="url(#hv-concrete)" />
      <rect x="150" y="322" width="540" height="16" fill="#cdc1b0" />
      <rect x="150" y="338" width="540" height="8" fill="#574c41" />
      <rect x="236" y="352" width="330" height="94" fill="url(#hv-glass)" />
      <g stroke="#3b332b" strokeWidth="4">
        <path d="M318 352 V446 M400 352 V446 M482 352 V446" />
      </g>
      <rect x="590" y="346" width="40" height="100" fill="#a2937f" />

      {/* Terrace */}
      <rect x="0" y="446" width="720" height="18" fill="#c4b8a7" />

      {/* Planting */}
      <g fill="#46603f">
        <ellipse cx="200" cy="440" rx="46" ry="20" />
        <ellipse cx="620" cy="440" rx="40" ry="18" />
        <ellipse cx="96" cy="300" rx="52" ry="58" />
        <ellipse cx="60" cy="350" rx="44" ry="46" />
      </g>
      <g fill="#5d7a4f">
        <ellipse cx="250" cy="436" rx="30" ry="14" />
        <ellipse cx="128" cy="336" rx="40" ry="44" />
      </g>
      <rect x="92" y="350" width="8" height="96" fill="#4a3c2f" />

      {/* Pool with reflections */}
      <path d="M0 464 H720 L660 640 H0Z" fill="url(#hv-pool)" />
      <rect x="236" y="474" width="330" height="54" fill="#f7cf8e" opacity="0.22" />
      <g stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round">
        <path d="M40 500 H170 M300 548 H460 M90 590 H260 M480 600 H600" />
      </g>

      {/* Foreground stone ledge */}
      <path d="M560 520 L960 486 V640 H520Z" fill="url(#hv-ledge)" />
      <path d="M560 520 L960 486 V506 L566 540Z" fill="#bcae9d" />
      <g stroke="#3f362e" strokeOpacity="0.3" strokeWidth="2" fill="none">
        <path d="M640 560 L700 600 L690 640 M820 530 L840 590 M900 560 L930 620" />
      </g>
    </svg>
  )
}
