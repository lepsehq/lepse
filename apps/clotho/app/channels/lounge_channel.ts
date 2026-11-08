import Lounge from '#models/lounge'
import { LoungePeer } from '#types/index'
import { PublicUser } from '#types/user'
import { searchLoungeValidator } from '#validators/lounge'
import { BaseChannel, SocketResponseError } from '@rlanz/socket'
import { onMessage } from '@rlanz/socket/decorators'
import type {
  AuthenticatedSocket,
  Middleware,
  PresenceInfo,
  PresenceMember,
} from '@rlanz/socket/types'

type ServerEvents = {
  'lounge:resync': null
  'lounge:timer': LoungePeer
  'lounge:closed': null
}

export default class LoungeChannel extends BaseChannel<PublicUser, ServerEvents> {
  static pattern = 'lounge/:id'
  static options = { presence: true }
  static middlewares: Middleware<PublicUser>[] = [
    async (ctx, next) => {
      // Validate invite code
      const [, result] = await searchLoungeValidator.tryValidate({ id: ctx.params.id })
      if (!result) {
        throw new SocketResponseError('400: Invalid invite code')
      }

      await next()
    },
  ]

  // each channel instance caches this
  #hostId: string | undefined

  getPresenceInfo(socket: AuthenticatedSocket<PublicUser>): PresenceInfo {
    const { id, ...data } = socket.getUserOrFail()

    return {
      id: id.toString(),
      data,
    }
  }

  async onMemberJoin(socket: AuthenticatedSocket<PublicUser>, member: PresenceMember) {
    // Ensure lounge exists
    const lounge = await Lounge.findBy('id', this.params.id)
    if (!lounge) {
      throw new SocketResponseError('404: Lounge does not exist')
    }
    this.#hostId = String(lounge.userId) // set hostId

    // Disallow second joins to the same lounge
    const userId = socket.getUserOrFail().id.toString()
    const connections = this.presence
      .getLocalSockets(this.channelName)
      .filter(
        (connection) => this.presence.getLocalUser(this.channelName, connection.id)?.id === userId
      ).length
    if (connections > 1) {
      throw new SocketResponseError('409: You have already joined this lounge')
    }

    console.info(`[ws:lounge_channel] User '${member.id}' joined Lounge '${this.params.id}'`)
    this.broadcastExcept(socket.id, 'lounge:resync', null)
  }

  async onMemberLeave(_socket: AuthenticatedSocket<PublicUser>, member: PresenceMember) {
    console.info(`[ws:lounge_channel] User '${member.id}' left Lounge '${this.params.id}'`)
    const count = await this.presence.count(this.channelName)

    // If lounge channel is empty, or the host is leaving, delete Lounge
    if (count === 0 || member.id === this.#hostId) {
      await Lounge.query().where('id', this.params.id).delete()
    }
  }

  @onMessage('lounge:host')
  async sendHost(): Promise<string | undefined> {
    return this.#hostId
  }

  @onMessage('lounge:sync')
  async syncTimer(
    socket: AuthenticatedSocket<PublicUser>,
    { timer }: Pick<LoungePeer, 'timer'>
  ): Promise<LoungePeer> {
    const user = socket.getUserOrFail()

    const data = {
      user,
      timer,
    }

    this.broadcastExcept(socket.id, 'lounge:timer', data)
    return data
  }
}
