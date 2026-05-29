'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { Nationality, DocumentType } from '@/lib/types'
import {
  validateDocument,
  validatePhone,
  validateVehiclePlate,
  getDocumentTypes,
  formatDocument,
  formatPhone,
} from '@/lib/validation'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nationality, setNationality] = useState<Nationality>('BR')
  const [phone, setPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('CPF')
  const [documentNumber, setDocumentNumber] = useState('')

  const availableDocTypes = getDocumentTypes(nationality)

  const handleNationalityChange = (value: Nationality) => {
    setNationality(value)
    const newDocTypes = getDocumentTypes(value)
    setDocumentType(newDocTypes[0])
    setDocumentNumber('')
    setPhone('')
    setVehiclePlate('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate document
    const docValidation = validateDocument(documentType, documentNumber)
    if (!docValidation.valid) {
      setError(docValidation.message)
      return
    }

    // Validate phone
    if (!validatePhone(phone, nationality)) {
      setError(nationality === 'BR' 
        ? 'Telefone deve ter 10 ou 11 dígitos' 
        : 'Telefone deve ter 10 dígitos')
      return
    }

    // Validate vehicle plate
    if (!validateVehiclePlate(vehiclePlate, nationality)) {
      setError(nationality === 'BR' 
        ? 'Placa inválida (formato: ABC1234 ou ABC1D23)' 
        : 'Placa inválida (5-8 caracteres)')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: {
          nationality,
          phone: phone.replace(/\D/g, ''),
          vehicle_plate: vehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
          document_type: documentType,
          document_number: documentNumber.replace(/\D/g, ''),
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create profile with SECURITY DEFINER trigger or manually after confirmation
      // For now, store in user metadata and create profile on first login
      router.push('/auth/sign-up-success')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-primary">Criar Conta</CardTitle>
          <CardDescription>
            Cadastre-se para monitorar a fauna selvagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nacionalidade</Label>
              <Select value={nationality} onValueChange={handleNationalityChange}>
                <SelectTrigger id="nationality">
                  <SelectValue />
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
                placeholder={nationality === 'BR' ? '(11) 99999-9999' : '(555) 123-4567'}
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value, nationality))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehiclePlate">Placa do Veículo</Label>
              <Input
                id="vehiclePlate"
                placeholder={nationality === 'BR' ? 'ABC1D23' : 'ABC123'}
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => {
                    setDocumentType(v as DocumentType)
                    setDocumentNumber('')
                  }}
                >
                  <SelectTrigger id="documentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDocTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número</Label>
                <Input
                  id="documentNumber"
                  placeholder={documentType === 'CPF' ? '000.000.000-00' : documentType === 'RG' ? '00000000' : 'AB123456'}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(
                    documentType === 'CPF' 
                      ? formatDocument(e.target.value, documentType)
                      : e.target.value
                  )}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Conta
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
