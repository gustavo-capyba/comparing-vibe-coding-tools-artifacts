'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { Sighting } from '@/lib/types'

const WildlifeMap = dynamic(
  () => import('./wildlife-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full rounded-lg bg-muted flex items-center justify-center" style={{ minHeight: '400px' }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
  }
)

interface MapProps {
  sightings: Sighting[]
  onMapClick?: (lat: number, lng: number) => void
  selectedPosition?: [number, number] | null
  showUserLocation?: boolean
}

export default function Map(props: MapProps) {
  return <WildlifeMap {...props} />
}
