import pako from 'pako';
import fs from 'fs-extra';
import path from 'path';
import libxmljs from 'libxmljs';
import archiver from 'archiver';
import { isKanji } from 'wanakana';
import readline from 'node:readline/promises';

import { fileURLToPath } from 'url';
import { Command, Option } from 'commander';
import { valid as semverValid } from 'semver';
import { stdin as input, stdout as output } from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({ input, output });

let IS_DEV = false;

const DATE_REGEX = /(\d{4}-\d{2}-\d{2})/;
const DATA_DIR = path.join(__dirname, '../../dict-data');
const GITHUB_API_BASE_URL = 'https://api.github.com/repos';
const DATA_URL = {
  KANJIDIC: 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz',
  JMDICT: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e_examp.gz',
  ENAMDICT: 'http://ftp.edrdg.org/pub/Nihongo/JMnedict.xml.gz',
  KANJIVG_RELEASE: `${GITHUB_API_BASE_URL}/KanjiVG/kanjivg/releases/latest`,
};

const ZIP_DICT_DIR = path.join(DATA_DIR, 'zip');
const META_FILEPATH = path.join(DATA_DIR, 'dict-metadata.json');

async function writeMetadata(meta) {
  let currentMeta = {};
  if (fs.existsSync(META_FILEPATH)) {
    currentMeta = await fs.readJSON(META_FILEPATH);
  }

  await fs.writeJSON(META_FILEPATH, { ...currentMeta, ...meta });
}
async function archiveFile(dir) {
  const dirPath = path.join(DATA_DIR, dir);
  if (!fs.existsSync(dirPath)) throw new Error(`"${dir}" folder not found`);

  const filePath = path.join(ZIP_DICT_DIR, `${dir}.zip`);
  await fs.ensureFile(filePath);

  const fileStream = fs.createWriteStream(filePath);

  const archive = archiver('zip', {
    zlib: { level: 9 },
  });
  archive.directory(dirPath, false);
  archive.pipe(fileStream);

  await archive.finalize();
}
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

    await writeMetadata({
      jmdict: { version, dataCreatedAt },
    });
  }
  async function mapJMDictEntries(doc) {
    const MAX_ENTRIES_RECORD_SIZE = 10_000;
    const COMMON_PRIO_TAG = ['news1', 'ichi1', 'spec1', 'gai1'];

    const filenames = [];

    const handlePriority = ({ node, index, entry, prefix }) => {
      const propName = prefix + 'Prio';
      if (!entry[propName]) entry[propName] = {};
      if (!entry[propName][index]) entry[propName][index] = [];

      entry[propName][index].push(node.text());

      if (COMMON_PRIO_TAG.includes(node.text())) {
        entry.common = true;
      }
    };

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
            handler(childNode, senseEntry);
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
      r_ele(node, entry, tempStorage) {
        node.childNodes().forEach((childNode) => {
          const nodeName = childNode.name();
          const idxPropName = 'rPrioIdx';

          if (nodeName === 'reb') {
            entry.reading.push(childNode.text());
          } else if (nodeName === 're_pri') {
            handlePriority({
              entry,
              prefix: 'r',
              node: childNode,
              index: tempStorage[idxPropName] || 0,
            });
          }
        });
      },
      k_ele(node, entry, tempStorage) {
        const idxPropName = 'kPrioIdx';

        node.childNodes().forEach((childNode) => {
          const nodeName = childNode.name();

          if (nodeName === 'keb') {
            if (!entry.kanji) entry.kanji = [];
            if (!Object.hasOwn(tempStorage, idxPropName)) {
              tempStorage[idxPropName] = 0;
            } else {
              tempStorage[idxPropName] += 1;
            }

            entry.kanji.push(childNode.text());
          } else if (nodeName === 'ke_pri') {
            handlePriority({
              entry,
              prefix: 'k',
              node: childNode,
              index: tempStorage[idxPropName] || 0,
            });
          } else if (nodeName === 'ke_inf') {
            const index = tempStorage[idxPropName] || 0;
            if (!entry.kInfo) entry.kInfo = {};
            if (!entry.kInfo[index]) entry.kInfo[index] = [];

            entry.kInfo[index].push(
              getEntityText('ke_inf', childNode.toString()),
            );
          }
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
        type: 'jmdict',
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
        sense: [],
        reading: [],
      };
      const tempStorage = {};

      node.childNodes().forEach((childNode) => {
        const name = childNode.name();
        const handler = nodeHandler[name];
        if (!handler) return;

        handler.apply(nodeHandler, [childNode, entry, tempStorage]);

        if (entry.kanji && entry.kanji.length > 1) {
          const kanjiToken = new Set();
          const excludeKanjiChar = new Set();
          entry.kanji.forEach((kanji) => {
            kanji.split('').forEach((token, charIndex) => {
              if (excludeKanjiChar.has(token)) return;

              if (charIndex === 0) {
                if (kanjiToken.has(token)) {
                  kanjiToken.delete(token);
                  excludeKanjiChar.add(token);
                }
                return;
              }

              if (!isKanji(token)) return;

              kanjiToken.add(token);
            });
          });

          if (kanjiToken.size > 0) entry.kToken = [...kanjiToken];
        }
      });

      currEntries.push(entry);

      if (currEntries.length >= MAX_ENTRIES_RECORD_SIZE)
        await saveCurrEntries(index + 1 >= childNodes.length);
    }

    if (currEntries.length) await saveCurrEntries(true);

    return filenames;
  }

  const xmlDoc = await getXMLDoc(DATA_URL.JMDICT, 'jmdict');
  await mapJMDictEntries(xmlDoc);
  await generateMetadata(xmlDoc);
  await archiveFile('jmdict');

  console.log('JMDICT: DONE');
}

