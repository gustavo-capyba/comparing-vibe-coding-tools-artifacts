'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/date-utils'
import type { Notification } from '@/lib/types'

const fetcher = async (): Promise<Notification[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data || []
}

export default function NotificationsPage() {
  const { data: notifications, error, mutate } = useSWR<Notification[]>(
    'notifications',
    fetcher,
    { refreshInterval: 30000 }
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const unreadCount = notifications?.filter((n) => !n.read).length || 0

  const handleMarkAsRead = async (id: string) => {
    setActionError(null)
    setLoading(id)

    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)

    if (error) {
      setActionError(error.message)
    }

    mutate()
    setLoading(null)
  }

  const handleMarkAllAsRead = async () => {
    setActionError(null)
    setLoading('all')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setActionError('Você precisa estar logado')
      setLoading(null)
      return
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    if (error) {
      setActionError(error.message)
    }

    mutate()
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    setActionError(null)
    setLoading(`delete-${id}`)

    const supabase = createClient()
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      setActionError(error.message)
    }

    mutate()
    setLoading(null)
  }

  return (
    <div className="container px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `Você tem ${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={loading === 'all'}
            className="gap-2"
          >
            {loading === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {actionError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Suas Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma notificação ainda</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Inscreva-se em tipos de animais para receber notificações de novos avistamentos.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 transition-colors ${
                      notification.read ? 'bg-background' : 'bg-primary/5'
                    }`}
                  >
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? 'bg-muted' : 'bg-primary'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className={notification.read ? 'text-muted-foreground' : 'text-foreground'}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={loading === notification.id}
                          title="Marcar como lida"
                        >
                          {loading === notification.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        disabled={loading === `delete-${notification.id}`}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        {loading === `delete-${notification.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 text-center text-sm text-destructive">
          Erro ao carregar notificações: {error.message}
        </p>
      )}
    </div>
  )
}
