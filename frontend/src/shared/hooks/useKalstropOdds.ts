import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const WS_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')
  : 'http://localhost:3000'

let _socket: Socket | null = null

function getSocket(): Socket {
  if (!_socket || _socket.disconnected) {
    _socket = io(`${WS_URL}/kalstrop`, { transports: ['websocket'], autoConnect: true })
  }
  return _socket
}

export interface LiveOdds {
  /** decimal odds for team[0] (home) */
  home?: number
  /** decimal odds for team[1] (away) */
  away?: number
  homeProbability?: number
  awayProbability?: number
  suspended?: boolean
}

function parseDecimal(num: string, den: string): number {
  return parseFloat(num) / parseFloat(den) + 1
}

export function useKalstropOdds(marketId: string | undefined): LiveOdds {
  const [odds, setOdds] = useState<LiveOdds>({})
  const subRef = useRef<string | null>(null)

  useEffect(() => {
    if (!marketId) return
    const socket = getSocket()
    subRef.current = marketId

    const handler = (data: any) => {
      if (data.marketId !== marketId) return
      const market = data.markets?.[0]
      if (!market) return
      if (market.status === 'SUSPENDED') {
        setOdds(prev => ({ ...prev, suspended: true }))
        return
      }
      const sels: any[] = market.selections ?? []
      if (sels.length < 2) return
      setOdds({
        home: parseDecimal(sels[0].oddsNumerator, sels[0].oddsDenominator),
        away: parseDecimal(sels[1].oddsNumerator, sels[1].oddsDenominator),
        homeProbability: parseFloat(sels[0].probability),
        awayProbability: parseFloat(sels[1].probability),
        suspended: false,
      })
    }

    socket.emit('subscribe-odds', { marketIds: [marketId] })
    socket.on('odds-updated', handler)

    return () => {
      socket.off('odds-updated', handler)
      socket.emit('unsubscribe-odds', { marketIds: [marketId] })
    }
  }, [marketId])

  return odds
}
