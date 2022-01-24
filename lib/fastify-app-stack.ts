import * as dotenv from "dotenv";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as cdk from "@aws-cdk/core";

dotenv.config();

class FastifyAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "vpc", { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, "cluster", { vpc });

    this.createFargateService(cluster);
  }

  createFargateService(
    cluster: ecs.ICluster
  ): ecs_patterns.ApplicationLoadBalancedFargateService {
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "fargateService",
        {
          cluster,
          taskImageOptions: {
            containerPort: 3000,
            image: ecs.ContainerImage.fromRegistry(
              "andreiox/fastify-test-drive"
            ),
          },
        }
      );

    this.createAutoScaleForService(fargateService.service);

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
}

export { FastifyAppStack };
