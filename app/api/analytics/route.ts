import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Analytics from '@/models/Analytics'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'daily' | 'weekly' | 'monthly' || 'daily'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const generate = searchParams.get('generate') === 'true'

    // Build date range
    let dateRange: any = {}
    if (startDate && endDate) {
      dateRange = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    } else {
      // Default to last 30 days for daily, last 12 weeks for weekly, last 12 months for monthly
      const now = new Date()
      const start = new Date()
      
      switch (type) {
        case 'weekly':
          start.setDate(now.getDate() - (12 * 7))
          break
        case 'monthly':
          start.setMonth(now.getMonth() - 12)
          break
        default: // daily
          start.setDate(now.getDate() - 30)
      }
      
      dateRange = {
        date: { $gte: start, $lte: now }
      }
    }

    // If generate flag is true, generate missing analytics
    if (generate) {
      const existingDates = await Analytics.find({ type, ...dateRange })
        .select('date')
        .lean()

      const existingDateStrings = existingDates.map((d: any) => d.date.toISOString().split('T')[0])
      
      // Generate missing analytics for the date range
      const startGenerate = dateRange.date.$gte
      const endGenerate = dateRange.date.$lte
      const currentDate = new Date(startGenerate)

      while (currentDate <= endGenerate) {
        const dateString = currentDate.toISOString().split('T')[0]
        
        if (!existingDateStrings.includes(dateString)) {
          try {
            await (Analytics as any).generateAnalytics(new Date(currentDate), type)
          } catch (error) {
            console.error(`Error generating analytics for ${dateString}:`, error)
          }
        }

        // Move to next period
        switch (type) {
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7)
            break
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1)
            break
          default: // daily
            currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    }

    // Fetch analytics data
    const analytics = await Analytics.find({ type, ...dateRange })
      .sort({ date: -1 })
      .lean()

    // Calculate summary statistics
    const summary = analytics.reduce((acc: any, curr: any) => {
      acc.totalRevenue += curr.metrics.totalRevenue || 0
      acc.totalOrders += curr.metrics.totalOrders || 0
      acc.totalSales += curr.metrics.totalSales || 0
      acc.totalUsers += curr.metrics.newUsers || 0
      acc.totalReviews += curr.metrics.totalReviews || 0
      return acc
    }, {
      totalRevenue: 0,
      totalOrders: 0,
      totalSales: 0,
      totalUsers: 0,
      totalReviews: 0
    })

    summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0

    return NextResponse.json({
      analytics,
      summary,
      type,
      dateRange: {
        start: dateRange.date.$gte,
        end: dateRange.date.$lte
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/analytics/generate - Generate analytics for specific date
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { date, type } = await request.json()

    if (!date || !type) {
      return NextResponse.json(
        { error: 'Fecha y tipo son requeridos' },
        { status: 400 }
      )
    }

    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo debe ser daily, weekly o monthly' },
        { status: 400 }
      )
    }

    const analytics = await (Analytics as any).generateAnalytics(new Date(date), type)

    return NextResponse.json({
      message: 'Analytics generados exitosamente',
      analytics
    })

  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
