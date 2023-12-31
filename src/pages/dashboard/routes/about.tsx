import { useState } from 'react';
import { useEffectOnce } from 'usehooks-ts';
import { version, description } from '@root/package.json';
import Browser from 'webextension-polyfill';

const PLATFORM_NAMES: Record<string, string> = {
  linux: 'Linux',
  mac: 'Mac OS',
  win: 'Windows',
};

function getBrowserInfo(): { name: string; version: string } {
  const userAgent = navigator.userAgent;
  const browserMatch =
    userAgent.match(
      /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i,
    ) || [];

  if (/trident/i.test(browserMatch[1])) {
    const versionMatch = /\brv[ :]+(\d+)/g.exec(userAgent) || [];
    return { name: 'IE', version: versionMatch[1] || '' };
  }

  if (browserMatch[1] === 'Chrome') {
    const edgeVersionMatch = userAgent.match(/\b(OPR|Edge)\/(\d+)/);
    if (edgeVersionMatch !== null) {
      return {
        name: edgeVersionMatch[1].replace('OPR', 'Opera'),
        version: edgeVersionMatch[2] || '',
      };
    }
  }

  const browserInfo = browserMatch[2]
    ? [browserMatch[1], browserMatch[2]]
    : [navigator.appName, navigator.appVersion, '-?'];

  const versionMatch = userAgent.match(/version\/(\d+)/i);
  if (versionMatch !== null) {
    browserInfo.splice(1, 1, versionMatch[1]);
  }

  return {
    name: browserInfo[0],
    version: browserInfo[1],
  };
}

function AboutPage() {
  const [appInfo, setAppInfo] = useState({
    platform: '-',
    userAgent: '',
    extVersion: '-',
    browserName: '-',
    browserVersion: '-',
  });

  useEffectOnce(() => {
    (async () => {
      const { name, version: browserVersion } = getBrowserInfo();
      const platform = await Browser.runtime.getPlatformInfo();

      setAppInfo({
        browserVersion,
        browserName: name,
        extVersion: version,
        userAgent: navigator.userAgent,
        platform: PLATFORM_NAMES[platform.os] ?? platform.os,
      });
    })();
  });

  return (
    <div className="mx-auto w-full max-w-xl py-24">
      <img src="/icon.png" className="h-20 w-20" />
      <p className="font-semibold text-lg mt-6">Extension name</p>
      <p className="leading-tight mt-1">{description}</p>
      <table className="text-sm w-full mt-4">
        <tr>
          <td className="min-w-[150px] py-1">Extension version</td>
          <td className="py-1">{appInfo.extVersion}</td>
        </tr>
        <tr>
          <td className="py-1">Platform</td>
          <td className="py-1">{appInfo.platform}</td>
        </tr>
        <tr>
          <td className="py-1">Browser</td>
          <td className="py-1">{appInfo.browserName}</td>
        </tr>
        <tr>
          <td className="py-1">Browser version</td>
          <td className="py-1">{appInfo.browserVersion}</td>
        </tr>
        <tr>
          <td className="align-top py-1">User agent</td>
          <td className="py-1">{appInfo.userAgent}</td>
        </tr>
      </table>
      <div className="mt-6">
        <p className="font-semibold text-lg">Data sources</p>
        <div className="mt-2">
          <p className="font-semibold">Dictionary Data</p>
          <p className="leading-snug text-muted-foreground mt-1">
            The dictionary data includes data from{' '}
            <a
              href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              JMDict
            </a>
            ,{' '}
            <a
              href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              KANJIDIC
            </a>
            , and{' '}
            <a
              href="https://www.edrdg.org/enamdict/enamdict_doc.html"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              JMNedict
            </a>
            , which are the property of the{' '}
            <a
              href="http://www.edrdg.org/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Electronic Dictionary Research and Development Group
            </a>{' '}
            and are used in conformance with the{' '}
            <a
              href="https://www.edrdg.org/edrdg/licence.html"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Group&apos;s license
            </a>
            .
          </p>
          <p className="font-semibold mt-4">KanjiVG</p>
          <p className="leading-snug text-muted-foreground mt-1">
            The kanji stroke order data is from the{' '}
            <a
              href="http://kanjivg.tagaini.net/"
              className="text-primary hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              KanjiVG
            </a>{' '}
            project by Ulrich Apel.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
