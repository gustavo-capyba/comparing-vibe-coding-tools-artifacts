'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, MapPin, Clock, CheckCircle, Loader2 } from 'lucide-react'

interface Emergency {
  id: string
  latitude: number
  longitude: number
  status: 'pending' | 'acknowledged' | 'resolved'
  created_at: string
}

export default function EmergencyPage() {
  const [emergencies, setEmergencies] = useState<Emergency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

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
          setLocationError('Não foi possível obter sua localização. O botão de emergência precisa da localização GPS.')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setLocationError('Geolocalização não suportada neste dispositivo.')
    }
  }, [])

  // Buscar emergências do usuário
  const fetchEmergencies = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('emergencies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      setEmergencies(data || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchEmergencies()
  }, [])

  // Enviar alerta de emergência
  const sendEmergencyAlert = async () => {
    if (!userLocation) {
      setLocationError('Localização não disponível. Tente novamente.')
      return
    }

    setIsSending(true)
    setSendSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsSending(false)
      return
    }

    const { error } = await supabase.from('emergencies').insert({
      user_id: user.id,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      status: 'pending',
    })

    if (!error) {
      setSendSuccess(true)
      fetchEmergencies()
      
      // Simular notificação para staff (em produção seria via webhook/push)
      console.log('[WildTracker] ALERTA DE EMERGÊNCIA ENVIADO:', {
        userId: user.id,
        location: userLocation,
        timestamp: new Date().toISOString(),
      })
    }

    setIsSending(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">Pendente</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">Reconhecido</Badge>
      case 'resolved':
        return <Badge variant="outline" className="border-primary text-primary">Resolvido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Emergência</h1>
        <p className="text-muted-foreground">
          Use em situações de perigo para acionar a equipe de resgate
        </p>
      </div>

      {/* Emergency Button */}
      <Card className="mb-6 border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Botão de Emergência
          </CardTitle>
          <CardDescription>
            Pressione apenas em situações reais de perigo. Sua localização GPS será enviada para a equipe de emergência.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <MapPin className="mr-2 inline h-4 w-4" />
              {locationError}
            </div>
          )}

          {userLocation && (
            <div className="rounded-lg border bg-muted p-3 text-sm">
              <MapPin className="mr-2 inline h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Sua localização: </span>
              <span>{userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</span>
            </div>
          )}

          {sendSuccess && (
            <div className="rounded-lg border border-primary bg-primary/10 p-3 text-sm text-primary">
              <CheckCircle className="mr-2 inline h-4 w-4" />
              Alerta enviado com sucesso! A equipe foi notificada.
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="lg"
                variant="destructive"
                className="w-full py-8 text-lg"
                disabled={!userLocation || isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Enviando Alerta...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    ACIONAR EMERGÊNCIA
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar Alerta de Emergência
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a enviar um alerta de emergência com sua localização atual.
                  A equipe de resgate será notificada imediatamente.
                  <br /><br />
                  <strong>Use apenas em situações reais de perigo.</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={sendEmergencyAlert}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Confirmar Emergência
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Emergency History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Alertas</CardTitle>
          <CardDescription>
            Seus alertas de emergência anteriores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : emergencies.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum alerta de emergência registrado
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {emergencies.map((emergency) => (
                <div
                  key={emergency.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(emergency.created_at)}</span>
                    </div>
                  </div>
                  {getStatusBadge(emergency.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
