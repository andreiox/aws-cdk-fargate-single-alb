aws-cdk-fargate-single-alb
==========================

Deploy multiple Fargate Services using only one Application Load Balancer

problem
-------

Using ecs_patterns it only creates a new ALB or adds a default listener to an existing ALB.

I would like to have more control of the listeners conditions. Such as, redirect to a specific service with a http header rule.

objective
---------

Create an ALB using specific cdk module **elbv2** and create an ECS Fargate Service without using ecs_patterns so I get more control over the service and ALB integration.

references
----------

-	[What is an Application Load Balancer?](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
-	[How to use one AWS loadbalancer for multiple services](https://www.youtube.com/watch?v=BNSh2TpkYEg)
-	[AWS Elastic Load Balancing: Load Balancer Best Practices](https://www.sumologic.com/blog/aws-elastic-load-balancer-best-practices/)
