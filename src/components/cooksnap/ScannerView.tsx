'use client'

import { useAppStore } from '@/lib/store'
import { Camera, Upload, ArrowLeft, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { toast } from '@/hooks/use-toast'

export default function ScannerView() {
  const {
    setCurrentView,
    setScannedImage,
    setDetectedIngredients,
    setIsScanning,
    isScanning,
    scannedImage,
  } = useAppStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file', variant: 'destructive' })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 10MB', variant: 'destructive' })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setScannedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Send to API for scanning
    setIsScanning(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Scan failed')
      }

      const data = await response.json()
      setDetectedIngredients(data.ingredients || [])

      if (data.ingredients && data.ingredients.length > 0) {
        toast({
          title: 'Ingredients detected!',
          description: `Found ${data.ingredients.length} items in your image`,
        })
        setCurrentView('confirm')
      } else {
        toast({
          title: 'No ingredients detected',
          description: 'Try taking a clearer photo or type ingredients manually',
        })
      }
    } catch (error) {
      console.error('Scan error:', error)
      toast({
        title: 'Scan failed',
        description: 'Could not analyze the image. Please try again or type ingredients manually.',
        variant: 'destructive',
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <div className="view-transition min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView('home')}
            className="text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Scan Your Fridge</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 flex flex-col gap-6">
        {/* Upload Area */}
        {!scannedImage ? (
          <div
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all min-h-[300px] ${
              dragOver
                ? 'border-orange-400 bg-orange-50'
                : 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-orange-500" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground mb-1">Upload a Photo</h3>
              <p className="text-sm text-muted-foreground">
                Take a photo of your fridge, pantry, or ingredients spread
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-5"
                disabled={isScanning}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl py-5"
                disabled={isScanning}
              >
                <Upload className="w-4 h-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden shadow-md">
            <img
              src={scannedImage}
              alt="Scanned fridge"
              className="w-full max-h-[350px] object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 rounded-full w-8 h-8"
              onClick={() => setScannedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isScanning && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center pulse-soft">
              <Camera className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-sm font-medium text-foreground">Analyzing your fridge...</p>
            <p className="text-xs text-muted-foreground">AI is identifying ingredients</p>
          </div>
        )}

        {/* Tips */}
        {!isScanning && !scannedImage && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 text-sm mb-2">Tips for best results:</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Good lighting helps the AI see better</li>
              <li>• Spread items out so they&apos;re visible</li>
              <li>• Include labels on packaged items</li>
              <li>• You can always add missing items manually</li>
            </ul>
          </div>
        )}

        {/* Skip to manual */}
        {!isScanning && (
          <div className="text-center">
            <Button
              variant="link"
              className="text-orange-600"
              onClick={() => setCurrentView('confirm')}
            >
              Or type your ingredients manually →
            </Button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
