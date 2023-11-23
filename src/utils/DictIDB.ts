import xml from 'xml2js';
import pako from 'pako';

class DictIDB {
  constructor() {
  }

  private async fetch(url: string) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch "${url}" (${response.status}: ${response.statusText})`);

    return response;
  }

  async getJMDict() {
    console.log('GET JMDICT')

    const BASE_URL = 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz';
    const response = await this.fetch(BASE_URL);
    const gzBlob = await response.arrayBuffer();

    const xmlParser = new xml.Parser({ strict: false });
    console.time();
    const dictXML = pako.ungzip(gzBlob, { to: 'string' });
    // const dictJSON = await xmlParser.parseStringPromise(dictXML);
    const dom = new DOMParser().parseFromString(dictXML, 'text/xml');
    console.timeEnd();
    console.log(dom);
  }
}

export default DictIDB;