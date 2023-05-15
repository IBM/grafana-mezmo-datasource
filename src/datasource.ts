import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  endpoint: string;
  url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.endpoint = instanceSettings.jsonData.endpoint;
    this.url = instanceSettings.url;
  }

  async doRequest(path: any, params?: any) {

    const req = {
      method: "GET",
      url: this.url + "/example" + path,
      params
    }
    console.log(req)
    const result = await getBackendSrv().datasourceRequest(req)
    console.log(result)
    return result;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Return a constant for each query.
    let data: any = []

    Promise.all(options.targets.map(async (target) => {
      const frame = new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'time', type: FieldType.time },
          { name: 'content', type: FieldType.string },
        ],
      });
      const resp = await this.doRequest('/v2/export', {from, to, size: 1000, query: target.queryText });
      resp.data?.lines?.forEach((line: any) => (
        frame.add({time: line._ts, content: line._line })
      ))
      data.push(frame);
    }));

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    const response = await this.doRequest('/v1/config/ingestion/status')

    return {
      status: response.status,
      message: response.data.isIngesting
    };
  }
}
