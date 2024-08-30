// References: https://aws.amazon.com/blogs/compute/implementing-default-directory-indexes-in-amazon-s3-backed-amazon-cloudfront-origins-using-lambdaedge/

'use strict';
export const handler = (event, context, callback) => {

    // Extract the request from the CloudFront event that is sent to Lambda@Edge 
    let request = event.Records[0].cf.request;

    let olduri = request.uri;
    console.log("Old URI: " + olduri);

    // if uri not end with '/', append '/'
    olduri = !olduri.endsWith('/') ? olduri + '/' : olduri;

    // Match any '/' that occurs at the end of a URI. Replace it with a default index
    request.uri = olduri.replace(/\/$/, '\/index.html');
    console.log("New URI: " + request.uri);

    // Return to CloudFront
    return callback(null, request);

};