const merge = require('webpack-merge');

const base = require('./webpack.base');

const development = {
    devtool: 'source-map'
};

module.exports = (env) => {
    return merge(base(env), development);
}
