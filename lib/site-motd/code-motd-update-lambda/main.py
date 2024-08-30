import os
import json
import bedrock
import s3
from packages.jinja2 import Template
import xml.etree.ElementTree as ET
import datetime

response = {
    "statusCode": 200,
    "headers": {
        "content-type": "application/json"
    },
    "body": json.dumps({"Message": "Updated"})
}


def lambda_handler(event, context):

    MOTD_CONTENT_BUCKET = os.environ['MOTD_CONTENT_BUCKET']
    qoute = bedrock.get_qoute()
    print(qoute)

    # update motd
    motd_page_template = Template(open('templates/page.jinja').read())
    s3.put_s3_object(
        bucket=MOTD_CONTENT_BUCKET,
        key='motd/index.html',
        type='text/html',
        body=motd_page_template.render(qoute=qoute)
    )

    # update sitemap
    sitemap = f'''<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ltek.me/</loc>
    <lastmod>2024-08-29</lastmod>
  </url>
  <url>
    <loc>https://ltek.me/motd</loc>
    <changefreq>hourly</changefreq>
    <lastmod>{datetime.datetime.now().strftime('%Y-%m-%dT%H:%M:%S')}+00:00</lastmod>
  </url>
</urlset>'''

    s3.put_s3_object(
        bucket=MOTD_CONTENT_BUCKET,
        key='sitemap.xml',
        type='text/xml',
        body=sitemap
    )

    response["body"] = json.dumps({'qoute': qoute})
    return response
