import os
import json
import bedrock
import s3

response = {
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": json.dumps({"Message": "Updated"})
}


def lambda_handler(event, context):

    if 'queryStringParameters' in event and event['queryStringParameters'] is not None:
        if event['queryStringParameters'].get('raise') == 'yes':
            raise Exception('manual exacption triggered')

    MOTD_CONTENT_BUCKET = os.environ['MOTD_CONTENT_BUCKET']
    qoute = bedrock.get_qoute()

    html = f'''<html>
<body>
<p>{qoute.get('quote')}</p>
{f'<p>{qoute.get('person')}</p>' if qoute.get('person') != '' else '<p>--</p>'}
</body>
</html>'''

    s3.put_s3_object(
        bucket=MOTD_CONTENT_BUCKET,
        key='motd/index.html',
        type='text/html',
        body=html
    )

    response["body"] = json.dumps(qoute)
    return response
