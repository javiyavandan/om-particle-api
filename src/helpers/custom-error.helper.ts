export class MulterCustomError extends Error {
  private data;
  constructor(name: string, data: any) {
    super(name);
    this.data = data;
  }
  public getData = () => {
    return this.data;
  };
}
