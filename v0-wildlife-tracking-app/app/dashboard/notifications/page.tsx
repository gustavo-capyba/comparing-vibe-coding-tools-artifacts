'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, Check, Trash2, Settings2 } from 'lucide-react'

interface Notification {
  id: string
  message: string
  read: boolean
  created_at: string
  sighting_id: string | null
}

interface Subscription {
  id: string
  animal_type: string
  created_at: string
}

const availableAnimalTypes = [
  'Mamífero',
  'Ave',
  'Réptil',
  'Anfíbio',
  'Peixe',
  'Inseto',
  'Aracnídeo',
  'Outro',
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Buscar notificações
  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setNotifications(data || [])
    }
  }

  // Buscar inscrições
  const fetchSubscriptions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
      
      setSubscriptions(data || [])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchNotifications(), fetchSubscriptions()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  // Marcar como lida
  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    fetchNotifications()
  }

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
      
      fetchNotifications()
    }
  }

  // Deletar notificação
  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').delete().eq('id', id)
    fetchNotifications()
  }

  // Toggle inscrição
  const toggleSubscription = async (animalType: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    const existing = subscriptions.find(s => s.animal_type === animalType)
    
    if (existing) {
      await supabase.from('subscriptions').delete().eq('id', existing.id)
    } else {
      await supabase.from('subscriptions').insert({
        user_id: user.id,
        animal_type: animalType,
      })
    }
    
    fetchSubscriptions()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie suas notificações e inscrições
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Configurar
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Inscrições</CardTitle>
            <CardDescription>
              Selecione os tipos de animais que deseja acompanhar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {availableAnimalTypes.map((type) => {
                const isSubscribed = subscriptions.some(s => s.animal_type === type)
                return (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sub-${type}`}
                      checked={isSubscribed}
                      onCheckedChange={() => toggleSubscription(type)}
                    />
                    <Label
                      htmlFor={`sub-${type}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {type}
                    </Label>
                  </div>
                )
              })}
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Você receberá notificações quando alguém registrar um avistamento dos tipos selecionados.
              O sistema suprime notificações automaticamente quando muitos usuários já estão próximos ao local.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center text-center">
            <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhuma notificação</h3>
            <p className="mt-1 text-muted-foreground">
              Você não tem notificações no momento
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configurar Inscrições
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={notification.read ? 'bg-muted/50' : 'bg-card'}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    notification.read ? 'bg-muted-foreground/30' : 'bg-primary'
                  }`}
                />
                <div className="flex-1">
                  <p className={`text-sm ${notification.read ? 'text-muted-foreground' : ''}`}>
                    {notification.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
