import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { EleveDashboardPage } from '../pages/eleve/EleveDashboardPage'
import { EnseignantDashboardPage } from '../pages/enseignant/EnseignantDashboardPage'
import { LoginPage } from '../pages/landingpage/auth/LoginPage'
import { RegisterPage } from '../pages/landingpage/auth/RegisterPage'
import { HomePage } from '../pages/landingpage/public/HomePage'
import { CoursPage } from '../pages/landingpage/public/CoursPage'
import { DefisPage } from '../pages/landingpage/public/DefisPage'
import { FondateursPage } from '../pages/landingpage/public/FondateursPage'
import { ContactPage } from '../pages/landingpage/public/ContactPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cours" element={<CoursPage />} />
          <Route path="defis" element={<DefisPage />} />
          <Route path="fondateurs" element={<FondateursPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route path="eleve" element={<EleveDashboardPage />} />
        <Route path="enseignant" element={<EnseignantDashboardPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
