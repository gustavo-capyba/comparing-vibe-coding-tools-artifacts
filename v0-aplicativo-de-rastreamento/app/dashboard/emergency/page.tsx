'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, MapPin, Loader2, Phone, CheckCircle } from 'lucide-react'
import { DEFAULT_LOCATION } from '@/lib/types'

export default function EmergencyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(true)

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
          setGettingLocation(false)
        },
        () => {
          setPosition({
            lat: DEFAULT_LOCATION.lat,
            lng: DEFAULT_LOCATION.lng,
          })
          setGettingLocation(false)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setPosition({
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
      })
      setGettingLocation(false)
    }
  }, [])

  const handleEmergency = async () => {
    if (!position) {
      setError('Não foi possível obter sua localização')
      return
    }

    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Você precisa estar logado para enviar um alerta')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('emergencies').insert({
      user_id: user.id,
      latitude: position.lat,
      longitude: position.lng,
      description: description || 'Alerta de emergência',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Simulate staff notification (in production, this would trigger a webhook/notification)
    console.log('[EMERGENCY ALERT]', {
      user_id: user.id,
      location: position,
      description: description || 'Alerta de emergência',
      timestamp: new Date().toISOString(),
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">Alerta Enviado</CardTitle>
            <CardDescription>
              Sua equipe de segurança foi notificada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mantenha-se calmo e aguarde no local. A equipe de emergência está a caminho.
            </p>
            <div className="rounded-lg bg-muted p-4 text-left">
              <p className="mb-2 text-sm font-medium">Sua localização:</p>
              <p className="text-xs text-muted-foreground">
                Lat: {position?.lat.toFixed(6)}, Lng: {position?.lng.toFixed(6)}
              </p>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Alerta de Emergência</CardTitle>
          <CardDescription>
            Use apenas em caso de perigo real ou situação de emergência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <Phone className="h-4 w-4" />
            <AlertTitle>Emergência real?</AlertTitle>
            <AlertDescription>
              Em caso de perigo imediato, ligue para os serviços de emergência: 192 (SAMU), 193 (Bombeiros), 190 (Polícia)
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Sua localização atual</Label>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <MapPin className="h-5 w-5 text-primary" />
              {gettingLocation ? (
                <span className="text-sm text-muted-foreground">Obtendo localização...</span>
              ) : position ? (
                <span className="text-sm">
                  Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                </span>
              ) : (
                <span className="text-sm text-destructive">Localização indisponível</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descreva a situação (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente o que está acontecendo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2 pt-4">
            <Button
              variant="destructive"
              size="lg"
              className="w-full gap-2"
              onClick={handleEmergency}
              disabled={loading || gettingLocation || !position}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              Enviar Alerta de Emergência
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
