import './css/main.postcss';

import Components from './components/_index';
// import Directives from './directives/_index';

function install(Vue, options) {// eslint-disable-line

  // TODO: include plugins?
  // Object.keys(Directives).forEach((key) => {
  //   Vue.directive(Directives[key].name, Directives[key]);
  // });

  Object.keys(Components).forEach((key) => {
    Vue.component(Components[key].name, Components[key]);
  });
}

export default {
  install,
};

if (typeof window !== 'undefined' && window.Vue) {
  Vue.use({ install }); // eslint-disable-line
}
