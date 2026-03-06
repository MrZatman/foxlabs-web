'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FolderSearch, Loader2, Check, FolderGit2, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ScanResult {
  existing: string[]
  canImport: Array<{
    name: string
    path: string
    matchedSupabase?: string
  }>
  total: number
}

export default function ImportProjectsPage() {
  const router = useRouter()
  const [basePath, setBasePath] = useState('D:/FoxlabsProjects')
  const [scanning, setScanning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan() {
    setScanning(true)
    setError(null)
    setScanResult(null)
    setImportResult(null)

    try {
      const res = await fetch(`/api/admin/scan-projects?path=${encodeURIComponent(basePath)}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setScanResult(data)
      }
    } catch (err) {
      setError('Error al escanear carpeta')
    } finally {
      setScanning(false)
    }
  }

  async function handleImport() {
    setImporting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/scan-projects?path=${encodeURIComponent(basePath)}`, {
        method: 'POST'
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setImportResult({ created: data.created, skipped: data.skipped })
        // Refresh scan to show updated state
        setTimeout(() => {
          router.push('/admin/projects')
        }, 2000)
      }
    } catch (err) {
      setError('Error al importar proyectos')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Importar Proyectos</h1>
          <p className="text-zinc-400">Escanea una carpeta para importar proyectos</p>
        </div>
      </div>

      {/* Scan Form */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Carpeta Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="basePath">Ruta de la carpeta</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="basePath"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                placeholder="D:/MisProyectos"
                className="bg-zinc-800 border-zinc-700 font-mono"
              />
              <Button onClick={handleScan} disabled={scanning || !basePath}>
                {scanning ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <FolderSearch size={16} />
                )}
                <span className="ml-2">Escanear</span>
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Se buscarán subcarpetas que contengan proyectos
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResult && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resultados del Escaneo</span>
              <span className="text-sm font-normal text-zinc-400">
                {scanResult.total} carpetas encontradas
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Already exists */}
            {scanResult.existing.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">
                  Ya existen ({scanResult.existing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.existing.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-1 bg-zinc-800 text-zinc-500 rounded text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Can import */}
            {scanResult.canImport.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-400 mb-2">
                  Listos para importar ({scanResult.canImport.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scanResult.canImport.map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center justify-between p-2 bg-zinc-800/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <FolderGit2 size={16} className="text-orange-400" />
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-zinc-500 ml-2">{item.path}</span>
                        </div>
                      </div>
                      {item.matchedSupabase && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Database size={12} />
                          <span>{item.matchedSupabase}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scanResult.canImport.length === 0 && scanResult.existing.length > 0 && (
              <p className="text-zinc-400">Todos los proyectos ya fueron importados.</p>
            )}

            {/* Import button */}
            {scanResult.canImport.length > 0 && !importResult && (
              <div className="pt-4 border-t border-zinc-800">
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {importing ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                  ) : (
                    <Check size={16} className="mr-2" />
                  )}
                  Importar {scanResult.canImport.length} Proyectos
                </Button>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <Check size={20} />
                  <span className="font-medium">
                    {importResult.created} proyectos importados
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  Redirigiendo a la lista de proyectos...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
