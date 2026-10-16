import Image from 'next/image'

export const DEFAULT_LOGO = '/logo-default.jpg'

export default function Logo({
  src,
  alt,
  size,
  priority,
}: {
  src: string
  alt: string
  size: number
  priority?: boolean
}) {
  return (
    <Image
      src={src || DEFAULT_LOGO}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      sizes={`${size}px`}
      className="object-contain mix-blend-multiply"
      style={{ width: size, height: size }}
    />
  )
}
