import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ProfileEditor } from '../../components/profile/ProfileEditor'

export const ProfilePage = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-3">
        <Link 
          to="/dashboard" 
          className="p-2 rounded-lg hover:bg-navy-100 text-navy-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-navy-900">Mi Perfil</h1>
      </div>
      
      <ProfileEditor />
    </div>
  )
}