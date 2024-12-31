export interface IServerLog {
  requestTime: Date;
  url: string;
  action: string;
  body: any;
  responseTime: Date;
  response: any;
}
