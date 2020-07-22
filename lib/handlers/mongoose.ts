import { Config, Validation } from '../index'
import { Error } from 'mongoose'

/**
 * Adds an error handler for Mongoose validation errors (CastError and ValidatorError).
 * 
 * It should respond with statusCode 400, and a validation object containing the error
 * message for each invalid property.
 * 
 * The validations for each property should be defined in the Schema.
 */
const mongooseErrorHandler : Config = {
  ValidationError: {
    statusCode: 400,
    message: 'Operation failed due to invalid data',
    validate: (err: Error) => {
      const validation = (err as Error.ValidationError)
      return Object.entries(validation.errors).reduce((acc, [property, err]) => {
        acc[property] = err.kind
        if (err.name === 'ValidatorError') {
          const validatorError = (err as Error.ValidatorError)
          switch (validatorError.kind) {
            case 'enum':
              acc[property] = `expected values: ${JSON.stringify((validatorError.properties as any).enumValues)}"`
              break
            case 'user defined':
              acc[property] = err.message
              break
            case 'min':
              acc[property] = `minimum value: ${(validatorError.properties as any).min}`
              break
            case 'max':
              acc[property] = `maximum value: ${(validatorError.properties as any).max}`
              break
            default:
              acc[property] = validatorError.kind   
          }
        } else {
          acc[property] = `expected type: ${err.kind}`
        }
        return acc
      }, {} as Validation)
    }
  }
}

export default mongooseErrorHandler