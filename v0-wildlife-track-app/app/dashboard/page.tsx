'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import Map from '@/components/map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, MapPin, Eye } from 'lucide-react'
import type { Sighting, AnimalType } from '@/lib/types'

async function fetchSightings(): Promise<Sighting[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sightings')
    .select(`
      *,
      animal_type:animal_types(*)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return data || []
}

async function fetchAnimalTypes(): Promise<AnimalType[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('animal_types')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

function getAnimalIcon(animalName: string): string {
  const icons: Record<string, string> = {
    'Capivara': '🦫',
    'Jacaré': '🐊',
    'Tatu': '🦔',
    'Quati': '🦝',
    'Macaco-prego': '🐒',
    'Garça': '🦢',
    'Tucano': '🐦',
    'Cobra': '🐍',
    'Gambá': '🦨',
    'Tamanduá': '🐜',
  }
  return icons[animalName] || '🐾'
}

export default function DashboardPage() {
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null)

  const { 
    data: sightings = [], 
    isLoading: sightingsLoading,
    mutate: refreshSightings,
  } = useSWR('sightings', fetchSightings, { refreshInterval: 60000 })

  const { 
    data: animalTypes = [],
    isLoading: animalsLoading,
  } = useSWR('animal-types', fetchAnimalTypes)

  const filteredSightings = selectedAnimal
    ? sightings.filter(s => s.animal_type_id === selectedAnimal)
    : sightings

  // Count sightings per animal type
  const sightingCounts = sightings.reduce((acc, s) => {
    acc[s.animal_type_id] = (acc[s.animal_type_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa de Avistamentos</h1>
          <p className="text-muted-foreground">
            Visualize os avistamentos de animais na região
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refreshSightings()}
          disabled={sightingsLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${sightingsLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Filtrar por Animal</CardTitle>
            <CardDescription>
              Selecione um tipo de animal para filtrar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {animalsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                <Button
                  variant={selectedAnimal === null ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedAnimal(null)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Todos os animais
                  <Badge variant="outline" className="ml-auto">
                    {sightings.length}
                  </Badge>
                </Button>
                {animalTypes.map((animal) => (
                  <Button
                    key={animal.id}
                    variant={selectedAnimal === animal.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedAnimal(animal.id)}
                  >
                    <span className="mr-2">{getAnimalIcon(animal.name)}</span>
                    {animal.name}
                    <Badge variant="outline" className="ml-auto">
                      {sightingCounts[animal.id] || 0}
                    </Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Mapa Interativo
            </CardTitle>
            <CardDescription>
              {filteredSightings.length} avistamento{filteredSightings.length !== 1 ? 's' : ''} 
              {selectedAnimal ? ' do tipo selecionado' : ' no total'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] rounded-lg overflow-hidden border border-border">
              {sightingsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Map sightings={filteredSightings} showUserLocation />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sightings */}
      <Card>
        <CardHeader>
          <CardTitle>Avistamentos Recentes</CardTitle>
          <CardDescription>
            Últimos avistamentos registrados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sightingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSightings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum avistamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSightings.slice(0, 5).map((sighting) => (
                <div 
                  key={sighting.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <span className="text-2xl">
                    {getAnimalIcon(sighting.animal_type?.name || '')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {sighting.animal_type?.name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {sighting.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {new Date(sighting.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
