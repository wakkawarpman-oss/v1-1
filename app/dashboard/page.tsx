import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CalculatorDashboard } from '@/components/calculators/CalculatorDashboard'

type DashboardPageProps = Readonly<{
  searchParams?: Promise<{
    tab?: string | string[]
  }>
}>

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const activeTab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab

  return (
    <>
      <Header activeTab={activeTab} />
      <main className="min-h-screen bg-ecalc-lightbg" data-testid="dashboard-page">
        <CalculatorDashboard activeTab={activeTab} />
      </main>
      <Footer />
    </>
  )
}
