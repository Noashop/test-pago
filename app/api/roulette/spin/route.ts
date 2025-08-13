import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Campaign from '@/models/Campaign'
import Spin from '@/models/Spin'
import Order from '@/models/Order'
import Coupon from '@/models/Coupon'

// POST - Girar la ruleta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
    }

    // Verificar que la orden existe y está completada
    const order = await Order.findById(orderId)
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para esta orden' }, { status: 403 })
    }

    if (order.status !== 'delivered' || order.paymentStatus !== 'paid') {
      return NextResponse.json({ 
        error: 'La orden debe estar completada y pagada para girar la ruleta' 
      }, { status: 400 })
    }

    // Verificar si el usuario ya giró para esta orden
    const existingSpin = await Spin.findOne({ userId: session.user.id, orderId })
    if (existingSpin) {
      return NextResponse.json({ 
        error: 'Ya has girado la ruleta para esta orden' 
      }, { status: 400 })
    }

    // Obtener campaña activa de ruleta
    const rouletteCampaign = await Campaign.findOne({
      type: 'roulette',
      status: 'active',
      isActive: true,
      'rouletteConfig.isEnabled': true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
      ]
    })

    if (!rouletteCampaign) {
      return NextResponse.json({ 
        error: 'No hay campañas de ruleta activas en este momento' 
      }, { status: 400 })
    }

    // Seleccionar premio basado en probabilidades
    const selectedPrize = selectPrizeByProbability(rouletteCampaign.rouletteConfig.prizes)
    
    if (!selectedPrize) {
      return NextResponse.json({ 
        error: 'Error al seleccionar premio' 
      }, { status: 500 })
    }

    // Crear el giro
    const spin = new Spin({
      userId: session.user.id,
      orderId,
      campaignId: rouletteCampaign._id,
      result: {
        prizeId: selectedPrize.id,
        prizeName: selectedPrize.name,
        prizeType: selectedPrize.type,
        prizeValue: selectedPrize.value,
        description: selectedPrize.name
      },
      expiresAt: new Date(Date.now() + (selectedPrize.conditions?.validDays || 30) * 24 * 60 * 60 * 1000)
    })

    // Si el premio es un cupón, generar código
    if (selectedPrize.type === 'coupon') {
      const couponCode = generateCouponCode()
      spin.generatedCouponCode = couponCode
      
      // Crear cupón en la base de datos
      await createCouponFromPrize(selectedPrize, couponCode, session.user.id, spin.expiresAt)
    }

    await spin.save()

    // Incrementar métricas de la campaña
    await Campaign.findByIdAndUpdate(rouletteCampaign._id, {
      $inc: { interactions: 1 }
    })

    return NextResponse.json({
      message: 'Giro exitoso',
      spin: {
        result: spin.result,
        generatedCouponCode: spin.generatedCouponCode,
        expiresAt: spin.expiresAt,
        status: spin.status
      }
    })

  } catch (error) {
    console.error('Error al girar la ruleta:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para seleccionar premio basado en probabilidades
function selectPrizeByProbability(prizes: any[]) {
  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0)
  const random = Math.random() * totalProbability
  
  let currentProbability = 0
  for (const prize of prizes) {
    currentProbability += prize.probability
    if (random <= currentProbability) {
      return prize
    }
  }
  
  return prizes[0] // Fallback al primer premio
}

// Función para generar código de cupón único
function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'SPIN'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Función para crear cupón desde premio
async function createCouponFromPrize(prize: any, code: string, userId: string, expiresAt: Date) {
  const coupon = new Coupon({
    code,
    name: `Premio Ruleta: ${prize.name}`,
    description: `Cupón generado por la ruleta - ${prize.name}`,
    type: prize.type === 'discount_percentage' ? 'percentage' : 'fixed_amount',
    value: prize.value,
    minAmount: prize.conditions?.minAmount || 0,
    startDate: new Date(),
    endDate: expiresAt,
    isActive: true,
    status: 'active',
    usageLimit: 1,
    usedCount: 0,
    createdBy: userId
  })
  
  await coupon.save()
  return coupon
}
