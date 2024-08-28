"""Template Lambda Function For HTTP API Gateway"""

import json

response = {
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": json.dumps({"Message": "Hello from Lambda!"})
}


def lambda_handler(event, context):
    """Template for Lambda Function"""

    # To be implemented
    print(event)

    return response
