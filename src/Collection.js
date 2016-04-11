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
    return this._client
      .request('GET', this._resourceBaseUrl(namespace))
      .then(body => body.items)
    ;
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
      })
    ;
  }

  byLabels(labels: Object, namespace?: string): Promise<Object[]> {
    const labelSelector = _
      .chain(labels)
      .reduce( (acc, value, key) => _.concat(acc, `${key}=${value}`), [])
      .join(',')
      .value()
    ;

    return this._client
      .request('GET', this._resourceBaseUrl(namespace), { query: { labelSelector } })
      .then(body => body.items)
    ;
  }

  patch(id: string, operations: {op: string, path: string, value: any}[], namespace?: string): Promise<Object> {
    return this._client
      .request('PATCH', `${this._resourceBaseUrl(namespace)}/${id}`, { body: operations, headers: { 'Content-Type': "application/json-patch+json" }} )
    ;
  }

  merge(id: string, body: any, namespace?: string): Promise<Object> {
    return this._client
      .request('PATCH', `${this._resourceBaseUrl(namespace)}/${id}`, { body: body, headers: { 'Content-Type': "application/strategic-merge-patch+json" }} )
    ;
  }

  _resourceBaseUrl(namespace?: string = 'default'): string {
    if(this._namespaced) {
      return `${this._apiBase}/namespaces/${namespace}/${this.name}`;
    } else {
      return `${this._apiBase}/${this.name}`;
    }
  }

}
