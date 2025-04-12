// This file exists to fix an issue with importing mempool.js:
// TypeError: axios_1.default.create is not a function
// The workaround was described in
// https://github.com/facebook/create-react-app/discussions/12823#discussioncomment-4295231
// https://github.com/facebook/create-react-app/issues/11889#issuecomment-1114928008
module.exports = {
    webpack: {
        configure: (config) => {
            const fileLoaderRule = getFileLoaderRule(config.module.rules);
            if (!fileLoaderRule) {
                throw new Error("File loader not found");
            }
            fileLoaderRule.exclude.push(/\.cjs$/);
            return config;
        }
    }
};

function getFileLoaderRule(rules) {
    for (const rule of rules) {
        if ("oneOf" in rule) {
            const found = getFileLoaderRule(rule.oneOf);
            if (found) {
                return found;
            }
        } else if (rule.test === undefined && rule.type === 'asset/resource') {
            return rule;
        }
    }
}