async function generateKANJIDicData(version) {
  const FILE_DIR = path.join(DATA_DIR, 'kanjidic');
  await fs.ensureDir(FILE_DIR);
  await fs.emptyDir(FILE_DIR);

  const SUPPORT_READING_TYPE = ['ja_on', 'ja_kun', 'pinyin'];

  async function mapKanjiEntries(doc) {
    const getNodeNum = (node) =>
      Number.isNaN(+node.text()) ? undefined : +node.text();

    const nodeHandler = {
      literal: (node, kanjiEntry) => {
        kanjiEntry.literal = node.text();
        kanjiEntry.id = kanjiEntry.literal.charCodeAt(0);
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
                if (!SUPPORT_READING_TYPE.includes(type)) return;

                if (!kanjiEntry.reading[type]) kanjiEntry.reading[type] = [];
                kanjiEntry.reading[type].push(grandChild.text());
              }
            });
          } else if (tagName === 'nanori') {
            if (!kanjiEntry.reading.nanori) kanjiEntry.reading.nanori = [];
            kanjiEntry.reading.nanori.push(child.text());
          }
        });
      },
    };

    const characterNodes = doc.find('//character');
    const entries = characterNodes.map((node) => {
      const kanjiEntry = {
        id: -1,
        literal: '',
        misc: {
          jlpt: undefined,
          freq: undefined,
          grade: undefined,
          stroke_count: undefined,
        },
        dicts: {},
        reading: {},
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
    await fs.writeJSON(FILE_PATH, {
      isLastFile: true,
      type: 'kanjidic',
      records: entries,
      counts: entries.length,
    });
  }
  async function generateMetadata(doc) {
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

    await writeMetadata({ kanjidic: metadata });
  }

  const xmlDoc = await getXMLDoc(DATA_URL.KANJIDIC, 'kanjidic');
  await mapKanjiEntries(xmlDoc);
  await generateMetadata(xmlDoc);
  await archiveFile('kanjidic');
}

async function generateENAMDICTData(version) {
  const SLICE_DIR = path.join(DATA_DIR, 'enamdict');
  await fs.ensureDir(SLICE_DIR);
  await fs.emptyDir(SLICE_DIR);

  async function mapCharacters(doc) {
    const MAX_ENTRIES = 25_000;

    await fs.ensureDir(SLICE_DIR);

    const nodeHandler = {
      ent_seq(node, entry) {
        entry.id = +node.text();
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
          if (!entry.kanji) entry.kanji = [];

          entry.kanji.push(childNode.text());
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
        type: 'enamdict',
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
        reading: [],
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

    await writeMetadata({
      enamdict: {
        version,
        dataCreatedAt,
      },
    });
  }

  const xmlDoc = await getXMLDoc(DATA_URL.ENAMDICT, 'ENAMDICT');
  await mapCharacters(xmlDoc);
  await generateMetadata(xmlDoc);
  await archiveFile('enamdict');
}

async function generateKanjiVG(version) {
  const apiResponse = await fetch(DATA_URL.KANJIVG_RELEASE);
  if (!apiResponse.ok) throw new Error(apiResponse.statusText);

  const release = await apiResponse.json();
  const latestFile = release.assets.find((asset) =>
    asset.name.endsWith('.xml.gz'),
  );
  if (!latestFile) throw new Error("Can't find latest XML file release");

  const xmlDoc = await getXMLDoc(latestFile.browser_download_url, 'kanjivg');
  const rootDoc = xmlDoc.get('//kanjivg');
  if (!rootDoc) throw new Error("Can't find KanjiVG root doc");

  const currEntries = [];
  const traverseKanjiPath = (node) => {
    const nodeName = node.name();
    if (nodeName === 'path') {
      return {
        d: node.getAttribute('d').value(),
        id: node.getAttribute('id').value(),
      };
    }

    if (nodeName !== 'g') return null;

    const kanji = {
      paths: [],
    };
    const posAttribute = node.getAttribute('position');
    if (posAttribute) kanji.pos = posAttribute.value();

    const traverseNode = (childNode) => {
      const childNodeName = childNode.name();
      if (childNodeName === 'path') {
        kanji.paths.push({
          d: childNode.getAttribute('d').value(),
          id: childNode.getAttribute('id').value(),
        });
        return;
      }
      if (childNodeName === 'g') {
        childNode.childNodes().forEach(traverseNode);
      }
    };
    node.childNodes().forEach(traverseNode);

    return kanji;
  };

  const nodes = rootDoc.childNodes();
  for (let index = 0; index <= nodes.length; index += 1) {
    const node = nodes[index];
    const nodeName = node?.name();
    if (nodeName !== 'kanji') continue;

    const kanjiNode = node
      .childNodes()
      .find((childNode) => childNode.name() === 'g');
    if (!kanjiNode) continue;

    const currKanji = kanjiNode.getAttribute('element')?.value();
    if (!currKanji) continue;

    const paths = kanjiNode.childNodes().reduce((acc, curr) => {
      const kanjiPaths = traverseKanjiPath(curr);
      if (kanjiPaths) acc.push(kanjiPaths);

      return acc;
    }, []);

    currEntries.push({
      paths,
      id: currKanji.codePointAt(0),
    });
  }

  const kanjiVgDir = path.join(DATA_DIR, 'kanjivg');

  await fs.emptyDir(kanjiVgDir);
  await fs.ensureDir(kanjiVgDir);
  await fs.writeJSON(path.join(kanjiVgDir, 'kanjivg.json'), {
    isLastFile: true,
    type: 'kanjivg',
    records: currEntries,
    counts: currEntries.length,
  });

  const [dataCreatedAt] = latestFile.created_at.split('T');
  await writeMetadata({ kanjivg: { version, dataCreatedAt } });
  await archiveFile('kanjivg');
}

async function getVersion(name) {
  if (IS_DEV) return '0.0.0';

  const version = (await rl.question(`${name} version:`)).trim();
  if (!semverValid(version)) throw new Error('Invalid version');

  return version;
}

const ACTIONS_FUNCS = {
  jmdict: async (version) => {
    const jmDictVersion = version ?? (await getVersion('JMDict'));
    await generateJMDictData(jmDictVersion);
  },
  kanjidic: async (version) => {
    const kanjiDictVersion = version ?? (await getVersion('KanjiDic'));
    await generateKANJIDicData(kanjiDictVersion);
  },
  enamdict: async (version) => {
    const enamDictVersion = version ?? (await getVersion('ENAMDICT'));
    await generateENAMDICTData(enamDictVersion);
  },
  kanjivg: async (version) => {
    const kanjiVgVersion = version ?? (await getVersion('KanjiVG'));
    await generateKanjiVG(kanjiVgVersion);
  },
};

const AVAILABLE_OPTIONS = [...Object.keys(ACTIONS_FUNCS), 'all'];

(async () => {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.ensureDir(ZIP_DICT_DIR);

    const program = new Command();
    program
      .option(
        '-dict <VALUE>',
        'options: all, jmdict, kanjidic, enamdict, & sample (default: all)',
        (optionsStr) => {
          const options = optionsStr.split(' ').map((val) => val.trim());

          const isValidOptions = options.every((opt) =>
            AVAILABLE_OPTIONS.includes(opt),
          );
          if (!isValidOptions) throw new Error('Invalid dict options');

          if (options.includes('all')) return 'all';

          return options;
        },
      )
      .addOption(
        new Option('-dev')
          .choices(['true', 'false'])
          .default(false)
          .argParser((val) => val === 'true'),
      )
      .option(
        '-version <VERSION>',
        'set version for all dictionaries',
        (versionStr) => {
          if (!semverValid(versionStr)) throw new Error('Invalid version');

          return versionStr;
        },
      );
    await program.parseAsync();

    const options = program.opts();

    IS_DEV = options.Dev;

    let dictKeys = Array.isArray(options.Dict)
      ? options.Dict
      : (options.Dict || 'all').trim();
    if (dictKeys === 'all') dictKeys = Object.keys(ACTIONS_FUNCS);

    for (const key of dictKeys) {
      await ACTIONS_FUNCS[key](options.Version);
    }
  } catch (error) {
    console.error(error);
  }

  rl.close();
})();
