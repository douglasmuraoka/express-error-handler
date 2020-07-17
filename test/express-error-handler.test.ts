import express from 'express'
import supertest from 'supertest'
import errorHandler from '../lib/index'

class SimpleError extends Error {}
class SimpleCustomMessageError extends Error {}
class SimpleConfigError extends Error {}
class SimpleConfigWithNoStatusCodeError extends Error {}
class SimpleConfigWithNoMessageDefinedError extends Error {
  constructor () {
    super('NOTICE ME!')
  }
}
class CustomValidationError extends Error {
  constructor () {
    super('Woopsie!')
  }
}
class CustomMiddlewareError extends Error {}
class ThrownBySomeoneWhoDislikedThisMiddlewareError extends Error {}

const app = express()

app.get('/unhandled', () => {
  throw new Error('foo')
})
app.get('/unhandled-string', () => {
  throw 'bar'
})
app.get('/simple', () => {
  throw new SimpleError()
})
app.get('/simple-custom-message', () => {
  throw new SimpleCustomMessageError()
})
app.get('/simple-config', () => {
  throw new SimpleConfigError()
})
app.get('/simple-config-no-status-code', () => {
  throw new SimpleConfigWithNoStatusCodeError()
})
app.get('/simple-config-no-message', () => {
  throw new SimpleConfigWithNoMessageDefinedError()
})
app.get('/custom-validation', () => {
  throw new CustomValidationError()
})
app.get('/custom-middleware', () => {
  throw new CustomMiddlewareError()
})
app.get('/full-custom-middleware', () => {
  throw new ThrownBySomeoneWhoDislikedThisMiddlewareError()
})

app.use(errorHandler({
  SimpleError: 'Oops, my bad',
  SimpleCustomMessageError: (err: Error) => `${err.constructor.name} thrown`,
  SimpleConfigError: {
    errorCode: 1,
    statusCode: 418,
    message: 'TEAPOT RULES'
  },
  SimpleConfigWithNoStatusCodeError: {
    message: err => `${err.constructor.name} thrown... and TEAPOT STILL RULES`
  },
  SimpleConfigWithNoMessageDefinedError: {
    errorCode: 999
  },
  CustomValidationError: {
    errorCode: 666,
    statusCode: 400,
    message: 'Useless data',
    validate: (err: Error) => ({
      foo: `${err.message} Obviously required`,
      bar: `${err.message} Should be bigger than 15 😉`
    })
  },
  CustomMiddlewareError: (req: express.Request, res: express.Response) => {
    res.set('X-Teapot-Secret', 'shhh')
    res.status(418).json({
      iKnowWhatImDoing: true
    })
  },
  ThrownBySomeoneWhoDislikedThisMiddlewareError: (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Here you have full access to do everything you want
    res.status(500).send('Disliked')
  }
}))

const request = supertest(app)

describe('unhandled errors', () => {
  it('should respond 500 with message', () => request.get('/unhandled').expect(500, { message: 'foo' }))

  it('should respond 500 with message (string thrown)', () => request.get('/unhandled-string').expect(500, { message: 'bar' }))
})

describe('message configurations', () => {
  it('should respond with the defined string', () => request.get('/simple').expect(500, { message: 'Oops, my bad' }))

  it('should respond with the string returned by func', () => request.get('/simple-custom-message').expect(500, { message: 'SimpleCustomMessageError thrown' }))
})

describe('object configurations', () => {
  it('should respond with correct statusCode, errorCode and message', () => request.get('/simple-config')
    .expect(418, {
      errorCode: 1,
      message: 'TEAPOT RULES'
    })
  )

  it('should respond with statusCode 500 and message', () => request.get('/simple-config-no-status-code')
    .expect(500, {
      message: 'SimpleConfigWithNoStatusCodeError thrown... and TEAPOT STILL RULES'
    })
  )

  it('should respond with statusCode 500 and errorCode 999', () => request.get('/simple-config-no-message')
    .expect(500, {
      errorCode: 999,
      message: 'NOTICE ME!'
    })
  )

  it('should response with correct statusCode, errorCode, message and validations', () => request.get('/custom-validation')
    .expect(400, {
      errorCode: 666,
      message: 'Useless data',
      validation: {
        foo: 'Woopsie! Obviously required',
        bar: 'Woopsie! Should be bigger than 15 😉'
      }
    })
  )
})

describe('functional configurations', () => {
  it('should run the express middleware defined by the user', () => request.get('/custom-middleware')
    .expect('X-Teapot-Secret', 'shhh')
    .expect(418, { iKnowWhatImDoing: true })
  )

  it('should run the express middleware defined by the angry user', () => request.get('/full-custom-middleware')
    .expect(500, 'Disliked')
  )
})
