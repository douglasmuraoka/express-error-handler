import express from 'express'
import 'express-async-errors'
import supertest from 'supertest'
import errorHandler from '../../lib/index'
import mongoose, { Schema } from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const Required = mongoose.model('Required', new Schema({
  name: {
    type: String,
    required: true
  }
}))

const Entity = mongoose.model('Entity', new Schema({
  enum: {
    type: String,
    enum: ['foo', 'bar']
  },
  min: {
    type: Number,
    min: 10
  },
  max: {
    type: Number,
    max: 10
  },
  custom: {
    type: String,
    validate: {
      validator: value => Promise.resolve(value !== 'invalid'),
      message: 'Custom validator message'
    }
  }
}))

const Cast = mongoose.model('Cast', new Schema({
  date: {
    type: Date,
    required: true
  }
}))

const app = express()

app.get('/required', async (req, res) => {
  await new Required().save()
})

app.get('/enum', async (req, res) => {
  await new Entity({
    enum: 'omg'
  }).save()
})

app.get('/min', async (req, res) => {
  await new Entity({
    min: 1
  }).save()
})

app.get('/max', async (req, res) => {
  await new Entity({
    max: 11
  }).save()
})

app.get('/custom', async (req, res) => {
  await new Entity({
    custom: 'invalid'
  }).save()
})

app.get('/cast', async (req, res) => {
  await new Cast({
    date: 'foo'
  }).save()
})

app.get('/combined', async (req, res) => {
  await new Entity({
    enum: 'omg',
    min: 1,
    max: 11,
    custom: 'invalid'
  }).save()
})

app.use(errorHandler())

const request = supertest(app)

describe('mongoose error handler', () => {
  beforeAll(async () => {
    const mongoServer = new MongoMemoryServer()
    const mongoUri = await mongoServer.getUri()
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    mongoose.connection.on('error', e => {
      console.error(e)
    })
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  it('should respond 400 due to required field', () =>
    request.get('/required').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        name: 'required'
      }
    })
  )

  it('should respond 400 due to invalid enum value', () =>
    request.get('/enum').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        enum: 'expected values: ["foo","bar"]"'
      }
    })
  )

  it('should respond 400 due to minimum attribute value', () =>
    request.get('/min').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        min: 'minimum value: 10'
      }
    })
  )

  it('should respond 400 due to maximum attribute value', () =>
    request.get('/max').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        max: 'maximum value: 10'
      }
    })
  )

  it('should respond 400 due to custom field validation', () =>
    request.get('/custom').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        custom: 'Custom validator message'
      }
    })
  )

  it('should respond 400 due to wrong value type', () =>
    request.get('/cast').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: { date: 'expected type: date' }
    })
  )

  it('should respond 400 due to multiple validations', () =>
    request.get('/combined').expect(400, {
      message: 'Operation failed due to invalid data',
      validation: {
        enum: 'expected values: ["foo","bar"]"',
        min: 'minimum value: 10',
        max: 'maximum value: 10',
        custom: 'Custom validator message'
      }
    })
  )
})
