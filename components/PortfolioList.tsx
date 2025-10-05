'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, FolderOpen, Edit, Trash2 } from 'lucide-react'
import { PortfolioStock } from '@/types/stocks'

interface SavedPortfolio {
  id: string
  name: string
  stocks: PortfolioStock[]
  total_amount: number
  created_at: string
}

export default function PortfolioList() {
  const router = useRouter()
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([])
  const [isLoadingPortfolios, setIsLoadingPortfolios] = useState(true)

  useEffect(() => {
    fetchSavedPortfolios()
  }, [])

  const fetchSavedPortfolios = async () => {
    setIsLoadingPortfolios(true)
    try {
      const response = await fetch('/api/portfolios')
      if (response.ok) {
        const data = await response.json()
        setSavedPortfolios(data.portfolios || data || [])
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error)
    } finally {
      setIsLoadingPortfolios(false)
    }
  }

  const deletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la cartera "${portfolioName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/portfolios?id=${portfolioId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Cartera eliminada exitosamente')
        fetchSavedPortfolios()
      } else {
        alert('Error eliminando cartera')
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error)
      alert('Error eliminando cartera')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FolderOpen size={24} className="text-primary-600" />
            <h2 className="text-2xl font-bold">Mis Carteras</h2>
          </div>
          <button
            onClick={() => router.push('/portfolios/new')}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            <Plus size={20} />
            Nueva Cartera
          </button>
        </div>
          
        {isLoadingPortfolios ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
          </div>
        ) : savedPortfolios.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FolderOpen size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No tienes carteras guardadas</p>
            <p className="text-sm">Haz clic en &quot;Nueva Cartera&quot; para crear tu primera cartera</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPortfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className="relative p-4 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all group"
              >
                {/* Botones de acción */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/portfolios/edit/${portfolio.id}`)}
                    className="p-2 bg-white dark:bg-gray-800 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors shadow-sm"
                    title="Editar cartera"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deletePortfolio(portfolio.id, portfolio.name)}
                    className="p-2 bg-white dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shadow-sm"
                    title="Eliminar cartera"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="pr-20">
                  <h3 className="font-bold text-lg mb-2">
                    {portfolio.name}
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                    <p>{portfolio.stocks.length} acciones</p>
                    <p className="font-semibold">${portfolio.total_amount.toLocaleString()}</p>
                    <p className="text-xs">{new Date(portfolio.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-3 mb-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Composición:</p>
                    {portfolio.stocks.map((stock) => (
                      <div key={stock.symbol} className="flex justify-between text-xs mb-1">
                        <span className="font-medium">{stock.symbol}</span>
                        <span className="text-gray-600 dark:text-gray-400">{stock.weight.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
