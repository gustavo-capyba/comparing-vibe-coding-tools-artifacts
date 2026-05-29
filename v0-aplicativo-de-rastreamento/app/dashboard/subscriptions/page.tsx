'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Bell, BellOff } from 'lucide-react'
import { ANIMAL_TYPES } from '@/lib/types'
import type { Subscription } from '@/lib/types'

const fetcher = async (): Promise<Subscription[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')

  if (error) throw error
  return data || []
}

export default function SubscriptionsPage() {
  const { data: subscriptions, error, mutate } = useSWR<Subscription[]>('subscriptions', fetcher)
  const [loading, setLoading] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const subscribedTypes = new Set(subscriptions?.map((s) => s.animal_type) || [])

  const handleToggle = async (animalType: string) => {
    setSaveError(null)
    setLoading(animalType)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setSaveError('Você precisa estar logado')
      setLoading(null)
      return
    }

    if (subscribedTypes.has(animalType)) {
      // Unsubscribe
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('animal_type', animalType)

      if (error) {
        setSaveError(error.message)
      }
    } else {
      // Subscribe
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          animal_type: animalType,
        })

      if (error) {
        setSaveError(error.message)
      }
    }

    mutate()
    setLoading(null)
  }

  return (
    <div className="container px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Inscrições de Notificação</h1>
        <p className="text-sm text-muted-foreground">
          Escolha quais tipos de animais você deseja receber notificações
        </p>
      </div>

      {saveError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ANIMAL_TYPES.map((animalType) => {
          const isSubscribed = subscribedTypes.has(animalType)
          const isLoading = loading === animalType

          return (
            <Card
              key={animalType}
              className={`transition-colors ${isSubscribed ? 'border-primary bg-primary/5' : ''}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isSubscribed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isSubscribed ? (
                      <Bell className="h-5 w-5" />
                    ) : (
                      <BellOff className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{animalType}</p>
                    <p className="text-xs text-muted-foreground">
                      {isSubscribed ? 'Inscrito' : 'Não inscrito'}
                    </p>
                  </div>
                </div>

                <Button
                  variant={isSubscribed ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => handleToggle(animalType)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubscribed ? 'Cancelar' : 'Inscrever'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Como funcionam as notificações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Quando você se inscreve para um tipo de animal, receberá notificações sempre que um novo avistamento for registrado.
          </p>
          <p>
            As notificações são verificadas a cada 30 segundos automaticamente.
          </p>
          <p>
            Você pode gerenciar suas notificações na página de{' '}
            <a href="/dashboard/notifications" className="text-primary hover:underline">
              Notificações
            </a>.
          </p>
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">
          Erro ao carregar inscrições: {error.message}
        </p>
      )}
    </div>
  )
}
