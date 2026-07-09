import { useAuth } from './useAuth'

export function useRBAC() {
  const { officer } = useAuth()

  const can = (action: string): boolean => {
    const permissions: Record<string, string[]> = {
      'view_map':        ['constable','io','sho','dcp','admin'],
      'create_fir':      ['io','sho','admin'],
      'view_cases':      ['io','sho','dcp','admin'],
      'generate_docs':   ['io','sho','admin'],
      'view_cctv':       ['sho','dcp','admin'],
      'assistant_all':   ['sho','dcp','admin'],
      'view_analytics':  ['sho','dcp','admin'],
      'admin_settings':  ['admin'],
    }
    return permissions[action]?.includes(officer?.role || '') ?? false
  }

  return { can, role: officer?.role }
}
