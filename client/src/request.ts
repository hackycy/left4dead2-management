import axios, { type AxiosRequestConfig } from 'axios'

export class AppError extends Error {
  constructor(message: string) {
    super(message)
  }

  toString() {
    return this.message
  }
}

const _request = axios.create({
  timeout: 1000 * 30,
})

_request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code === 0) {
      return data.data
    } else {
      return Promise.reject(new AppError(data.msg))
    }
  },
  (error) => {
    if (error?.response?.data?.msg) {
      return Promise.reject(new AppError(error.response.data.msg))
    } else {
      return Promise.reject(new AppError(`${error}`))
    }
  }
)

export function request<T = any>(config: AxiosRequestConfig): Promise<T> {
  return _request(config)
}
