import { type PublicUser } from '#types/user'

export type LoungePeer = {
  user: PublicUser
  timer: { running: boolean; elapsed: number; timestamp: number; duration?: number } | null
}
