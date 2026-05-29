'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Settings, User, Save, Loader2 } from 'lucide-react'
import type { Profile, Nationality, DocumentType } from '@/lib/types'
import { validateDocument, validatePhone, validateVehiclePlate, getDocumentTypesForNationality } from '@/lib/validation'

async function fetchProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nationality: 'BR' as Nationality,
    phone: '',
    vehiclePlate: '',
    documentType: 'CPF' as DocumentType,
    documentNumber: '',
  })

  const { 
    data: profile, 
    isLoading,
    mutate: refreshProfile,
  } = useSWR('profile', fetchProfile)

  useEffect(() => {
    if (profile) {
      setFormData({
        nationality: profile.nationality,
        phone: profile.phone,
        vehiclePlate: profile.vehicle_plate,
        documentType: profile.document_type,
        documentNumber: profile.document_number,
      })
    }
  }, [profile])

  const documentTypes = getDocumentTypesForNationality(formData.nationality)

  function updateField<K extends keyof typeof formData>(field: K, value: typeof formData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function validateForm(): boolean {
    // Phone validation
    const phoneValidation = validatePhone(formData.nationality, formData.phone)
    if (!phoneValidation.valid) {
      toast.error('Telefone inválido', {
        description: phoneValidation.message,
      })
      return false
    }

    // Vehicle plate validation
    const plateValidation = validateVehiclePlate(formData.vehiclePlate, formData.nationality)
    if (!plateValidation.valid) {
      toast.error('Placa inválida', {
        description: plateValidation.message,
      })
      return false
    }

    // Document validation
    const docValidation = validateDocument(formData.documentType, formData.documentNumber)
    if (!docValidation.valid) {
      toast.error('Documento inválido', {
        description: docValidation.message,
      })
      return false
    }

    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Você precisa estar logado')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nationality: formData.nationality,
          phone: formData.phone,
          vehicle_plate: formData.vehiclePlate,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      refreshProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle nationality change - reset document type
  function handleNationalityChange(value: Nationality) {
    updateField('nationality', value)
    if (value === 'BR') {
      updateField('documentType', 'CPF')
    } else {
      updateField('documentType', 'DRIVER_LICENSE')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações do Perfil
            </CardTitle>
            <CardDescription>
              Atualize seus dados pessoais e de contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !profile ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Perfil não encontrado</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidade</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={handleNationalityChange}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="nationality">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BR">Brasil</SelectItem>
                        <SelectItem value="US">Estados Unidos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={formData.nationality === 'BR' ? '(11) 99999-9999' : '(555) 123-4567'}
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
                  <Input
                    id="vehiclePlate"
                    type="text"
                    placeholder={formData.nationality === 'BR' ? 'ABC-1234 ou ABC1D23' : 'ABC1234'}
                    value={formData.vehiclePlate}
                    onChange={(e) => updateField('vehiclePlate', e.target.value.toUpperCase())}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value: DocumentType) => updateField('documentType', value)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((doc) => (
                          <SelectItem key={doc.value} value={doc.value}>
                            {doc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número do Documento</Label>
                    <Input
                      id="documentNumber"
                      type="text"
                      placeholder={
                        formData.documentType === 'CPF' 
                          ? '000.000.000-00'
                          : formData.documentType === 'RG'
                          ? '00.000.000-0'
                          : 'A1234567'
                      }
                      value={formData.documentNumber}
                      onChange={(e) => updateField('documentNumber', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
