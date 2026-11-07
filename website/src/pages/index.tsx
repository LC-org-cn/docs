import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const features = [
  {
    title: '部署于 Cloudflare Workers',
    description: '无需服务器，分钟级上线一个运行在边缘网络的 Cloudreve 后端。',
  },
  {
    title: '兼容 S3 存储',
    description: '对接 R2 等任意 S3 兼容对象存储，文件就近存取、弹性扩展。',
  },
  {
    title: '原生 WebDAV',
    description: '通过 WebDAV 把网盘挂载到本地，像本地磁盘一样使用。',
  },
  {
    title: '轻量专注',
    description: '无传统后端负担，专注内容与你自己的私有数据。',
  },
];

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={clsx(styles.heroTitle, 'hero__title')}>
          {siteConfig.title}
        </Heading>
        <p className={clsx(styles.heroSubtitle, 'hero__subtitle')}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/项目/cloudreve-worker">
            开始使用 →
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="https://github.com/LC-org-cn/docs">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((feature) => (
            <div key={feature.title} className="col col--3">
              <div className="text--center padding-horiz--md">
                <Heading as="h3">{feature.title}</Heading>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
