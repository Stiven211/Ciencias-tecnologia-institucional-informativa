import { PublicLayout } from '../../components/layout/PublicLayout'
import { HeroSection } from '../../components/public/HeroSection'
import { StemAreasSection } from '../../components/public/StemAreasSection'
import { PublicStats } from '../../components/public/PublicStats'
import { FeaturedProjects } from '../../components/public/FeaturedProjects'

export const HomePage = () => {
  return (
    <PublicLayout>
      <main>
        <HeroSection />
        <StemAreasSection />
        <PublicStats />
        <FeaturedProjects />
      </main>
    </PublicLayout>
  )
}
export default HomePage