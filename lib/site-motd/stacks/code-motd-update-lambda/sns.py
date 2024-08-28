import boto3


def publish_sns_notification(topic_arn: str, subject: str, message: str) -> None:
    
    client = boto3.client('sns')
    client.publish(
        TopicArn=topic_arn,
        Message=message,
        Subject=subject,
    )
