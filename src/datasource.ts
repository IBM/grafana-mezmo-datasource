import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';

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
    const result = await getBackendSrv().datasourceRequest(req);
    return result;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    const frames: any = [];

    const promises = options.targets.map((target) => {
        const query = getTemplateSrv().replace(target.queryText, options.scopedVars);
        return this.doRequest('/v2/export', {from, to, size: 1000, query }).then((response) => {
        response.data?.lines?.forEach((line: any) => {
          const frame = new MutableDataFrame({
            refId: target.refId,
            meta: {
              preferredVisualisationType: 'logs',
            },
            fields: [
              { name: 'time', type: FieldType.time },
              { name: 'message', type: FieldType.string, labels: { app: line._app || '' } },
              { name: 'level', type: FieldType.string },
              { name: 'content', type: FieldType.string },
              { name: 'app', type: FieldType.string }
            ],
          });
          frame.add({time: line._ts, level: line.level, message: line.message || line.msg || line._line, app: line._app, content: line._line, labels: { app: line._app } })
          frames.push(frame);
        });
      })
    });
    return Promise.all(promises).then(() => ({ data: frames }));
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
