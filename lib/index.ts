import * as express from 'express'

type ErrorMessageGenerator = (error: Error) => string

interface Validation {
  [field:string]: string
}

type ValidationGenerator = (error: Error) => Validation

interface ErrorHandlingConfig {
  errorCode?: string | number,
  message?: string | ErrorMessageGenerator,
  statusCode?: number,
  validate?: ValidationGenerator
}

interface Config {
  [errorName:string]: string | ErrorHandlingConfig | ErrorMessageGenerator | express.RequestHandler | express.ErrorRequestHandler
}

interface ErrorResponse {
  errorCode?: string | number,
  message: string,
  validation?: Validation
}

export = (errorMapping: Config): express.ErrorRequestHandler => {
  return (err, req, res, next) => {
    const errorName = err.constructor.name
    const config = errorMapping[errorName]
    if (typeof config === 'string') {
      const response : ErrorResponse = { message: config }
      res.status(500).json(response)
    } else if (typeof config === 'object') {
      const { errorCode, message = err.message, statusCode = 500, validate } = config
      const response : ErrorResponse = {
        errorCode,
        message: typeof message === 'function' ? message(err) : message,
        validation: statusCode === 400 && typeof validate === 'function' ? validate(err) : undefined
      }
      res.status(statusCode).json(response)
    } else if (typeof config === 'function') {
      const handler = config
      switch (handler.length) {
        case 1: {
          const response : ErrorResponse = {
            message: (handler as ErrorMessageGenerator)(err)
          }
          res.status(500).json(response)
          break
        }
        case 2:
        case 3:
          (handler as express.RequestHandler)(req, res, next)
          break
        case 4:
          (handler as express.ErrorRequestHandler)(err, req, res, next)
          break
      }
    } else {
      const response : ErrorResponse = {
        message: err instanceof Error ? err.message : err.toString()
      }
      res.status(500).json(response)
    }
  }
}
