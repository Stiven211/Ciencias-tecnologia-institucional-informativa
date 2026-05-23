import { PublicNavbar } from '../../components/public/PublicNavbar'
import { HeroSection } from '../../components/public/HeroSection'
import { PublicStats } from '../../components/public/PublicStats'
import { FeaturedProjects } from '../../components/public/FeaturedProjects'
import { PublicFooter } from '../../components/public/PublicFooter'

export const HomePage = () => {
  return (
    <>
      <PublicNavbar />
      <main>
        <HeroSection />
        <PublicStats />
        <FeaturedProjects />
      </main>
      <PublicFooter />
    </>
  )
}
export default HomePage