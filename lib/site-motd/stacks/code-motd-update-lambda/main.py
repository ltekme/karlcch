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

    print(event)

    if 'queryStringParameters' in event and event['queryStringParameters'] is not None:
        if event['queryStringParameters'].get('raise') == 'yes':
            raise Exception('manual exacption triggered')

    qoute = bedrock.get_qoute()

    response["body"] = json.dumps(qoute)
    return response
