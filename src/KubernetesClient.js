
//@flow

import _ from 'lodash';
import HttpClient from './HttpClient';
import Collection from './Collection';

export default class KubernetesClient {

  pods: Collection;
  services: Collection;
  replicationControllers: Collection;
  nodes: Collection;
  endpoints: Collection;
  events: Collection;

  _collections: Map<string, Collection>;
  _client: HttpClient;

  /**
  * The main entrypoint - create a kubernetes client
  */
  static async init(host: string, protocol: string = 'https', port?: number, ca?: string, token?: string): Promise<KubernetesClient> {
    type APIGroup = { name: string, basePath: string, resources: {name: string, namespaced: boolean, kind: string}[] };

    const httpClient = new HttpClient(host, protocol, port, ca, token);

    async function getApi(name, basePath): Promise<APIGroup> {
      const body = await httpClient.request('GET', basePath);
      return {
        name: name,
        basePath: basePath,
        resources: body.resources
      };
    }

    //TODO: Make this configurable for when the main api version gets revved
    const baseApi = await getApi('base', `/api/v1`);

    const optionalApis = await httpClient
      .request('GET', '/apis')
      .then(body => Promise.all(body.groups.map(group => getApi(group.name, `/apis/${group.preferredVersion.groupVersion}`))))
    ;
    const apiGroups = _.concat([baseApi], optionalApis);

    const collections: Map<string, Collection> = new Map();

    apiGroups.forEach(apiGroup => {
      apiGroup.resources.forEach(resource => {
        collections.set(resource.name, new Collection(httpClient, resource.name, resource.kind, apiGroup.basePath, resource.namespaced));
      });
    });

    return new KubernetesClient(collections, httpClient);
  }

  constructor(collections: Map<string, Collection>, client: HttpClient) {
    this._collections = collections;
    this.pods = this.collection("pods");
    this.services = this.collection("services");

    this._client = client;
  }

  collection(name: string): Collection {
    const coll = this._collections.get(name);
    if(coll == null) {
      throw new Error(`Unknown Kubernetes API object ${name}.`);
    }
    return coll;
  }

}
