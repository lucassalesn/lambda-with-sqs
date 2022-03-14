#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaWithSqsStack } from '../lib/lambda-with-sqs-stack';

const app = new cdk.App();
new LambdaWithSqsStack(app, `LambdaWithSqsStack-${process.env.ENVIRONMENT}`);
