import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const features = [
  {
    title: '多项目文档中心',
    description: '一个站点集中托管多个开源项目的文档，按需扩展。',
  },
  {
    title: '自动分类',
    description: '侧边栏按文件夹结构自动生成，新增项目与文档无需改动配置。',
  },
  {
    title: '深色阅读',
    description: '内置深色主题，长时间阅读更舒适，也支持浅色切换。',
  },
  {
    title: '全文搜索',
    description: '集成搜索引擎，快速定位所需内容与接口。',
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
            to="/docs">
            浏览文档 →
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
