import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import {
  InternalServerError,
  InvalidApiRequestError,
  InvalidApiTokenError,
  NotFoundError,
  PermissionError,
  UnexpectedError
} from '@/services/axios/errors'
import { loadContractServicePlan } from '@/services/contract-services'
import { describe, expect, it, vi } from 'vitest'

const fixture = {
  clientId: 'abc123',
  products: [
    { name: 'product-A', slug: 'plan_ABC' },
    { name: 'product-B', slug: 'support_ABC' },
    { name: 'product-C', slug: 'ABC' }
  ]
}

const makeSut = () => {
  const sut = loadContractServicePlan

  return {
    sut
  }
}

describe.concurrent('ContractServices', () => {
  it('should call the API service with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: null
    })

    const { sut } = makeSut()

    await sut({
      clientId: fixture.clientId
    })

    expect(requestSpy).toHaveBeenCalledWith({
      method: 'GET',
      url: `v3/contract/${fixture.clientId}/products`
    })
  })

  it('should not match service plan as developer', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [...fixture.products]
    })

    const { sut } = makeSut()

    const response = await sut({
      clientId: 'stub-client-id'
    })

    expect(response).toEqual({
      isDeveloperSupportPlan: false
    })
  })

  it('should match the service plan as developer plan', async () => {
    const productMock = {
      name: 'product-D',
      slug: 'mock-slug'
    }
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: [productMock]
    })

    const { sut } = makeSut()

    const response = await sut({
      clientId: 'stub-client-id'
    })

    expect(response).toEqual({
      isDeveloperSupportPlan: true
    })
  })

  it.each([
    {
      statusCode: 400,
      expectedError: new InvalidApiRequestError().message
    },
    {
      statusCode: 401,
      expectedError: new InvalidApiTokenError().message
    },
    {
      statusCode: 403,
      expectedError: new PermissionError().message
    },
    {
      statusCode: 404,
      expectedError: new NotFoundError().message
    },
    {
      statusCode: 500,
      expectedError: new InternalServerError().message
    },
    {
      statusCode: 'unmappedStatusCode',
      expectedError: new UnexpectedError().message
    }
  ])(
    'should throw when request fails with statusCode $statusCode',
    async ({ statusCode, expectedError }) => {
      vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
        statusCode,
        body: null
      })
      const { sut } = makeSut()

      const response = sut({
        clientId: 'stub-client-id'
      })

      expect(response).rejects.toThrow(expectedError)
    }
  )
})
