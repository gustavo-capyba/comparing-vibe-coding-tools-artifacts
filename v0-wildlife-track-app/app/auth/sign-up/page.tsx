'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Trees, UserPlus } from 'lucide-react'
import type { Nationality, DocumentType, SignUpFormData } from '@/lib/types'
import { validateDocument, validatePhone, validateVehiclePlate, getDocumentTypesForNationality } from '@/lib/validation'

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nationality: 'BR',
    phone: '',
    vehiclePlate: '',
    documentType: 'CPF',
    documentNumber: '',
  })

  const documentTypes = getDocumentTypesForNationality(formData.nationality)

  // Reset document type when nationality changes
  useEffect(() => {
    if (formData.nationality === 'BR') {
      setFormData(prev => ({ ...prev, documentType: 'CPF' }))
    } else {
      setFormData(prev => ({ ...prev, documentType: 'DRIVER_LICENSE' }))
    }
  }, [formData.nationality])

  function updateField<K extends keyof SignUpFormData>(field: K, value: SignUpFormData[K]) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function validateForm(): boolean {
    // Password validation
    if (formData.password.length < 6) {
      toast.error('Senha muito curta', {
        description: 'A senha deve ter pelo menos 6 caracteres.',
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não conferem', {
        description: 'A confirmação de senha deve ser igual à senha.',
      })
      return false
    }

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

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
            `${window.location.origin}/auth/callback`,
          data: {
            nationality: formData.nationality,
            phone: formData.phone,
            vehicle_plate: formData.vehiclePlate,
            document_type: formData.documentType,
            document_number: formData.documentNumber,
          },
        },
      })

      if (authError) {
        toast.error('Erro ao criar conta', {
          description: authError.message,
        })
        return
      }

      // Create profile (via trigger or manually if session exists)
      if (authData.user && authData.session) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          nationality: formData.nationality,
          phone: formData.phone,
          vehicle_plate: formData.vehiclePlate,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
        })

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Profile creation error:', profileError)
        }
      }

      router.push('/auth/sign-up-success')
    } catch {
      toast.error('Erro inesperado', {
        description: 'Tente novamente mais tarde.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Trees className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Wildlife Track</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Sistema de rastreamento de vida selvagem
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Criar Conta</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para se cadastrar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Informações da Conta
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repita a senha"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Informações Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nacionalidade</Label>
                    <Select
                      value={formData.nationality}
                      onValueChange={(value: Nationality) => updateField('nationality', value)}
                      disabled={isLoading}
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
                      required
                      disabled={isLoading}
                      autoComplete="tel"
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
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Documento de Identificação
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value: DocumentType) => updateField('documentType', value)}
                      disabled={isLoading}
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
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Conta
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Já tem uma conta?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
