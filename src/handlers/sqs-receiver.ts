import { SQSHandler } from 'aws-lambda'

export const handler: SQSHandler = ( event ) => {
  const sqsEvent = JSON.parse(event.Records[0].body)
  console.log(sqsEvent)
}
