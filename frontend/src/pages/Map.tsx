import { CrimeMap } from '../components/map/CrimeMap'

export function MapPage() {
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }}>
      <CrimeMap />
    </div>
  )
}
export default MapPage
