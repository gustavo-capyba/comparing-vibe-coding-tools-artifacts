import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-primary">Verifique seu Email</CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para o seu email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Clique no link enviado para ativar sua conta e começar a monitorar a fauna selvagem.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Voltar para Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
