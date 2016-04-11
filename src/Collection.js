//@flow

import _ from 'lodash';

import type HttpClient from './HttpClient';

export default class Collection {

  name: string;
  kind: string;

  _client: HttpClient;
  _apiBase: string;
  _namespaced: boolean;

  constructor(client: HttpClient, name: string, kind: string, apiBase: string, namespaced?: boolean = true) {
    this.name = name;
    this.kind = kind;

    this._client = client;
    this._apiBase = apiBase;
    this._namespaced = namespaced;
  }

  get(namespace?: string = "default"): Promise<Object[]> {
    return this._client.request('GET', this._resourceBaseUrl(namespace)).then(body => body.items);
  }

  byId(id: string, namespace?: string): Promise<?Object> {
    return this._client
      .request('GET', `${this._resourceBaseUrl(namespace)}/${id}`)
      .catch(err => {
        if(_.get(err, 'response.statusCode') === 404) {
          //not found
          return null;
        }
        throw err;
      });
  }

  _resourceBaseUrl(namespace?: string = 'default'): string {
    if(this._namespaced) {
      return `${this._apiBase}/namespaces/${namespace}/${this.name}`;
    } else {
      return `${this._apiBase}/${this.name}`;
    }
  }

}
