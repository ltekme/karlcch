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

    if "queryStringParameters" in event:
        if event['queryStringParameters'].get('throw') is not None:
            raise Exception('manual exacption triggered')

    qoute = bedrock.get_qoute()

    response["body"] = json.dumps(qoute)
    return response
