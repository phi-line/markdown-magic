const path = require('path')
const fs = require('fs')
const merge = require('deepmerge')
const defaultCommands = require('./commands')
const updateContents = require('./update-contents')

/**
 * ```js
 * markdownSteriods(filename, config, callback)
 * ```
 * @param  {string} filePath - Path to markdown file
 * @param  {object} [config] - configuration object
 * @param  {Function} [callback] - callback function with updated contents
 */
module.exports = function markdownSteriods(filePath, config, callback) {
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (e) {
    console.log(`FILE NOT FOUND ${filePath}`)
    throw e
  }
  /**
   * ### Configuration Options
   */
  const defaultConfig = {
    /**
     * `matchWord` - (optional) Comment pattern to look for and replace inner contents
     * @type {String}
     * @default [AUTO-GENERATED-CONTENT]
     */
    matchWord: 'AUTO-GENERATED-CONTENT',
    /**
     * `commands` - (optional) Custom commands to transform block contents
     * @type {Object}
     */
    commands: defaultCommands,
    /**
     * `outputPath` - (optional) Change output path of new content. Default behavior is replacing the original file
     * @type {string}
     */
    outputPath: filePath,
  }

  const userConfig = config || {}
  const mergedConfig = merge(defaultConfig, userConfig)
  // Set originalPath constant
  mergedConfig.originalPath = filePath
  // contents of original MD file
  mergedConfig.originalContents = content

  /* default regex pattern
    /\<\!--.*AUTO-GENERATED-CONTENT:START((.|\n|)*?AUTO-GENERATED-CONTENT:END.*--\>)/g
  */
  const word = mergedConfig.matchWord
  const regex = new RegExp('\\<\\!--.*'+word+':START((.|\\n|)*?'+word+':END.*--\\>)', 'g')
  const match = content.match(regex)

  if (match) {
    match.forEach(function(element) {
       var newContent = updateContents(element, mergedConfig)
       content = content.replace(element, newContent)
    });
    // then write to file
    fs.writeFileSync(mergedConfig.outputPath, content)
    console.log(`${filePath} updated`)
    callback && callback(content)
  } else {
    console.log(`no ${word} comment block found in markdown file`)
    console.log(`path: ${filePath}`)
    callback && callback(content)
  }
}
