'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Star, ThumbsUp, ThumbsDown, Flag } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Review {
  _id: string
  user: {
    name: string
    avatar?: string
  }
  rating: number
  title: string
  comment: string
  createdAt: string
  helpful: number
  notHelpful: number
  verified: boolean
}

interface ProductReviewsProps {
  productId: string
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/products/${productId}/reviews`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleSubmitReview = async () => {
    if (!session) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para escribir una reseña',
        variant: 'destructive',
      })
      return
    }

    if (!newReview.title.trim() || !newReview.comment.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReview),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Reseña enviada',
          description: 'Tu reseña ha sido publicada exitosamente',
        })
        setNewReview({ rating: 5, title: '', comment: '' })
        setShowReviewForm(false)
        fetchReviews()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al enviar la reseña',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleHelpfulVote = async (reviewId: string, helpful: boolean) => {
    if (!session) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para votar',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ helpful }),
      })

      if (response.ok) {
        fetchReviews()
      }
    } catch (error) {
      console.error('Error voting on review:', error)
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            onClick={() => interactive && onRate && onRate(i + 1)}
            disabled={!interactive}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
          >
            <Star
              className={`h-5 w-5 ${
                i < rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reseñas de Clientes</CardTitle>
            {session && (
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant={showReviewForm ? 'outline' : 'default'}
              >
                {showReviewForm ? 'Cancelar' : 'Escribir Reseña'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aún no hay reseñas para este producto</p>
              <p className="text-sm">¡Sé el primero en escribir una!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  {(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)}
                </div>
                {renderStars(Math.round(reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length))}
                <span className="text-muted-foreground">
                  ({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = reviews.filter(review => review.rating === rating).length
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                  
                  return (
                    <div key={rating} className="flex items-center space-x-2 text-sm">
                      <span className="w-3">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Escribir una Reseña</CardTitle>
            <CardDescription>
              Comparte tu experiencia con este producto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Calificación</label>
              {renderStars(newReview.rating, true, (rating) => 
                setNewReview(prev => ({ ...prev, rating }))
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Título de la reseña</label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Resumen de tu experiencia"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tu reseña</label>
              <Textarea
                value={newReview.comment}
                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Cuéntanos qué te pareció el producto..."
                rows={4}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Publicar Reseña'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReviewForm(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar>
                    <AvatarImage src={review.user.avatar} />
                    <AvatarFallback>
                      {review.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.user.name}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Compra verificada
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {renderStars(review.rating)}
                      <span className="font-medium">{review.title}</span>
                    </div>

                    <p className="text-muted-foreground">{review.comment}</p>

                    <div className="flex items-center space-x-4 pt-2">
                      <span className="text-sm text-muted-foreground">
                        ¿Te resultó útil esta reseña?
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpfulVote(review._id, true)}
                          className="text-muted-foreground hover:text-green-600"
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {review.helpful}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHelpfulVote(review._id, false)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {review.notHelpful}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-orange-600"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
