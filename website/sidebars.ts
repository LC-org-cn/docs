import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'category',
      label: '项目',
      items: ['cloudreve-worker', 'faq', 'changelog'],
    },
  ],
};

export default sidebars;
