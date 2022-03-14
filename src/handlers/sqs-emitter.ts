import { config, SQS } from 'aws-sdk'

export const sqsSendMessage = async (message: string) => {
  try {
    config.update({ region: process.env.AWS_REGION })

    const sqs = new SQS({ apiVersion: '2012-11-05' })

    const params = {
      DelaySeconds: 30,
      MessageBody: message,
      QueueUrl: process.env.SQS_QUEUE_URL || 'example-queue-url'
    }

    await sqs.sendMessage(params).promise()
  } catch (err) {
    console.error('error', err)
  }
}

export const handler = async () => {
  return sqsSendMessage("example message")
}
