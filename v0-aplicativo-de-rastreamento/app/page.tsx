import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapIcon, Bell, AlertTriangle, Users, Shield, Leaf } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-primary px-4 py-20 text-primary-foreground">
        <div className="container mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20">
              <MapIcon className="h-10 w-10" />
            </div>
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Wildlife Track
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-primary-foreground/90">
            Plataforma de monitoramento de fauna selvagem para áreas de conservação. 
            Registre avistamentos, receba notificações e contribua para a preservação ambiental.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">Criar Conta</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
          </div>
        </div>
        
        {/* Decorative background */}
        <div className="absolute inset-0 -z-10 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            Recursos da Plataforma
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mapa Interativo</CardTitle>
                <CardDescription>
                  Visualize avistamentos de animais em tempo real em um mapa interativo com geolocalização.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Receba alertas sobre avistamentos dos animais que você escolher monitorar.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>Alerta de Emergência</CardTitle>
                <CardDescription>
                  Botão de emergência para situações de perigo, com envio de localização GPS.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <Users className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle>Controle de Multidão</CardTitle>
                <CardDescription>
                  Alertas automáticos quando há muitos visitantes próximos a um avistamento.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Registro Seguro</CardTitle>
                <CardDescription>
                  Validação de documentos por nacionalidade (CPF/RG para BR, ID para US).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Conservação</CardTitle>
                <CardDescription>
                  Contribua para a pesquisa e conservação da fauna selvagem local.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            Pronto para começar?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Crie sua conta gratuitamente e comece a monitorar a fauna selvagem em sua região.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">Criar Conta Grátis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Wildlife Track - Monitoramento de Fauna Selvagem</p>
          <p className="mt-2">Desenvolvido para áreas de conservação ambiental</p>
        </div>
      </footer>
    </div>
  )
}
