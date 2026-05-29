'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { Sighting } from '@/lib/types'

const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center rounded-lg bg-muted">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

interface DynamicMapProps {
  sightings: Sighting[]
  onLocationSelect?: (lat: number, lng: number) => void
  selectionMode?: boolean
  selectedPosition?: { lat: number; lng: number } | null
}

export default function DynamicMap(props: DynamicMapProps) {
  return <MapComponent {...props} />
}
