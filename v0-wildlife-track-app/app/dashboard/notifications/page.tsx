'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import type { Notification, AnimalType, Subscription } from '@/lib/types'

async function fetchNotifications(): Promise<Notification[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sighting:sightings(
        *,
        animal_type:animal_types(*)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

async function fetchSubscriptions(): Promise<Subscription[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      animal_type:animal_types(*)
    `)
    .eq('user_id', user.id)

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

export default function NotificationsPage() {
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading,
    mutate: refreshNotifications,
  } = useSWR('notifications', fetchNotifications)

  const { 
    data: subscriptions = [],
    mutate: refreshSubscriptions,
  } = useSWR('subscriptions', fetchSubscriptions)

  const { data: animalTypes = [] } = useSWR('animal-types', fetchAnimalTypes)

  const unreadCount = notifications.filter(n => !n.read).length

  async function markAsRead(notificationId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
      refreshNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Erro ao marcar notificação como lida')
    }
  }

  async function markAllAsRead() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
      toast.success('Todas as notificações foram marcadas como lidas')
      refreshNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
      refreshNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Erro ao excluir notificação')
    }
  }

  async function toggleSubscription(animalTypeId: string, notifyInApp: boolean, notifyEmail: boolean) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const existingSub = subscriptions.find(s => s.animal_type_id === animalTypeId)

      if (existingSub) {
        // Update existing subscription
        if (!notifyInApp && !notifyEmail) {
          // Delete subscription if both are unchecked
          const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', existingSub.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('subscriptions')
            .update({ notify_in_app: notifyInApp, notify_email: notifyEmail })
            .eq('id', existingSub.id)
          if (error) throw error
        }
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            animal_type_id: animalTypeId,
            notify_in_app: notifyInApp,
            notify_email: notifyEmail,
          })
        if (error) throw error
      }

      toast.success('Preferências atualizadas')
      refreshSubscriptions()
    } catch (error) {
      console.error('Error toggling subscription:', error)
      toast.error('Erro ao atualizar preferências')
    }
  }

  const getSubscription = (animalTypeId: string) => 
    subscriptions.find(s => s.animal_type_id === animalTypeId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
        <p className="text-muted-foreground">
          Gerencie suas notificações e inscrições
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Suas Notificações
                  {unreadCount > 0 && (
                    <Badge variant="secondary">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Alertas de avistamentos dos animais que você segue
                </CardDescription>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma notificação ainda</p>
                <p className="text-sm">Inscreva-se em tipos de animais para receber alertas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      notification.read 
                        ? 'border-border bg-card' 
                        : 'border-primary/20 bg-primary/5'
                    }`}
                  >
                    <span className="text-2xl">
                      {notification.sighting?.animal_type 
                        ? getAnimalIcon(notification.sighting.animal_type.name)
                        : '🔔'
                      }
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notification.read ? 'text-foreground' : 'font-medium text-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          title="Marcar como lida"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteNotification(notification.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Inscrições</CardTitle>
            <CardDescription>
              Escolha quais animais deseja acompanhar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {animalTypes.map((animal) => {
                const sub = getSubscription(animal.id)
                return (
                  <div 
                    key={animal.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-xl">{getAnimalIcon(animal.name)}</span>
                    <div className="flex-1 space-y-2">
                      <p className="font-medium text-sm">{animal.name}</p>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${animal.id}-app`}
                            checked={sub?.notify_in_app ?? false}
                            onCheckedChange={(checked) => 
                              toggleSubscription(
                                animal.id, 
                                checked as boolean, 
                                sub?.notify_email ?? false
                              )
                            }
                          />
                          <Label htmlFor={`${animal.id}-app`} className="text-xs">
                            No app
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`${animal.id}-email`}
                            checked={sub?.notify_email ?? false}
                            onCheckedChange={(checked) => 
                              toggleSubscription(
                                animal.id, 
                                sub?.notify_in_app ?? false, 
                                checked as boolean
                              )
                            }
                          />
                          <Label htmlFor={`${animal.id}-email`} className="text-xs">
                            Por email
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
