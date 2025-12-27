require('dotenv').config();

module.exports = function(eleventyConfig) {
    // Inject variables into all templates
    eleventyConfig.addGlobalData("env", process.env);

    // Pass-through static assets
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addPassthroughCopy("webfonts");
    eleventyConfig.addPassthroughCopy("videos");
    eleventyConfig.addPassthroughCopy("favicon.ico");

    // Force Eleventy to process .njk files inside the assets folder
    // and output them as .js files in the _site folder
    eleventyConfig.addTemplateFormats("njk");
    eleventyConfig.addExtension("njk", {
        outputExtension: "js",
    });

    return {
        dir: {
            input: ".",
            output: "_site",
            includes: "_includes"
        },
        htmlTemplateEngine: "njk"
    };
};