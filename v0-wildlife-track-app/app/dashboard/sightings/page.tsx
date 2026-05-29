'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import Map from '@/components/map'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Plus, MapPin, Loader2, Trash2 } from 'lucide-react'
import type { Sighting, AnimalType } from '@/lib/types'

async function fetchMySightings(): Promise<Sighting[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('sightings')
    .select(`
      *,
      animal_type:animal_types(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

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

export default function SightingsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [selectedAnimal, setSelectedAnimal] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    data: sightings = [], 
    isLoading,
    mutate: refreshSightings,
  } = useSWR('my-sightings', fetchMySightings)

  const { data: animalTypes = [] } = useSWR('animal-types', fetchAnimalTypes)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedPosition) {
      toast.error('Selecione uma localização no mapa')
      return
    }

    if (!selectedAnimal) {
      toast.error('Selecione um tipo de animal')
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Você precisa estar logado')
        return
      }

      const { error } = await supabase.from('sightings').insert({
        user_id: user.id,
        animal_type_id: selectedAnimal,
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
        description: description || null,
      })

      if (error) throw error

      toast.success('Avistamento registrado com sucesso!')
      setIsDialogOpen(false)
      setSelectedPosition(null)
      setSelectedAnimal('')
      setDescription('')
      refreshSightings()
    } catch (error) {
      console.error('Error creating sighting:', error)
      toast.error('Erro ao registrar avistamento')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(sightingId: string) {
    if (!confirm('Tem certeza que deseja excluir este avistamento?')) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('sightings')
        .delete()
        .eq('id', sightingId)

      if (error) throw error

      toast.success('Avistamento excluído')
      refreshSightings()
    } catch (error) {
      console.error('Error deleting sighting:', error)
      toast.error('Erro ao excluir avistamento')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Avistamentos</h1>
          <p className="text-muted-foreground">
            Registre e gerencie seus avistamentos de animais
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Avistamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Avistamento</DialogTitle>
              <DialogDescription>
                Clique no mapa para selecionar a localização do avistamento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Map for location selection */}
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <div className="h-[250px] rounded-lg overflow-hidden border border-border">
                    <Map 
                      sightings={[]}
                      onMapClick={(lat, lng) => setSelectedPosition([lat, lng])}
                      selectedPosition={selectedPosition}
                      showUserLocation
                    />
                  </div>
                  {selectedPosition && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
                    </p>
                  )}
                </div>

                {/* Animal type selection */}
                <div className="space-y-2">
                  <Label htmlFor="animal">Tipo de Animal</Label>
                  <Select
                    value={selectedAnimal}
                    onValueChange={setSelectedAnimal}
                  >
                    <SelectTrigger id="animal">
                      <SelectValue placeholder="Selecione o animal" />
                    </SelectTrigger>
                    <SelectContent>
                      {animalTypes.map((animal) => (
                        <SelectItem key={animal.id} value={animal.id}>
                          <span className="flex items-center gap-2">
                            <span>{getAnimalIcon(animal.name)}</span>
                            {animal.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o avistamento..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedPosition || !selectedAnimal}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Registrar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seus Avistamentos</CardTitle>
          <CardDescription>
            {sightings.length} avistamento{sightings.length !== 1 ? 's' : ''} registrado{sightings.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : sightings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Você ainda não registrou nenhum avistamento</p>
              <p className="text-sm">Clique em &quot;Novo Avistamento&quot; para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sightings.map((sighting) => (
                <div 
                  key={sighting.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  <span className="text-3xl">
                    {getAnimalIcon(sighting.animal_type?.name || '')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {sighting.animal_type?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {sighting.description || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {sighting.latitude.toFixed(4)}, {sighting.longitude.toFixed(4)}
                      </span>
                      <span>
                        {new Date(sighting.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(sighting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
