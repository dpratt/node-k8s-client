//@flow

import request from 'request';
import fs from 'fs';

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

const SERVICE_ACCOUNT_TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";
const SERVICE_ACCOUNT_CA_CRT_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt";

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
    this._ca = ca || this._readOptionalFile(SERVICE_ACCOUNT_CA_CRT_PATH);
    this._authToken = token || this._readOptionalFile(SERVICE_ACCOUNT_TOKEN_PATH);
  }

  _readOptionalFile(path: string): ?string {
    try {
      return fs.readFileSync(path, 'utf8');
    } catch(err) {
      return null;
    }
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




