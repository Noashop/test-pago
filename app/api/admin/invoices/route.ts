import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Invoice from '@/models/Invoice'
import { requireRole } from '@/lib/auth-middleware'
import { USER_ROLES } from '@/constants'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status')
      const search = searchParams.get('search')
      const limit = parseInt(searchParams.get('limit') || '50')
      const page = parseInt(searchParams.get('page') || '1')

      // Construir query
      const query: any = {}
      
      if (status && status !== 'all') {
        query.status = status
      }
      
      if (search) {
        query.$or = [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { customerEmail: { $regex: search, $options: 'i' } }
        ]
      }

      // Obtener facturas con paginación
      const skip = (page - 1) * limit
      
      const invoices = await Invoice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      // Obtener total de facturas para paginación
      const total = await Invoice.countDocuments(query)

      return NextResponse.json({
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      })

    } catch (error) {
      console.error('Get admin invoices error:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor' },
        { status: 500 }
      )
    }
  }

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const invoiceData = await request.json()

    // Validar campos requeridos
    const requiredFields = ['customerName', 'customerEmail', 'items', 'total']
    for (const field of requiredFields) {
      if (!invoiceData[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Generar número de factura único
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Crear nueva factura
    const newInvoice = await Invoice.create({
      ...invoiceData,
      invoiceNumber,
      status: invoiceData.status || 'pending',
      createdAt: new Date()
    })

    return NextResponse.json({
      message: 'Factura creada exitosamente',
      invoice: newInvoice
    }, { status: 201 })

  } catch (error) {
    console.error('Create admin invoice error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { invoiceId, ...updateData } = await request.json()

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de la factura es requerido' },
        { status: 400 }
      )
    }

    // Buscar y actualizar la factura
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Factura actualizada exitosamente',
      invoice
    })

  } catch (error) {
    console.error('Update admin invoice error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireRole(request, [USER_ROLES.ADMIN])
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de la factura es requerido' },
        { status: 400 }
      )
    }

    const invoice = await Invoice.findByIdAndDelete(invoiceId)

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Factura eliminada exitosamente'
    })

  } catch (error) {
    console.error('Delete admin invoice error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}