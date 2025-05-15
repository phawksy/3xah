'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface VerificationStatus {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  documentType: string
  documentUrl: string
  additionalInfo: string
  createdAt: string
  updatedAt: string
  verificationScore?: number
  verificationDetails?: {
    documentAuthenticity: number
    faceMatch: number
    dataConsistency: number
  }
}

export default function VerificationPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    documentType: '',
    documentUrl: '',
    additionalInfo: '',
    documentImage: null as File | null,
    selfieImage: null as File | null,
  })
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchVerificationStatus()
  }, [session])

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching verification status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (file: File, type: 'document' | 'selfie') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await fetch('/api/verification/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          [type === 'document' ? 'documentUrl' : 'selfieUrl']: data.url,
        }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadProgress(0)

    try {
      // Upload images first
      if (formData.documentImage) {
        await handleImageUpload(formData.documentImage, 'document')
        setUploadProgress(50)
      }
      if (formData.selfieImage) {
        await handleImageUpload(formData.selfieImage, 'selfie')
        setUploadProgress(100)
      }

      // Submit verification request
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchVerificationStatus()
      }
    } catch (error) {
      console.error('Error submitting verification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Account Verification</h1>

      {status ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Verification Status</h2>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  status.status === 'APPROVED'
                    ? 'bg-green-100 text-green-800'
                    : status.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {status.status}
              </span>
              {status.status === 'APPROVED' && (
                <div className="flex items-center gap-1">
                  <Image
                    src="/verified-badge.svg"
                    alt="Verified"
                    width={20}
                    height={20}
                  />
                  <span className="text-sm text-green-600">Verified</span>
                </div>
              )}
            </div>
          </div>

          {status.verificationScore && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Verification Score
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${status.verificationScore}%` }}
                ></div>
              </div>
              {status.verificationDetails && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Document Authenticity</p>
                    <p className="text-lg font-semibold">
                      {status.verificationDetails.documentAuthenticity}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Face Match</p>
                    <p className="text-lg font-semibold">
                      {status.verificationDetails.faceMatch}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data Consistency</p>
                    <p className="text-lg font-semibold">
                      {status.verificationDetails.dataConsistency}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <p className="mt-1 text-gray-900">{status.documentType}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Information
              </label>
              <p className="mt-1 text-gray-900">{status.additionalInfo}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Submitted On
              </label>
              <p className="mt-1 text-gray-900">
                {new Date(status.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Submit Verification</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700"
              >
                Document Type
              </label>
              <select
                id="documentType"
                value={formData.documentType}
                onChange={(e) =>
                  setFormData({ ...formData, documentType: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a document type</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
                <option value="NATIONAL_ID">National ID</option>
                <option value="BUSINESS_LICENSE">Business License</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Document Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    documentImage: e.target.files?.[0] || null,
                  })
                }
                className="mt-1 block w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Selfie with Document
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    selfieImage: e.target.files?.[0] || null,
                  })
                }
                className="mt-1 block w-full"
                required
              />
            </div>

            <div>
              <label
                htmlFor="additionalInfo"
                className="block text-sm font-medium text-gray-700"
              >
                Additional Information
              </label>
              <textarea
                id="additionalInfo"
                value={formData.additionalInfo}
                onChange={(e) =>
                  setFormData({ ...formData, additionalInfo: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Please provide any additional information that might help with verification..."
              />
            </div>

            {isSubmitting && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
} 