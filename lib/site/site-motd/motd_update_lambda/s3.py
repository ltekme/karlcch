import boto3


def put_s3_object(bucket: str, key: str, type: str, body: str):
    client = boto3.client('s3')
    client.put_object(
        Bucket=bucket,
        Key=key,
        Body=body.encode('utf-8'),
        ContentEncoding='utf-8',
        ContentType=type
    )
