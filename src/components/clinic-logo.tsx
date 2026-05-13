import Image from 'next/image'

type ClinicLogoProps = {
  className?: string
  priority?: boolean
  size: number
}

export function ClinicLogo({ className = '', priority = false, size }: ClinicLogoProps) {
  return (
    <Image
      src="/logo123.png"
      alt="Shruty Health Clinic logo"
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  )
}
