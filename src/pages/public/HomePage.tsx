import { PublicLayout } from '../../components/layout/PublicLayout'
import { HeroSection } from '../../components/public/HeroSection'
import { StemAreasSection } from '../../components/public/StemAreasSection'
import { FeaturedProjects } from '../../components/public/FeaturedProjects'

export const HomePage = () => {
  return (
    <PublicLayout>
      <main>
        <HeroSection />
        <StemAreasSection />
        <FeaturedProjects />
      </main>
    </PublicLayout>
  )
}
export default HomePage