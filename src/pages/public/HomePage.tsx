import { PublicLayout } from '../../components/layout/PublicLayout'
import { HeroSection } from '../../components/public/HeroSection'
import { PublicStats } from '../../components/public/PublicStats'
import { FeaturedProjects } from '../../components/public/FeaturedProjects'

export const HomePage = () => {
  return (
    <PublicLayout>
      <main>
        <HeroSection />
        <PublicStats />
        <FeaturedProjects />
      </main>
    </PublicLayout>
  )
}
export default HomePage