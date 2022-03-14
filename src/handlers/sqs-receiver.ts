import { SQSHandler } from 'aws-lambda'

export const handler: SQSHandler = ( event ) => {
  console.log(event.Records[0].body)
}
