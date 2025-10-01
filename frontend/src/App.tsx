import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { CVEditorPage } from './pages/CVEditorPage'
import { CVManagerPage } from './pages/CVManagerPage'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header } from './components/Header'

function App() {
  const location = useLocation()
  const isEditorRoute = location.pathname.includes('/editor')

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Only show app header on non-editor routes */}
        {!isEditorRoute && <Header />}
        <Routes>
          <Route path="/" element={<CVManagerPage />} />
          <Route path="/editor" element={<CVEditorPage />} />
          <Route path="/editor/:cvId" element={<CVEditorPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App