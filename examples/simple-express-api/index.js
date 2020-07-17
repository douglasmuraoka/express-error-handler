const express = require('express')
const errorHandler = require('@douglasmuraoka/express-error-handler')

class OMGServiceError extends Error {}
class MehError extends Error {}
class InvalidUserDataError extends Error {
  constructor () {
    super('Oh noes!')
  }
}

const app = express()

app.get('/omg-service', () => {
  throw new OMGServiceError()
})

app.get('/meh', () => {
  throw new MehError()
})

app.post('/user', () => {
  throw new InvalidUserDataError()
})

app.use(errorHandler({
  OMGServiceError: {
    errorCode: 666,
    statusCode: 418,
    message: 'A wild TEAPOT appeared!'
  },
  MehError: 'Meh!',
  InvalidUserDataError: {
    errorCode: 666,
    statusCode: 400,
    message: 'Useless data',
    validate: err => ({
      foo: `${err.message} Obviously required`,
      bar: `${err.message} Should be bigger than 15 😉`
    })
  }
}))

app.listen(3000)