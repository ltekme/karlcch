import boto3
import json

from botocore.exceptions import ClientError


def get_qoute() -> dict:

    client = boto3.client("bedrock-runtime")
    prompt = """You are an internet user with lots of wisdm to share. 
Your job is to write a short positive message qoute to motive someone's day. 
The output should follow the following json format.
The qoute shoud not be longer then 24 words and should only contains words no hashtags.

format: 
{
"qoute": "",
"person": ""
}

output:"""

    response = client.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        body=json.dumps(
            {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ],
                    }
                ],
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 120,
                "temperature": 1,
                "top_k": 0,
                "top_p": 0,
            }
        ),
    )
    model_response = json.loads(response["body"].read())
    response_text = model_response["content"][0]["text"]
    return json.loads(response_text)
