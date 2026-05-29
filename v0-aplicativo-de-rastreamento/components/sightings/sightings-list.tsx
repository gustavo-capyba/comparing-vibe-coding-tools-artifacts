'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin, Clock } from 'lucide-react'
import type { Sighting } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/date-utils'
import { CROWD_THRESHOLD } from '@/lib/types'

interface SightingsListProps {
  sightings: Sighting[]
  title?: string
}

function countNearbySightings(sighting: Sighting, allSightings: Sighting[], radiusKm: number = 0.5): number {
  const R = 6371
  let count = 0

  for (const other of allSightings) {
    if (other.id === sighting.id) continue
    if (other.animal_type !== sighting.animal_type) continue

    const dLat = ((other.latitude - sighting.latitude) * Math.PI) / 180
    const dLon = ((other.longitude - sighting.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((sighting.latitude * Math.PI) / 180) *
        Math.cos((other.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    if (distance <= radiusKm) {
      count++
    }
  }

  return count
}

export default function SightingsList({ sightings, title = 'Avistamentos Recentes' }: SightingsListProps) {
  if (sightings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Nenhum avistamento registrado ainda
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 p-4 pt-0">
            {sightings.map((sighting) => {
              const nearbyCount = countNearbySightings(sighting, sightings)
              const isCrowded = nearbyCount >= CROWD_THRESHOLD

              return (
                <div
                  key={sighting.id}
                  className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sighting.animal_type}</span>
                        {isCrowded && (
                          <Badge variant="secondary" className="bg-accent text-accent-foreground text-xs">
                            Alta concentração
                          </Badge>
                        )}
                      </div>
                      {sighting.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {sighting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(sighting.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
