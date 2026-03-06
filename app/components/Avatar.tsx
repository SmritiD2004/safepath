import Image from 'next/image'

type AvatarProps = {
  src?: string | null
  alt?: string
  size?: number
  fallbackText?: string
}

export default function Avatar({ src, alt = 'User', size = 48, fallbackText = 'U' }: AvatarProps) {
  const s = `${size}px`

  return (
    <div
      className="relative overflow-hidden rounded-full border-4 shadow-xl ring-2 transition-transform hover:scale-105"
      style={{
        width: s,
        height: s,
        borderColor: 'var(--wine-light)',
        background: 'linear-gradient(135deg, var(--tone-soft), color-mix(in srgb, var(--wine-light) 35%, var(--bg-card)))',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <Image src={src} alt={alt} width={size} height={size} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontWeight: 800, fontSize: Math.max(12, Math.floor(size * 0.34)), color: 'var(--wine)' }}>
          {fallbackText}
        </span>
      )}
    </div>
  )
}
