class DictIDB {
  constructor() {}

  private async fetch(url: string) {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Failed to fetch "${url}" (${response.status}: ${response.statusText})`,
      );

    return response;
  }

  async getJMDict() {}
}

export default DictIDB;
