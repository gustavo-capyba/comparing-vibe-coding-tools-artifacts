'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import DynamicMap from '@/components/map/dynamic-map'
import SightingForm from '@/components/sightings/sighting-form'
import SightingsList from '@/components/sightings/sightings-list'
import type { Sighting } from '@/lib/types'

const fetcher = async (): Promise<Sighting[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sightings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

export default function DashboardPage() {
  const { data: sightings, error, mutate } = useSWR<Sighting[]>('sightings', fetcher, {
    refreshInterval: 30000, // Poll every 30 seconds
  })

  const handleSightingCreated = () => {
    mutate()
  }

  return (
    <div className="container px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa de Avistamentos</h1>
          <p className="text-sm text-muted-foreground">
            Visualize e registre avistamentos de animais selvagens
          </p>
        </div>
        <SightingForm onSuccess={handleSightingCreated} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-[500px] overflow-hidden rounded-lg border shadow-sm">
            <DynamicMap sightings={sightings || []} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <SightingsList sightings={sightings || []} />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">
          Erro ao carregar avistamentos: {error.message}
        </p>
      )}
    </div>
  )
}
