'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Phone, Car, FileText, Globe, Save, Loader2 } from 'lucide-react'

interface Profile {
  id: string
  nationality: string
  phone: string
  vehicle_plate: string
  document_type: string
  document_number: string
  created_at: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [phone, setPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')

  // Buscar perfil
  const fetchProfile = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setEmail(user.email || '')
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setPhone(data.phone)
        setVehiclePlate(data.vehicle_plate)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Salvar alterações
  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setMessage(null)

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        phone,
        vehicle_plate: vehiclePlate,
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar alterações: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Alterações salvas com sucesso!' })
      fetchProfile()
    }

    setIsSaving(false)
  }

  const formatNationality = (code: string) => {
    switch (code) {
      case 'BR':
        return 'Brasil'
      case 'US':
        return 'Estados Unidos'
      default:
        return code
    }
  }

  const formatDocumentType = (type: string) => {
    switch (type) {
      case 'CPF':
        return 'CPF'
      case 'RG':
        return 'RG'
      case 'DRIVER_LICENSE':
        return 'Driver License'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Dados básicos da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={email} disabled />
              <p className="text-xs text-muted-foreground">
                O e-mail não pode ser alterado
              </p>
            </div>

            {profile && (
              <>
                <Separator />
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Nacionalidade
                  </Label>
                  <div className="flex h-9 items-center">
                    <Badge variant="secondary">
                      {formatNationality(profile.nationality)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documento
                  </Label>
                  <div className="flex h-9 items-center gap-2">
                    <Badge variant="outline">
                      {formatDocumentType(profile.document_type)}
                    </Badge>
                    <span className="text-sm">{profile.document_number}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Documento não pode ser alterado
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Editable Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Editáveis</CardTitle>
            <CardDescription>
              Atualize seu telefone e placa do veículo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={profile?.nationality === 'BR' ? '(11) 99999-9999' : '(555) 123-4567'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-plate" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Placa do Veículo
              </Label>
              <Input
                id="vehicle-plate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder={profile?.nationality === 'BR' ? 'ABC-1234' : 'ABC1234'}
              />
            </div>

            {message && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  message.type === 'success'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-destructive bg-destructive/10 text-destructive'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Stats */}
      {profile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas da Conta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conta criada em:{' '}
              {new Date(profile.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
