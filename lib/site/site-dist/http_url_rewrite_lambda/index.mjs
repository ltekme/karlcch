// References: https://aws.amazon.com/blogs/compute/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-lambdaedge/

'use strict';
export const handler = (event, context, callback) => {

    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    let request = event.Records[0].cf.request;

    let olduri = request.uri;
    console.log("Old URI: " + olduri);

    if (!olduri.endsWith('.html')) {
        olduri = !olduri.endsWith('/') ? olduri + '/' : olduri;
        request.uri = olduri.replace(/\/$/, '\/index.html');
    }
    console.log("New URI: " + request.uri);

    return callback(null, request);
};