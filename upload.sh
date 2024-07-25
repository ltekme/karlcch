source .config

# upload the files
aws s3 sync ./site_content s3://$S3_BUCKET --region=$AWS_REGION --delete