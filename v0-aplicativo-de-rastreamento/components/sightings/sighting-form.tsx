'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, MapPin } from 'lucide-react'
import { ANIMAL_TYPES, DEFAULT_LOCATION } from '@/lib/types'
import type { AnimalType } from '@/lib/types'
import DynamicMap from '@/components/map/dynamic-map'

interface SightingFormProps {
  onSuccess?: () => void
}

export default function SightingForm({ onSuccess }: SightingFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animalType, setAnimalType] = useState<AnimalType | ''>('')
  const [description, setDescription] = useState('')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [showMap, setShowMap] = useState(false)

  const handleLocationSelect = (lat: number, lng: number) => {
    setPosition({ lat, lng })
  }

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        },
        () => {
          setPosition({
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng,
          })
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!animalType) {
      setError('Selecione o tipo de animal')
      return
    }

    if (!position) {
      setError('Selecione a localização no mapa')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Você precisa estar logado')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('sightings').insert({
      user_id: user.id,
      animal_type: animalType,
      latitude: position.lat,
      longitude: position.lng,
      description: description || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Reset form
    setAnimalType('')
    setDescription('')
    setPosition(null)
    setShowMap(false)
    setOpen(false)
    setLoading(false)

    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Avistamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Avistamento</DialogTitle>
          <DialogDescription>
            Informe os detalhes do animal avistado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="animalType">Tipo de Animal</Label>
            <Select value={animalType} onValueChange={(v) => setAnimalType(v as AnimalType)}>
              <SelectTrigger id="animalType">
                <SelectValue placeholder="Selecione o animal" />
              </SelectTrigger>
              <SelectContent>
                {ANIMAL_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o comportamento, quantidade, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Localização</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleUseCurrentLocation}
              >
                <MapPin className="h-4 w-4" />
                Usar localização atual
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? 'Ocultar mapa' : 'Selecionar no mapa'}
              </Button>
            </div>
            
            {position && (
              <p className="text-sm text-muted-foreground">
                Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
              </p>
            )}

            {showMap && (
              <div className="h-64 w-full overflow-hidden rounded-lg border">
                <DynamicMap
                  sightings={[]}
                  onLocationSelect={handleLocationSelect}
                  selectionMode
                  selectedPosition={position}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
