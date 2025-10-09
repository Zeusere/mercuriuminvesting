'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, TrendingUp, DollarSign, Info } from 'lucide-react';

interface RunStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: {
    id: string;
    name: string;
    stocks: any[];
  };
}

export default function RunStrategyModal({ isOpen, onClose, portfolio }: RunStrategyModalProps) {
  const router = useRouter();
  const [name, setName] = useState(`${portfolio.name} - ${new Date().toLocaleDateString()}`);
  const [description, setDescription] = useState('');
  const [initialCapital, setInitialCapital] = useState('100000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio_id: portfolio.id,
          name,
          description,
          initial_capital: parseFloat(initialCapital)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create strategy');
      }

      const data = await response.json();
      
      // Redirect to strategy detail page
      router.push(`/strategies/${data.strategy.id}`);
      router.refresh();

    } catch (err) {
      console.error('Error creating strategy:', err);
      setError(err instanceof Error ? err.message : 'Failed to create strategy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Run Active Strategy
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                From: {portfolio.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">What is an Active Strategy?</p>
              <p className="text-blue-700 dark:text-blue-300">
                An active strategy is a live instance of your portfolio with real capital tracking. 
                It maintains your actual entry prices, tracks performance from a specific start date, 
                and allows you to make changes while preserving your complete trading history.
              </p>
            </div>
          </div>

          {/* Strategy Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Strategy Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My AI Strategy - October 2025"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Aggressive growth strategy focused on AI sector..."
            />
          </div>

          {/* Initial Capital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Initial Capital *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100000"
                min="1"
                step="0.01"
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              This is paper trading - no real money will be used
            </p>
          </div>

          {/* Portfolio Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Allocation
            </label>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              {portfolio.stocks.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stock.symbol}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {stock.weight}% (${((parseFloat(initialCapital) || 0) * stock.weight / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-900 dark:text-red-100">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Start Strategy
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

