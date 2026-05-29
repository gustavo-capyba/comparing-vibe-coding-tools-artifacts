'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, MapPin, Calendar, Trash2 } from 'lucide-react'
import type { Sighting } from '@/components/wildlife-map'

const WildlifeMap = dynamic(() => import('@/components/wildlife-map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center bg-muted rounded-lg">
      <p className="text-muted-foreground">Carregando mapa...</p>
    </div>
  ),
})

const animalTypes = [
  'Mamífero',
  'Ave',
  'Réptil',
  'Anfíbio',
  'Peixe',
  'Inseto',
  'Aracnídeo',
  'Outro',
]

export default function SightingsPage() {
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  
  // Form state
  const [animalType, setAnimalType] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar localização do usuário
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(loc)
          setSelectedPosition(loc) // Usa localização do usuário como padrão
        },
        () => {
          // Fallback: Recife
          const fallback = { lat: -8.0476, lng: -34.877 }
          setUserLocation(fallback)
          setSelectedPosition(fallback)
        },
        { enableHighAccuracy: true }
      )
    }
  }, [])

  // Buscar avistamentos do usuário
  const fetchSightings = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('sightings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar avistamentos:', error)
      } else {
        setSightings(data || [])
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchSightings()
  }, [])

  // Criar novo avistamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!selectedPosition) {
      setError('Selecione um local no mapa')
      setIsSubmitting(false)
      return
    }

    if (!animalType) {
      setError('Selecione o tipo de animal')
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Usuário não autenticado')
      setIsSubmitting(false)
      return
    }

    const { error: insertError } = await supabase.from('sightings').insert({
      user_id: user.id,
      animal_type: animalType,
      description: description || null,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
    })

    if (insertError) {
      setError('Erro ao registrar avistamento: ' + insertError.message)
    } else {
      // Notificar usuários inscritos
      await notifySubscribers(animalType, selectedPosition)
      
      // Reset form
      setAnimalType('')
      setDescription('')
      setSelectedPosition(userLocation)
      setIsDialogOpen(false)
      fetchSightings()
    }

    setIsSubmitting(false)
  }

  // Notificar usuários inscritos (simplificado - sem crowd control real)
  const notifySubscribers = async (
    animalType: string,
    position: { lat: number; lng: number }
  ) => {
    const supabase = createClient()
    
    // Buscar usuários inscritos para esse tipo de animal
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('animal_type', animalType)
    
    if (subscriptions && subscriptions.length > 0) {
      // Buscar último avistamento criado
      const { data: latestSighting } = await supabase
        .from('sightings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Criar notificações para cada usuário inscrito
      const notifications = subscriptions.map(sub => ({
        user_id: sub.user_id,
        sighting_id: latestSighting?.id || null,
        message: `Novo avistamento de ${animalType} registrado nas coordenadas (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
      }))

      await supabase.from('notifications').insert(notifications)
    }
  }

  // Deletar avistamento
  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('sightings').delete().eq('id', id)
    
    if (!error) {
      fetchSightings()
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Avistamentos</h1>
          <p className="text-muted-foreground">
            Registre e gerencie seus avistamentos de vida selvagem
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Avistamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Avistamento</DialogTitle>
              <DialogDescription>
                Preencha os dados e selecione o local no mapa
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="animal-type">Tipo de Animal</Label>
                  <Select value={animalType} onValueChange={setAnimalType}>
                    <SelectTrigger id="animal-type">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {animalTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <div className="flex h-9 items-center gap-2 rounded-md border bg-muted px-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selectedPosition ? (
                      <span>
                        {selectedPosition.lat.toFixed(4)}, {selectedPosition.lng.toFixed(4)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Clique no mapa</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o animal, comportamento, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Selecione o local no mapa</Label>
                <div className="h-64 overflow-hidden rounded-lg border">
                  <WildlifeMap
                    sightings={[]}
                    userLocation={userLocation}
                    selectMode={true}
                    selectedPosition={selectedPosition}
                    onMapClick={(lat, lng) => setSelectedPosition({ lat, lng })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique no mapa para selecionar o local do avistamento
                </p>
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Registrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de avistamentos */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : sightings.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum avistamento</h3>
            <p className="mt-1 text-muted-foreground">
              Você ainda não registrou nenhum avistamento
            </p>
            <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Primeiro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sightings.map((sighting) => (
            <Card key={sighting.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="secondary">{sighting.animal_type}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(sighting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {sighting.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sighting.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(sighting.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
