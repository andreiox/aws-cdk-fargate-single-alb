import * as dotenv from "dotenv";
import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as elbv2 from "@aws-cdk/aws-elasticloadbalancingv2";

dotenv.config();

class FastifyAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "vpc", { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, "cluster", { vpc });

    const loadbalancer = new elbv2.ApplicationLoadBalancer(this, "alb", {
      vpc: vpc,
      internetFacing: true,
    });

    const listener = loadbalancer.addListener("listener", {
      port: 80,
      open: true,
    });

    listener.addAction("default", {
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: elbv2.ContentType.TEXT_PLAIN,
        messageBody: "OK",
      }),
    });

    const serviceName1 = "fastify-test-drive";
    const service1 = this.createFargateService(cluster, serviceName1);
    this.addTarget(service1, listener, serviceName1);
  }

  createFargateService(
    cluster: ecs.ICluster,
    serviceName: string
  ): ecs.FargateService {
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `taskdefinition-${serviceName}`,
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    );

    const container = taskDefinition.addContainer("web", {
      image: ecs.ContainerImage.fromRegistry("andreiox/fastify-test-drive"),
      environment: { PORT: "3000" },
    });

    container.addPortMappings({
      containerPort: 3000,
      hostPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    const fargateService = new ecs.FargateService(
      this,
      `fargate-${serviceName}`,
      {
        cluster: cluster,
        taskDefinition,
        desiredCount: 1,
      }
    );

    this.createAutoScaleForService(fargateService);

    return fargateService;
  }

  createAutoScaleForService(service: ecs.FargateService): void {
    const scalling = service.autoScaleTaskCount({ maxCapacity: 2 });
    scalling.scaleOnCpuUtilization("CpuScaling", {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }

  addTarget(
    service: ecs.FargateService,
    listener: elbv2.IApplicationListener,
    targetName: string
  ) {
    listener.addTargets(`ecs-${targetName}`, {
      port: 80,
      priority: 1,
      conditions: [elbv2.ListenerCondition.httpHeader("target", [targetName])],
      targets: [
        service.loadBalancerTarget({
          containerName: "web",
          containerPort: 3000,
        }),
      ],
      healthCheck: {
        interval: cdk.Duration.seconds(5),
        healthyHttpCodes: "200",
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(4),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });
  }
}

export { FastifyAppStack };
