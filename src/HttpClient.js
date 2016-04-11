//@flow

import request from 'request';

function isSuccess(code: number): boolean {
  return (code - (code % 200)) === 200;
}

export class ClientError extends Error {
  body: Object;
  response: Object;
  constructor(response: Object, body: Object) {
    super(`Error in response: ${response.statusCode}`);
    this.response = response;
    this.body = body;
  }
}

const DEFAULT_HEADERS = {
  'Accept': 'application/json, */*',
  'User-Agent': 'node-k8s-client'
};

export default class HttpClient {

  _baseUrl: string;
  _ca: ?string;
  _authToken: ?string;

  constructor(host: string, protocol: string = 'https', port?: number, ca?: string, token?: string) {
    const actualPort = port || (protocol === 'https' ? 443 : 80);
    this._baseUrl = `${protocol}://${host}:${actualPort}`;
    this._ca = ca;
    this._authToken = token;
  }

  request(method: string, path: string, opts: { body?: any, headers?: Object, query?: Object } = {}): Promise<Object> {

    const req = {
      method: method,
      url: `${this._baseUrl}${path}`,
      json: true,
      body: opts.body,
      qs: opts.query,
      ca: this._ca,
      headers: Object.assign(DEFAULT_HEADERS, opts.headers || {}),
      auth: this._authToken ? { bearer: this._authToken } : undefined
    };

//    console.log("Sending request:", JSON.stringify(req, null, 2));
//    console.log("Sending request:", req.method, req.url);
    return new Promise( (resolve, reject) => {
      request(req, (err, resp, body) => {
        if(err) {
          return reject(err);
        }
        if(!isSuccess(resp.statusCode)) {
          return reject(new ClientError(resp, body));
        }
        resolve(body || {});
      });
    });

  }

}




