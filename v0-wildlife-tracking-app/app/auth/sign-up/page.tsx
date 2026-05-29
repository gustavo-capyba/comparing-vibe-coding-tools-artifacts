'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Leaf } from 'lucide-react'
import {
  validateDocument,
  validatePhone,
  validatePlate,
  type Nationality,
} from '@/lib/validations/documents'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [nationality, setNationality] = useState<Nationality>('BR')
  const [phone, setPhone] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [documentType, setDocumentType] = useState('CPF')
  const [documentNumber, setDocumentNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Atualiza tipo de documento quando nacionalidade muda
  const handleNationalityChange = (value: Nationality) => {
    setNationality(value)
    setDocumentType(value === 'BR' ? 'CPF' : 'DRIVER_LICENSE')
    setDocumentNumber('')
    setPhone('')
    setVehiclePlate('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validações
    if (password !== repeatPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    // Validar documento
    const docValidation = validateDocument(nationality, documentType, documentNumber)
    if (!docValidation.isValid) {
      setError(docValidation.error || 'Documento inválido')
      setIsLoading(false)
      return
    }

    // Validar telefone
    const phoneValidation = validatePhone(nationality, phone)
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Telefone inválido')
      setIsLoading(false)
      return
    }

    // Validar placa
    const plateValidation = validatePlate(nationality, vehiclePlate)
    if (!plateValidation.isValid) {
      setError(plateValidation.error || 'Placa inválida')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Criar usuário com metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            nationality,
            phone,
            vehicle_plate: vehiclePlate,
            document_type: documentType,
            document_number: documentNumber,
          },
        },
      })
      
      if (authError) throw authError
      
      // Criar perfil na tabela profiles
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          nationality,
          phone,
          vehicle_plate: vehiclePlate,
          document_type: documentType,
          document_number: documentNumber,
        })
        
        // Ignora erro de RLS (será criado pelo trigger se configurado)
        if (profileError && !profileError.message.includes('row-level security')) {
          console.warn('Perfil será criado após confirmação do e-mail')
        }
      }
      
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erro ao criar conta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">WildTracker</span>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Criar Conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para se cadastrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  {/* E-mail e Senha */}
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-password">Confirmar</Label>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nacionalidade */}
                  <div className="grid gap-2">
                    <Label htmlFor="nationality">Nacionalidade</Label>
                    <Select
                      value={nationality}
                      onValueChange={(v) => handleNationalityChange(v as Nationality)}
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

                  {/* Telefone */}
                  <div className="grid gap-2">
                    <Label htmlFor="phone">
                      {nationality === 'BR' ? 'Telefone' : 'Phone'}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={nationality === 'BR' ? '(11) 99999-9999' : '(555) 123-4567'}
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Placa do veículo */}
                  <div className="grid gap-2">
                    <Label htmlFor="vehicle-plate">
                      {nationality === 'BR' ? 'Placa do Veículo' : 'License Plate'}
                    </Label>
                    <Input
                      id="vehicle-plate"
                      type="text"
                      placeholder={nationality === 'BR' ? 'ABC-1234' : 'ABC1234'}
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    />
                  </div>

                  {/* Documento */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="document-type">Documento</Label>
                      <Select
                        value={documentType}
                        onValueChange={setDocumentType}
                      >
                        <SelectTrigger id="document-type">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {nationality === 'BR' ? (
                            <>
                              <SelectItem value="CPF">CPF</SelectItem>
                              <SelectItem value="RG">RG</SelectItem>
                            </>
                          ) : (
                            <SelectItem value="DRIVER_LICENSE">Driver License</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="document-number">Número</Label>
                      <Input
                        id="document-number"
                        type="text"
                        placeholder={documentType === 'CPF' ? '000.000.000-00' : documentType === 'RG' ? '00.000.000-0' : 'A1234567'}
                        required
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Já tem uma conta?{' '}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    Entrar
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
