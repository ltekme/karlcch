import os
import json
import bedrock
import s3
from jinja2 import Template
import datetime
import sitemap
import xml.etree.ElementTree as ET

response = {
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": json.dumps({"Message": "Updated"})
}


def lambda_handler(event, context):

    MOTD_CONTENT_BUCKET = os.environ['MOTD_CONTENT_BUCKET']
    DOMAIN_NAME = os.environ['DOMAIN_NAME']

    qoute = bedrock.get_qoute()
    print(qoute)

    motd_page_template = Template(open('templates/page.jinja').read())
    s3.put_s3_object(
        bucket=MOTD_CONTENT_BUCKET,
        key='motd/index.html',
        type='text/html',
        body=motd_page_template.render(qoute=qoute)
    )

    ET.register_namespace('', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    root = ET.fromstring(
        f'<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://{DOMAIN_NAME}/</loc><lastmod>2024-08-29</lastmod></url></urlset>')
    root.append(sitemap.UrlElement(
        f'https://{DOMAIN_NAME}/motd/',
        f'{datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}+00:00',
        'hourly'
    ))

    s3.put_s3_object(
        bucket=MOTD_CONTENT_BUCKET,
        key='sitemap.xml',
        type='text/xml',
        body=ET.tostring(root).decode()
    )

    response["body"] = json.dumps({'qoute': qoute})
    return response
