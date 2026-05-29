'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, RefreshCw, Eye, Clock } from 'lucide-react'
import type { Sighting } from '@/components/wildlife-map'

// Dynamic import para evitar SSR do Leaflet
const WildlifeMap = dynamic(() => import('@/components/wildlife-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-muted-foreground">Carregando mapa...</p>
    </div>
  ),
})

export default function DashboardPage() {
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Buscar localização do usuário
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          console.warn('Erro de geolocalização:', error.message)
          setLocationError('Não foi possível obter sua localização. Usando Recife como padrão.')
          // Fallback: Recife
          setUserLocation({ lat: -8.0476, lng: -34.877 })
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    } else {
      setLocationError('Geolocalização não suportada. Usando Recife como padrão.')
      setUserLocation({ lat: -8.0476, lng: -34.877 })
    }
  }, [])

  // Buscar avistamentos
  const fetchSightings = async () => {
    setIsLoading(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('sightings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (error) {
      console.error('Erro ao buscar avistamentos:', error)
    } else {
      setSightings(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSightings()
  }, [])

  // Atualizar localização do usuário no banco
  useEffect(() => {
    if (!userLocation) return
    
    const updateUserLocation = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('user_locations')
          .upsert({
            user_id: user.id,
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
      }
    }
    
    updateUserLocation()
  }, [userLocation])

  // Estatísticas
  const stats = {
    total: sightings.length,
    today: sightings.filter(s => {
      const today = new Date()
      const sightingDate = new Date(s.created_at)
      return sightingDate.toDateString() === today.toDateString()
    }).length,
    types: [...new Set(sightings.map(s => s.animal_type))].length,
  }

  return (
    <div className="flex h-svh flex-col p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mapa de Avistamentos</h1>
          <p className="text-muted-foreground">
            Visualize todos os avistamentos de vida selvagem na região
          </p>
        </div>
        <Button onClick={fetchSightings} disabled={isLoading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Location warning */}
      {locationError && (
        <div className="mb-4 rounded-lg border border-accent bg-accent/10 p-3 text-sm text-accent-foreground">
          <MapPin className="mr-2 inline h-4 w-4" />
          {locationError}
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avistamentos</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Animais</CardTitle>
            <Badge variant="secondary">{stats.types}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {[...new Set(sightings.map(s => s.animal_type))].slice(0, 3).map(type => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type}
                </Badge>
              ))}
              {stats.types > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{stats.types - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Mapa Interativo</CardTitle>
          <CardDescription>
            Clique nos marcadores para ver detalhes dos avistamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] p-0">
          <div className="h-full w-full overflow-hidden rounded-b-lg">
            <WildlifeMap sightings={sightings} userLocation={userLocation} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
