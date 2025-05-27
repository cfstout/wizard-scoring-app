import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(players)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    
    const player = await prisma.player.create({
      data: { name }
    })
    
    return NextResponse.json(player, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}