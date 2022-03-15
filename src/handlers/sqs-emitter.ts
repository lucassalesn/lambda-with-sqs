import { config, SQS, SSM } from 'aws-sdk'

export const sqsSendMessage = async (message: string) => {
  try {
    config.update({ region: process.env.AWS_SQS_REGION })

    const sqs = new SQS({ apiVersion: '2012-11-05' })

    const ssm = new SSM({ apiVersion: '2012-11-05'})

    const parameterValue = await ssm.getParameter({ Name: process.env.SSM_QUEUE_URL || '' , WithDecryption: true }).promise();

    console.log(parameterValue)

    const params = {
      DelaySeconds: 30,
      MessageBody: message,
      QueueUrl: parameterValue.Parameter?.Value || ""
    }

    await sqs.sendMessage(params).promise()
  } catch (err) {
    console.error('error', err)
  }
}

export const handler = async () => {
  return sqsSendMessage("example message")
}
