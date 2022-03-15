import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const getSSMUrl = (queueArn: string) => {
  const indexOf = queueArn.lastIndexOf(":")
  return queueArn.slice(0, indexOf)
}

export class LambdaWithSqsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, `SQS-queue-${process.env.ENVIRONMENT}`, {
      visibilityTimeout: Duration.seconds(300)
    });

    const eventSource = new SqsEventSource(queue)

    const SSMGoogleCredential = new ssm.StringParameter(this, `SSM-Google-Credential-${process.env.ENVIRONMENT}`, {
      allowedPattern: '.*',
      description: 'Google credentials json',
      parameterName: 'gcp-credentials',
      stringValue: process.env.GOOGLE_CREDENTIALS || 'default' ,
      tier: ssm.ParameterTier.STANDARD,
    });

    const SSMGithubCredential = new ssm.StringParameter(this, `SSM-Github-Credential-${process.env.ENVIRONMENT}`, {
      allowedPattern: '.*',
      description: 'Github credentials json',
      parameterName: 'github-credentials',
      stringValue: process.env.GITHUB_CREDENTIALS || 'default' ,
      tier: ssm.ParameterTier.STANDARD,
    });

    const SSMQueueUrl = new ssm.StringParameter(this, `SSM-SQS-queue-url-${process.env.ENVIRONMENT}`, {
      allowedPattern: '.*',
      description: 'Queue url',
      parameterName: 'queue-url',
      stringValue: queue.queueUrl ,
      tier: ssm.ParameterTier.STANDARD,
    });

    const handler = new lambda.NodejsFunction(this, `lambda-emitter-${process.env.ENVIRONMENT}`, {
      entry: './src/handlers/sqs-emitter.ts',
      runtime: Runtime.NODEJS_14_X,
      memorySize: 512,
      handler: 'handler',
      environment:{
        AWS_SQS_REGION: process.env.AWS_REGION || 'example-region',
        SSM_SQS_QUEUE: SSMQueueUrl.parameterName,
        SSM_GOOGLE_CREDENTIALS: SSMGoogleCredential.parameterName,
        SSM_GITHUB_CREDENTIALS: SSMGithubCredential.parameterName
      }
    })

    handler.addToRolePolicy(new iam.PolicyStatement({
      resources: [queue.queueArn],
      actions: ['sqs:*']
    }))

    handler.addToRolePolicy(new iam.PolicyStatement({
      resources: [`${getSSMUrl(SSMQueueUrl.parameterArn)}/*`],
      actions: ['ssm:*']
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
