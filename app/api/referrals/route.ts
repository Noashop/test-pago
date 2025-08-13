import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectToDatabase } from '@/lib/mongodb'
import Referral from '@/models/Referral'
import Campaign from '@/models/Campaign'
import User from '@/models/User'
import Coupon from '@/models/Coupon'
import Notification from '@/models/Notification'

// GET - Obtener referidos del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let filters: any = { referrerId: session.user.id }
    
    if (status !== 'all') {
      filters.status = status
    }

    const referrals = await Referral.find(filters)
      .populate('referredId', 'name email')
      .populate('firstPurchase.orderId', 'total createdAt')
      .sort({ referralDate: -1 })

    // Obtener estadísticas
    const stats = {
      total: await Referral.countDocuments({ referrerId: session.user.id }),
      completed: await Referral.countDocuments({ referrerId: session.user.id, status: { $in: ['completed', 'rewarded'] } }),
      pending: await Referral.countDocuments({ referrerId: session.user.id, status: 'pending' }),
      rewarded: await Referral.countDocuments({ referrerId: session.user.id, status: 'rewarded' })
    }

    // Verificar elegibilidad para recompensa
    const completedReferrals = await Referral.countDocuments({ 
      referrerId: session.user.id, 
      status: 'completed' 
    })
    const eligibleForReward = completedReferrals >= 5 // Ejemplo: 5 referidos completados para recompensa

    return NextResponse.json({
      referrals,
      stats,
      eligibleForReward
    })

  } catch (error) {
    console.error('Error al obtener referidos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST - Crear nuevo referido
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectToDatabase()

    const { referredEmail } = await request.json()
    
    if (!referredEmail) {
      return NextResponse.json({ error: 'Email del referido requerido' }, { status: 400 })
    }

    // Verificar que el usuario referido existe
    const referredUser = await User.findOne({ email: referredEmail })
    if (!referredUser) {
      return NextResponse.json({ error: 'Usuario referido no encontrado' }, { status: 404 })
    }

    // Verificar que no se refiera a sí mismo
    if (referredUser._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'No puedes referirte a ti mismo' }, { status: 400 })
    }

    // Verificar que no existe ya un referido para este usuario
    const existingReferral = await Referral.findOne({ 
      referrerId: session.user.id, 
      referredId: referredUser._id 
    })
    
    if (existingReferral) {
      return NextResponse.json({ error: 'Ya has referido a este usuario' }, { status: 400 })
    }

    // Obtener campaña activa de referidos
    const referralCampaign = await Campaign.findOne({
      type: 'referral',
      status: 'active',
      isActive: true,
      'referralConfig.isEnabled': true,
      startDate: { $lte: new Date() },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } }
      ]
    })

    // Crear referido
    const referral = new Referral({
      referrerId: session.user.id,
      referredId: referredUser._id,
      campaignId: referralCampaign?._id
    })

    await referral.save()

    // Enviar notificación al usuario referido
    await Notification.create({
      userId: referredUser._id,
      title: '¡Has sido referido!',
      message: `${session.user.name} te ha referido a nuestra plataforma. ¡Realiza tu primera compra y ambos obtendrán beneficios!`,
      type: 'info',
      category: 'system',
      data: {
        referrerId: session.user.id,
        referralId: referral._id
      }
    })

    return NextResponse.json({
      message: 'Referido creado exitosamente',
      referral
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear referido:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Función para procesar recompensa de referidos (llamada desde webhook de orden completada)
async function processReferralReward(userId: string, orderId: string, orderAmount: number) {
  try {
    await connectToDatabase()

    // Buscar si este usuario fue referido
    const referral = await Referral.findOne({
      referredId: userId,
      status: 'pending'
    }).populate('campaignId')

    if (!referral) {
      return // No es un usuario referido o ya completó su primera compra
    }

    // Completar el referido
    await referral.completeReferral(orderId, orderAmount)

    // Verificar si el referidor es elegible para recompensa
    const referrerId = referral.referrerId.toString()
    const requiredReferrals = 10 // Default required referrals

    const completedReferralsCount = await Referral.countDocuments({ 
      referrerId, 
      status: 'completed' 
    })
    const isEligible = completedReferralsCount >= requiredReferrals

    if (isEligible) {
      // Generar recompensa
      const couponCode = generateReferralCouponCode()
      const rewardConfig = {
        type: 'discount_percentage' as const,
        value: 10,
        description: 'Descuento por referidos',
        couponCode
      }

      await referral.generateReward(rewardConfig)

      // Crear cupón
      await createReferralCoupon(rewardConfig, referrerId)

      // Notificar al referidor
      await Notification.create({
        userId: referrerId,
        title: '¡Recompensa por referidos!',
        message: `¡Felicitaciones! Has alcanzado ${requiredReferrals} referidos completados. Tu recompensa: ${rewardConfig.description}`,
        type: 'success',
        category: 'system',
        data: {
          couponCode,
          rewardType: rewardConfig.type,
          rewardValue: rewardConfig.value
        }
      })
    }

  } catch (error) {
    console.error('Error al procesar recompensa de referidos:', error)
  }
}

// Función para generar código de cupón de referidos
function generateReferralCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'REF'
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Función para crear cupón de referidos
async function createReferralCoupon(rewardConfig: any, userId: string) {
  const coupon = new Coupon({
    code: rewardConfig.couponCode,
    name: 'Recompensa por Referidos',
    description: rewardConfig.description,
    type: rewardConfig.type === 'discount_percentage' ? 'percentage' : 'fixed_amount',
    value: rewardConfig.value,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días
    isActive: true,
    status: 'active',
    usageLimit: 1,
    usedCount: 0,
    createdBy: userId
  })
  
  await coupon.save()
  return coupon
}
