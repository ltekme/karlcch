import os
import json
import bedrock
import sns

response = {
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": json.dumps({"Message": "Updated"})
}


def lambda_handler(event, context):

    QOUTES_DYNAMODB_TABLE_ARN = os.environ["QOUTES_DYNAMODB_TABLE_ARN"]
    FAILED_UPDATE_SNS_ARN = os.environ["FAILED_UPDATE_SNS_ARN"]

    try:
        qoute = bedrock.get_qoute()
    except Exception as ex:
        sns.publish_sns_notification(
            topic_arn=QOUTES_DYNAMODB_TABLE_ARN,
            subject="MOTD ERROR: error cannot get motd from bedrock",
            message=ex
        )

    response["body"] = json.dumps(qoute)
    return response
