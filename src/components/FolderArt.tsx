import { useId } from 'react'
import type { FolderColor } from '../lib/types'

/*
 * Folder artwork from the Figma file (Group 10–15). Geometry is copied
 * verbatim from the exported SVGs; fills come from CSS variables so the
 * artwork follows light/dark theme.
 */
export const ART_WIDTH = 250.209
export const ART_HEIGHT = 234.709

export function FolderArt({ color, width = ART_WIDTH }: { color: FolderColor; width?: number }) {
  const uid = useId().replace(/:/g, '')
  const v = (name: string) => `var(--folder-${color}-${name})`
  const height = (width / ART_WIDTH) * ART_HEIGHT
  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      fill="none"
      className="pointer-events-none block max-w-none"
      overflow="visible"
    >
      <rect x="11.0712" width="228.067" height="219.21" rx="22.1424" fill={v('back')} />
      <rect x="43.038" y="12.1777" width="197.047" height="168.292" rx="22.1424" transform="rotate(5.61532 43.038 12.1777)" fill={v('sheet')} />
      <rect x="15.5234" y="49.5107" width="191.546" height="151.481" rx="22.1424" transform="rotate(-11.4346 15.5234 49.5107)" fill={v('sheet')} />
      <rect x="24.3566" y="39.9844" width="191.546" height="151.481" rx="22.1424" transform="rotate(-11.3726 24.3566 39.9844)" fill={v('sheet-2')} />
      <rect x="24.3566" y="24.3564" width="202.603" height="173.818" rx="22.1424" fill={v('paper')} />
      <g filter={`url(#s${uid})`}>
        <path
          d="M92.9979 91.8618C92.9979 98.572 98.4376 104.012 105.148 104.012H203.71C220.411 104.012 228.761 104.012 233.949 109.2C239.138 114.388 239.138 122.739 239.138 139.44V183.781C239.138 200.482 239.138 208.832 233.949 214.021C228.761 219.209 220.411 219.209 203.71 219.209H46.499C29.7982 219.209 21.4478 219.209 16.2595 214.021C11.0712 208.832 11.0712 200.482 11.0712 183.781V115.14C11.0712 98.4389 11.0712 90.0885 16.2595 84.9002C21.4478 79.7119 29.7982 79.7119 46.499 79.7119H80.848C87.5583 79.7119 92.9979 85.1516 92.9979 91.8618Z"
          fill={`url(#g${uid})`}
        />
      </g>
      <defs>
        <filter id={`s${uid}`} x="0" y="73.0692" width="250.209" height="161.639" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
          <feOffset dy="4.42848" />
          <feGaussianBlur stdDeviation="5.5356" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.14 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="shadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="shadow" result="shape" />
        </filter>
        <linearGradient id={`g${uid}`} x1="125.104" y1="79.7119" x2="125.104" y2="219.209" gradientUnits="userSpaceOnUse">
          <stop offset="0.384615" stopColor={v('top')} />
          <stop offset="0.778846" stopColor={v('bottom')} />
        </linearGradient>
      </defs>
    </svg>
  )
}
