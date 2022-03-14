import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class LambdaWithSqsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, `SQS-queue-${process.env.ENVIRONMENT}`, {
      visibilityTimeout: Duration.seconds(300)
    });

    const eventSource = new SqsEventSource(queue)

    const handler = new lambda.NodejsFunction(this, `lambda-emitter-${process.env.ENVIRONMENT}`, {
      entry: './src/handlers/sqs-emitter.ts',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 512,
      handler: 'handler',
      environment:{
        AWS_SQS_REGION: process.env.AWS_REGION || 'example-region',
        SQS_QUEUE_URL: queue.queueUrl

      }
    })

    handler.addToRolePolicy(new iam.PolicyStatement({
      resources: [queue.queueArn],
      actions: ['sqs:*']
    }))

    new lambda.NodejsFunction(this, `lambda-receiver-${process.env.ENVIRONMENT}`, {
      entry: './src/handlers/sqs-receiver.ts',
      runtime: Runtime.NODEJS_14_X,
      events: [eventSource],
      memorySize: 512,
      handler: 'handler'
    })

  }
}
