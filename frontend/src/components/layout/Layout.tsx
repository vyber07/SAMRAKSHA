import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#F4F6F9' }}>
      <Sidebar />
      <div style={{ flex: 1, paddingLeft: '240px', display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, minHeight: 'calc(100vh - 60px)', position: 'relative' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
export default Layout
