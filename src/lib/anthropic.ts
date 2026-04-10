import Anthropic from '@anthropic-ai/sdk'

// Lazy initialization to avoid build-time errors when key is missing
let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required for AI features')
    }
    _client = new Anthropic({ apiKey: key })
  }
  return _client
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
