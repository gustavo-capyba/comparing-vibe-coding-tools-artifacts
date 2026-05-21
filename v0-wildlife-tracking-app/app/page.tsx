import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Leaf, Map, Bell, AlertTriangle, Users, Eye } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">WildTracker</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Rastreamento de Vida Selvagem em Tempo Real
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground md:text-xl">
            Monitore avistamentos de animais, receba notificações personalizadas e 
            contribua para a preservação da fauna local com nosso sistema de 
            geolocalização avançado.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Começar Agora</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-card py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">Recursos Principais</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Ferramentas completas para monitoramento e preservação da vida selvagem
          </p>
          
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Map className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Mapa Interativo</CardTitle>
                <CardDescription>
                  Visualize avistamentos em tempo real com zoom até nível municipal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Geolocalização precisa com OpenStreetMap e Leaflet para 
                  rastreamento de fauna em qualquer região.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Registro de Avistamentos</CardTitle>
                <CardDescription>
                  Documente encontros com animais silvestres facilmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registre espécies, localização GPS, fotos e descrições 
                  detalhadas de cada avistamento.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Notificações Inteligentes</CardTitle>
                <CardDescription>
                  Receba alertas sobre animais que você deseja acompanhar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Inscreva-se para receber notificações quando suas espécies 
                  favoritas forem avistadas na região.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="mt-4">Controle de Multidão</CardTitle>
                <CardDescription>
                  Sistema inteligente de gestão de visitantes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notificações são suprimidas automaticamente quando muitos 
                  usuários já estão próximos ao local.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="mt-4">Botão de Emergência</CardTitle>
                <CardDescription>
                  Acione ajuda rapidamente em situações de risco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Envie sua localização GPS para a equipe de emergência 
                  com um único toque.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <Leaf className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle className="mt-4">Preservação</CardTitle>
                <CardDescription>
                  Contribua para a conservação da biodiversidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Seus dados ajudam pesquisadores e órgãos ambientais a 
                  proteger a fauna local.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-primary-foreground md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            Junte-se a milhares de pessoas que já estão contribuindo para a 
            preservação da vida selvagem.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link href="/auth/sign-up">Criar Conta Gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} WildTracker. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
