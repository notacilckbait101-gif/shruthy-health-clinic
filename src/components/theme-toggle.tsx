"use client"

import { useEffect, useState } from 'react'
import { Moon, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        className="rounded-full border-white/20 bg-white/10 backdrop-blur"
      >
        <Moon className="h-4 w-4 opacity-70" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="rounded-full border-white/20 bg-white/10 backdrop-blur"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
