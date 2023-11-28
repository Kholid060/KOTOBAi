import pako from 'pako';
import fs from 'fs-extra';
import path from 'path';
import libxmljs from 'libxmljs';
import readline from 'node:readline/promises';

import { fileURLToPath } from 'url';
import { valid as semverValid } from 'semver';
import { stdin as input, stdout as output } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({ input, output });

const IS_DEV = true;
const DATE_REGEX = /(\d{4}-\d{2}-\d{2})/;
const DATA_DIR = path.join(__dirname, '../../data/dict');

async function getXMLDoc(url, name) {
  const XML_FILEPATH = path.join(DATA_DIR, `${name}.cache.xml`);
  const prefix = name.toUpperCase();

  let xmlBuffer = null;

  const xmlFileExists = fs.existsSync(XML_FILEPATH);
  if (IS_DEV && xmlFileExists) {
    xmlBuffer = await fs.readFile(XML_FILEPATH);
  } else if (!xmlBuffer) {
    console.log(`${prefix}: Downloading data`);

    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`[${url}] ${response.status}: ${response.statusText}`);

    const buffer = await response.arrayBuffer();
    xmlBuffer = pako.ungzip(buffer, { to: 'string' });
  }

  console.log(`${prefix}: Start parsing XML`);
  const xmlDoc = libxmljs.parseXmlAsync(xmlBuffer, {
    replaceEntities: false,
    validateEntities: false,
  });
  console.log(`${prefix}: End parsing XML`);

  if (IS_DEV) {
    await fs.writeFile(XML_FILEPATH, xmlBuffer, { encoding: 'utf-8' });
  }

  return xmlDoc;
}
function getEntityText(tag, text) {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`);
  const match = text.match(regex)?.[1] ?? '';

  return match.slice(1, match.length - 1);
}
function pushOptional(obj, key, value) {
  if (!obj[key]) obj[key] = [];
  obj[key].push(value);
}

async function generateJMDictData(version) {
  console.log('JMDICT: Start generating data');

  const SLICE_DIR = path.join(DATA_DIR, 'jmdict');
  await fs.ensureDir(SLICE_DIR);
  await fs.emptyDir(SLICE_DIR);

  async function generateMetadata(doc) {
    let dataCreatedAt = '';

    const rootNode = doc.get('//JMdict');
    const commentNode = rootNode.prevSibling();
    if (commentNode && commentNode.type() === 'comment') {
      const [date] = commentNode.toString().match(DATE_REGEX) ?? [];
      dataCreatedAt = date;
    }

    if (!dataCreatedAt) throw new Error("Can't find JMDict date");

    await fs.writeJSON(path.join(SLICE_DIR, 'jmdict-meta.json'), {
      version,
      dataCreatedAt,
    });
  }
  async function mapJMDictEntries(doc) {
    const MAX_ENTRIES_RECORD_SIZE = 10_000;

    const filenames = [];

    const nodeHandler = {
      ent_seq(node, entry) {
        entry.id = +node.text();
      },
      sense(node, entry) {
        const senseEntry = {};

        node.childNodes().forEach((childNode) => {
          const name = childNode.name();
          const handler = nodeHandler[name];
          if (handler) {
            handler(childNode, entry);
            return;
          }

          switch (name) {
            case 'pos':
              pushOptional(
                senseEntry,
                'pos',
                getEntityText('pos', childNode.toString()),
              );
              break;
            case 'misc':
              pushOptional(
                senseEntry,
                'misc',
                getEntityText('misc', childNode.toString()),
              );
              break;
            case 'xref':
              pushOptional(senseEntry, 'xref', childNode.text());
              break;
            case 'gloss':
              pushOptional(senseEntry, 'gloss', childNode.text());
              break;
          }
        });

        entry.sense.push(senseEntry);
      },
      example(node, entry) {
        entry.example = { sent: [] };
        const example = entry.example;

        node.childNodes().forEach((childNode) => {
          const name = childNode.name();

          switch (name) {
            case 'ex_srce':
              example.sourceId = `${childNode
                .getAttribute('exsrc_type')
                ?.value()}:${childNode.text()}`;
              break;
            case 'ex_text':
              example.text = childNode.text();
              break;
            case 'ex_sent':
              example.sent.push({
                text: childNode.text(),
                lang: childNode.getAttribute('lang')?.value(),
              });
              break;
          }
        });
      },
      r_ele(node, entry) {
        node.childNodes().forEach((childNode) => {
          if (childNode.name() !== 'reb') return;
          entry.reading.push(childNode.text());
        });
      },
      k_ele(node, entry) {
        node.childNodes().forEach((childNode) => {
          if (childNode.name() !== 'keb') return;
          entry.kanji.push(childNode.text());
        });
      },
    };

    let fileIndex = 0;
    let currEntries = [];

    const saveCurrEntries = async (isLastFile = false) => {
      fileIndex += 1;

      console.clear();
      console.log(
        'JMDICT: FILE INDEX',
        fileIndex,
        ' || ',
        ((fileIndex + 1) * MAX_ENTRIES_RECORD_SIZE).toLocaleString(),
      );

      const filename = `jmdict-${fileIndex}.json`;
      await fs.writeJSON(path.join(SLICE_DIR, filename), {
        isLastFile,
        records: currEntries,
        counts: currEntries.length,
      });

      filenames.push(filename);
      currEntries = [];
    };

    const rootNode = doc.get('//JMdict');
    const childNodes = rootNode.childNodes();

    for (let index = 0; index < childNodes.length - 1; index += 1) {
      const node = childNodes[index];
      if (node.name() !== 'entry') continue;

      const entry = {
        pos: [],
        kanji: [],
        sense: [],
        reading: [],
      };

      node.childNodes().forEach((childNode) => {
        const name = childNode.name();
        const handler = nodeHandler[name];
        if (!handler) return;

        handler.apply(nodeHandler, [childNode, entry]);
      });

      currEntries.push(entry);

      if (currEntries.length >= MAX_ENTRIES_RECORD_SIZE)
        await saveCurrEntries(index + 1 >= childNodes.length);
    }

    if (currEntries.length) await saveCurrEntries(true);

    return filenames;
  }
  async function generateHalfDict(files) {
    const DIR = path.join(DATA_DIR, 'jmdict-half');
    fs.ensureDir(DIR);
    fs.emptyDir(DIR);

    const fileIdxStream = fs.createWriteStream(path.join(DIR, 'jmdict.idx'));
    const fileDataStream = fs.createWriteStream(path.join(DIR, 'jmdict.data'));

    const halfFiles = files.slice(0, Math.floor(files.length / 2));

    for (const filename of halfFiles) {
      const data = await fs.readJSON(path.join(SLICE_DIR, filename));

      for (const record of data.records) {
        const reading = record.reading[0] || record.kanji[0];

        fileIdxStream.write(`${reading},${record.id}`);
        fileDataStream.write(JSON.stringify(record));
      }
    }

    fileIdxStream.end();
    fileDataStream.end();
  }

  const xmlDoc = await getXMLDoc(
    'http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz',
    'jmdict',
  );
  const filenames = await mapJMDictEntries(xmlDoc);
  await generateHalfDict(filenames);
  await generateMetadata(xmlDoc);

  console.log('JMDICT: DONE');
}

async function generateKANJIDicData(version) {
  const FILE_DIR = path.join(DATA_DIR, 'kanjidic');
  await fs.ensureDir(FILE_DIR);
  await fs.emptyDir(FILE_DIR);

  async function mapKanjiEntries(doc) {
    const getNodeNum = (node) =>
      Number.isNaN(+node.text()) ? undefined : +node.text();

    const nodeHandler = {
      literal: (node, kanjiEntry) => {
        kanjiEntry.literal = node.text();
      },
      misc: (node, kanjiEntry) => {
        node.childNodes().forEach((child) => {
          const type = child.name();
          if (!Object.hasOwn(kanjiEntry.misc, type)) return;

          kanjiEntry.misc[type] = getNodeNum(child);
        });
      },
      radical: (node, kanjiEntry) => {
        node.childNodes().forEach((child) => {
          const classical = child.attrs.classical;
          if (!classical) return;

          kanjiEntry.radical = { classical };
        });
      },
      dic_number: (node, kanjiEntry) => {
        node.childNodes().forEach((dictNode) => {
          const value = getNodeNum(dictNode);
          const type = dictNode.getAttribute('dr_type')?.value();
          if (!type) return;

          kanjiEntry.dicts[type] = value;
        });
      },
      reading_meaning: (node, kanjiEntry) => {
        node.childNodes().forEach((child) => {
          const tagName = child.name();

          if (tagName === 'rmgroup') {
            child.childNodes().forEach((grandChild) => {
              const tagName = grandChild.name();

              if (tagName === 'meaning') {
                const lang = grandChild.getAttribute('m_lang')?.value();
                if (lang) return;

                kanjiEntry.meanings.push(grandChild.text());
              } else if (tagName === 'reading') {
                const type = grandChild.getAttribute('r_type')?.value();
                if (!kanjiEntry.reading[type]) return;

                kanjiEntry.reading[type].push(grandChild.text());
              }
            });
          } else if (tagName === 'nanori') {
            kanjiEntry.reading.nanori.push(child.text());
          }
        });
      },
    };

    const characterNodes = doc.find('//character');
    const entries = characterNodes.map((node) => {
      const kanjiEntry = {
        literal: '',
        misc: {
          jlpt: undefined,
          freq: undefined,
          grade: undefined,
          stroke_count: undefined,
        },
        dicts: {},
        reading: {
          ja_on: [],
          pinyin: [],
          ja_kun: [],
          nanori: [],
        },
        meanings: [],
      };

      node.childNodes().forEach((childNode) => {
        const handler = nodeHandler[childNode.name()];
        if (!handler) return;

        handler(childNode, kanjiEntry);
      });

      return kanjiEntry;
    });

    const FILE_PATH = path.join(FILE_DIR, 'kanjidic.json');
    await fs.writeJSON(FILE_PATH, entries);
  }
  async function generateMetadata(doc) {
    const METADATA_PATH = path.join(FILE_DIR, 'kanjidic-meta.json');
    const metadata = {
      version,
      fileVersion: '',
      dataCreatedAt: '',
      databaseVersion: '',
    };

    const headerNode = doc.get('header');
    headerNode.childNodes().forEach((node) => {
      const value = node.text();

      switch (node.name()) {
        case 'file_version':
          metadata.fileVersion = value;
          break;
        case 'database_version':
          metadata.databaseVersion = value;
          break;
        case 'date_of_creation':
          metadata.dataCreatedAt = value;
          break;
        default:
      }
    });

    await fs.writeJSON(METADATA_PATH, metadata);
  }

  const xmlDoc = await getXMLDoc(
    'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz',
    'kanjidic',
  );
  await mapKanjiEntries(xmlDoc);
  await generateMetadata(xmlDoc);
}

async function generateENAMDICTData(version) {
  const SLICE_DIR = path.join(DATA_DIR, 'enamdict');
  await fs.ensureDir(SLICE_DIR);
  await fs.emptyDir(SLICE_DIR);

  async function mapCharacters(doc) {
    const MAX_ENTRIES = 10_000;

    await fs.ensureDir(SLICE_DIR);

    const nodeHandler = {
      ent_seq(node, entry) {
        entry.id = +node.text();
      },
      r_ele(node, entry) {
        node.childNodes().forEach((childNode) => {
          if (childNode.name() !== 'reb') return;
          entry.text.push(childNode.text());
        });
      },
      k_ele(node, entry) {
        node.childNodes().forEach((childNode) => {
          if (childNode.name() !== 'keb') return;
          entry.kana.push(childNode.text());
        });
      },
      trans(node, entry) {
        node.childNodes().forEach((childNode) => {
          const tagName = childNode.name();

          if (tagName === 'name_type') {
            const name = getEntityText('name_type', childNode.toString());
            if (name) entry.tr.type.push(name);
          } else if (tagName === 'trans_det') {
            entry.tr.detail.push(childNode.text());
          }
        });
      },
    };

    const rootNode = doc.get('//JMnedict');
    const childNodes = rootNode.childNodes();

    let fileIndex = 0;
    let currEntries = [];

    const saveCurrEntries = async (isLastFile = false) => {
      fileIndex += 1;

      console.clear();
      console.log(
        'ENAMDICT: FILE INDEX',
        fileIndex,
        ' || ',
        ((fileIndex + 1) * MAX_ENTRIES).toLocaleString(),
      );

      await fs.writeJSON(path.join(SLICE_DIR, `enamdict-${fileIndex}.json`), {
        isLastFile,
        records: currEntries,
        counts: currEntries.length,
      });

      currEntries = [];
    };

    for (let index = 0; index < childNodes.length; index += 1) {
      const node = childNodes[index];
      if (node.name() !== 'entry') continue;

      const entry = {
        id: -1,
        kana: [],
        text: [],
        tr: { detail: [], type: [] },
      };

      node.childNodes().forEach((childNode) => {
        const tagName = childNode.name();
        const handler = nodeHandler[tagName];
        if (!handler) return;

        handler(childNode, entry);
      });

      currEntries.push(entry);

      if (currEntries.length >= MAX_ENTRIES)
        await saveCurrEntries(index + 1 >= childNodes.length);
    }

    if (currEntries.length) await saveCurrEntries(true);
  }
  async function generateMetadata(doc) {
    let dataCreatedAt = '';

    const rootNode = doc.get('//JMnedict');
    const commentNode = rootNode.prevSibling();
    if (commentNode && commentNode.type() === 'comment') {
      const [date] = commentNode.toString().match(DATE_REGEX) ?? [];
      dataCreatedAt = date;
    }

    if (!dataCreatedAt) throw new Error("Can't find JMDict date");

    await fs.writeJSON(path.join(SLICE_DIR, 'enamdict-meta.json'), {
      version,
      dataCreatedAt,
    });
  }

  const xmlDoc = await getXMLDoc(
    'http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz',
    'ENAMDICT',
  );
  await mapCharacters(xmlDoc);
  await generateMetadata(xmlDoc);
}

async function getVersion(name) {
  if (IS_DEV) return '0.0.0';

  const version = (await rl.question(`${name} version:`)).trim();
  if (!semverValid(version)) throw new Error('Invalid version');

  return version;
}

(async () => {
  try {
    await fs.ensureDir(DATA_DIR);

    const jmDictVersion = await getVersion('JMDict');
    await generateJMDictData(jmDictVersion);

    const kanjiDictVersion = await getVersion('KanjiDic');
    await generateKANJIDicData(kanjiDictVersion);

    const enamDictVersion = await getVersion('ENAMDICT');
    await generateENAMDICTData(enamDictVersion);
  } catch (error) {
    console.error(error);
  }

  rl.close();
})();
