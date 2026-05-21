import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trees, MapPin, Bell, AlertTriangle, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <Trees className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">Wildlife Track</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button>Criar Conta</Button>
              </Link>
            </div>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Rastreamento de Vida Selvagem
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              Monitore e registre avistamentos de animais em reservas e parques naturais. 
              Contribua para a conservação da vida selvagem com dados em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Agora
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Acessar Minha Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Recursos Principais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<MapPin className="h-8 w-8" />}
              title="Mapa Interativo"
              description="Visualize avistamentos em um mapa com geolocalização precisa e navegação intuitiva."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Notificações"
              description="Receba alertas quando animais da sua lista de interesse forem avistados na região."
            />
            <FeatureCard
              icon={<AlertTriangle className="h-8 w-8" />}
              title="Emergências"
              description="Reporte situações de emergência e receba assistência da equipe de campo."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Crowd Control"
              description="Alertas automáticos quando há concentração excessiva de visitantes em uma área."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Wildlife Track. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-xl bg-background border border-border">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
