import { ApiError, createOrder, listOrders } from './ordersClient'

describe('ordersClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed orders when the list request succeeds', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 'order-1',
            customerId: 'C-100',
            amount: 250,
            isVip: false,
            requestedAt: '2026-08-14T15:00:00.000Z',
            timeZone: 'UTC',
            priority: 'high',
            status: 'created',
            createdAt: '2026-08-14T15:00:00.000Z',
          },
        ]),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    const result = await listOrders()

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/orders'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.customerId).toBe('C-100')
  })

  it('throws the backend error message when create fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'customerId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(
      createOrder({
        customerId: '',
        amount: 10,
        isVip: false,
        priority: 'low',
      }),
    ).rejects.toEqual(new ApiError('customerId is required', 400))
  })
})
