import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GalleryPage from './pages/GalleryPage'
import HomePage from './pages/HomePage'
import OriginPage from './pages/OriginPage'
import WorkbenchPage from './pages/WorkbenchPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/origin" element={<OriginPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/workbench" element={<WorkbenchPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
