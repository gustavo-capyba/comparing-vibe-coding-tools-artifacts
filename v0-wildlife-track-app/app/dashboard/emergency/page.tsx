'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import Map from '@/components/map'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { AlertTriangle, MapPin, Loader2, Phone, Clock, CheckCircle2 } from 'lucide-react'
import type { Emergency } from '@/lib/types'

async function fetchMyEmergencies(): Promise<Emergency[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('emergencies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

function getStatusBadge(status: Emergency['status']) {
  switch (status) {
    case 'pending':
      return <Badge variant="destructive">Pendente</Badge>
    case 'acknowledged':
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-400">Em Atendimento</Badge>
    case 'resolved':
      return <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400">Resolvido</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function EmergencyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [description, setDescription] = useState('')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(true)

  const { 
    data: emergencies = [], 
    isLoading,
    mutate: refreshEmergencies,
  } = useSWR('my-emergencies', fetchMyEmergencies)

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationError('Não foi possível obter sua localização. Por favor, permita o acesso à localização.')
          setIsGettingLocation(false)
          // Fallback to default location (Recife)
          setUserLocation([-8.0476, -34.8770])
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setLocationError('Geolocalização não é suportada pelo seu navegador.')
      setIsGettingLocation(false)
    }
  }, [])

  async function handleSubmitEmergency(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userLocation) {
      toast.error('Localização não disponível', {
        description: 'Aguarde a obtenção da sua localização ou permita o acesso.',
      })
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

      const { error } = await supabase.from('emergencies').insert({
        user_id: user.id,
        latitude: userLocation[0],
        longitude: userLocation[1],
        description: description || null,
        status: 'pending',
      })

      if (error) throw error

      // Simulate sending notification to staff
      toast.success('Emergência reportada!', {
        description: 'A equipe de campo foi notificada e entrará em contato em breve.',
      })

      setDescription('')
      refreshEmergencies()
    } catch (error) {
      console.error('Error creating emergency:', error)
      toast.error('Erro ao reportar emergência')
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasActiveEmergency = emergencies.some(e => e.status === 'pending' || e.status === 'acknowledged')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emergência</h1>
        <p className="text-muted-foreground">
          Reporte situações de emergência para a equipe de campo
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emergency Report Form */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Reportar Emergência
            </CardTitle>
            <CardDescription>
              Use este recurso apenas em casos de real emergência
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasActiveEmergency ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                <h3 className="font-medium text-lg mb-2">Emergência em Andamento</h3>
                <p className="text-muted-foreground text-sm">
                  Você já possui uma emergência ativa. Aguarde o atendimento da equipe.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitEmergency} className="space-y-4">
                {/* Location Display */}
                <div className="space-y-2">
                  <Label>Sua Localização</Label>
                  {isGettingLocation ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Obtendo localização...
                    </div>
                  ) : locationError ? (
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                      {locationError}
                    </div>
                  ) : userLocation ? (
                    <div className="h-[200px] rounded-lg overflow-hidden border border-border">
                      <Map 
                        sightings={[]}
                        selectedPosition={userLocation}
                        showUserLocation={false}
                      />
                    </div>
                  ) : null}
                  {userLocation && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="emergency-description">
                    Descreva a emergência (opcional)
                  </Label>
                  <Textarea
                    id="emergency-description"
                    placeholder="Ex: Animal ferido na trilha, visitante perdido, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Emergency Contact Info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Em caso de emergência grave, ligue: <strong>(81) 3355-1234</strong>
                  </span>
                </div>

                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="w-full"
                  disabled={isSubmitting || !userLocation}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Reportar Emergência
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Emergency History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Emergências</CardTitle>
            <CardDescription>
              Suas emergências anteriores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : emergencies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma emergência registrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencies.map((emergency) => (
                  <div 
                    key={emergency.id}
                    className={`p-4 rounded-lg border ${
                      emergency.status === 'pending' 
                        ? 'border-destructive/50 bg-destructive/5'
                        : emergency.status === 'acknowledged'
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${
                          emergency.status === 'resolved' ? 'text-muted-foreground' : 'text-destructive'
                        }`} />
                        <span className="font-medium text-sm">
                          {new Date(emergency.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {getStatusBadge(emergency.status)}
                    </div>
                    {emergency.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {emergency.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                    </p>
                    {emergency.resolved_at && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        Resolvido em {new Date(emergency.resolved_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
