# express-error-handler

  Fast, opinionated, minimalist error handler for [Express](https://www.npmjs.com/package/express) APIs.

```js
// Imagine you have your errors defined...
class OMGServiceError extends Error {}
class MehError extends Error {}
class InvalidUserDataError extends Error {
  constructor () {
    super('Oh noes!')
  }
}

const express = require('express')
const errorHandler = require('express-error-handler')
const mongoose = require('mongoose')
const app = express()

// And any of your services throws it...
app.get('/omg-service', () => {
  throw new OMGServiceError()
})

app.get('/meh', () => {
  throw new MehError()
})

app.post('/user', () => {
  throw new InvalidUserDataError()
})

const Cat = mongoose.model('Cat', new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    min: 0,
    max: 9999
  }
}))

app.get('/cat', (req, res, next) => {
  new Cat({
    age: -1
  }).save().catch(next)
})

// You can define this error handler...
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
```

And have all your error responses standardized :)

```bash
curl http://localhost:3000/omg-service
# {"errorCode":666,"message":"A wild TEAPOT appeared!"}
# StatusCode 418

curl http://localhost:3000/meh
# {"message":"Meh!"}
# StatusCode 500

curl -X POST http://localhost:3000/user
# {"errorCode":666,"message":"Useless data","validation":{"foo":"Oh noes! Obviously required","bar":"Oh noes! Should be bigger than 15 😉"}}
# StatusCode 400

# It also handles Mongoose validation errors :)
curl http://localhost:3000/cat
# {"message":"Operation failed due to invalid data","validation":{"name":"required","age":"minimum value: 0"}}
# StatusCode 400
```

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/).


```bash
npm install express-error-handler
```
or
```bash
yarn add express-error-handler
```

## Features

  * STANDARDIZED ERROR RESPONSES
  * A simple way to map all Errors thrown by your Express application to a HTTP statusCode and a simple, but yet, (hopefully) useful JSON response
  * No need to waste your time thinking about API error response patterns
  * Includes a built-in Mongoose validation error handler! 🙌🏼

## Quick Start

  Setup your Express API, then install this as a dependency:

```bash
npm install express-error-handler
```

  Map errors you want to be handled:

```js
class UserCashIsGone extends Error {}

const express = require('express')
const errorHandler = require('express-error-handler')
const app = express()

app.get('/check-fund', () => {
  throw new UserCashIsGone()
})

app.use(errorHandler({
  UserCashIsGone: {
    errorCode: 666,
    statusCode: 402,
    message: 'We dont know what happened. Please try again later...'
  }
}))

app.listen(3000)
```

  And everything handled by this error handler should look pretty similar!

## Examples

  For more examples, check the tests! It should be pretty straightforward.

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
npm install
npm test
```
or
```bash
yarn
yarn test
```

## License

  [MIT](LICENSE)