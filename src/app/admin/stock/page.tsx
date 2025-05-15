'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

interface StockItem {
  id: string
  title: string
  description: string
  price: number
  stockCount: number
  category: string
  condition: string
  images: string[]
  createdAt: string
  updatedAt: string
  lowStockThreshold?: number
}

export default function StockManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<StockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  useEffect(() => {
    if (!session?.user?.isAdmin) {
      router.push('/')
      return
    }

    fetchStockItems()
  }, [session])

  const fetchStockItems = async () => {
    try {
      const response = await fetch('/api/admin/stock')
      const data = await response.json()
      setItems(data)
      // Check for low stock items
      const lowStock = data.filter((item: StockItem) => 
        item.stockCount <= (item.lowStockThreshold || 5)
      )
      setLowStockItems(lowStock)
    } catch (error) {
      console.error('Error fetching stock items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEditItem = (item: StockItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await fetch(`/api/admin/stock/${id}`, {
        method: 'DELETE',
      })
      fetchStockItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleExport = () => {
    const exportData = items.map(item => ({
      Title: item.title,
      Description: item.description,
      Price: item.price,
      'Stock Count': item.stockCount,
      Category: item.category,
      Condition: item.condition,
      'Low Stock Threshold': item.lowStockThreshold || 5,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Items')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(data, 'stock-items.xlsx')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const response = await fetch('/api/admin/stock/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData),
        })

        if (response.ok) {
          fetchStockItems()
        }
      } catch (error) {
        console.error('Error importing stock items:', error)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const displayedItems = showLowStockOnly ? lowStockItems : items

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-4 py-2 rounded ${
              showLowStockOnly
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {showLowStockOnly ? 'Show All Items' : 'Show Low Stock'}
            {lowStockItems.length > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                {lowStockItems.length}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export
          </button>
          <label className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer">
            Import
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={handleAddItem}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-lg shadow-md overflow-hidden ${
              item.stockCount <= (item.lowStockThreshold || 5)
                ? 'border-2 border-red-500'
                : ''
            }`}
          >
            <div className="relative h-48">
              <Image
                src={item.images[0] || '/placeholder.jpg'}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(item.price)}
                </span>
                <span
                  className={`text-sm ${
                    item.stockCount <= (item.lowStockThreshold || 5)
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-500'
                  }`}
                >
                  Stock: {item.stockCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{item.category}</span>
                <span className="text-sm text-gray-500">{item.condition}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              {selectedItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            {/* Add form fields here */}
          </div>
        </div>
      )}
    </div>
  )
} 