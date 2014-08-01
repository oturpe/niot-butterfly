'use strict';

var fs = require('fs')
var http = require('http')
var capParser = require('./cap-parser.js')
JSON.minify = JSON.minify || require('node-json-minify')

// Default configuration file name
var CONFIG_FILE_DEFAULT = 'butterfly.config'

// TODO: Load program-wide parameters from configuration file.
// TODO: Use comment syntax that can be used to auto-generate documentation,
//       Javadoc style.
// TODO: Make sure that responses are not cached too much, so that the
//       butterfly really notices the tornado.

// TODO: Allow passing configuration file as input parameter
if(!fs.existsSync(CONFIG_FILE_DEFAULT)) {
    console.log('Error: Could not read configuration file "' +
                CONFIG_FILE_DEFAULT + '".')
    process.exit(1)
}

try {
    var configJson = fs.readFileSync(CONFIG_FILE_DEFAULT,
                                         {encoding: 'utf-8'})
    var config = JSON.parse(JSON.minify(configJson))
} catch (exception) {
    console.log('Error: Could not parse configuration file ": ' +
                CONFIG_FILE_DEFAULT +
                '": ' + exception)
    process.exit(1)
}

console.log('Starting pulling warnings from ' + config.serviceUrl)
setInterval(printWarningCount,config.queryInterval)
printWarningCount()

// TODO: Make sure that the system does not hang if response is not received

var fetching = false
function printWarningCount() {
    if(fetching) {
        return
    }

    fetching = true
    http.get(config.serviceUrl, function(response) {
        var xml = ''

        response.on('data',function(data) {
            xml += data
        })

        response.on('end',function() {
            fetching = false

            if(response.statusCode !== 200) {
                console.log('Error: Wrong status code (' +
                            response.statusCode +
                            ')')
                return
            }

            var alerts = []
            capParser.parse(xml,alerts,config.parserParameters)

            console.log('Found ' + alerts.length + ' warnings')

            //for (var i=0; i<alerts.length; i++) {
            //    console.log(alerts[i])
            //}
        })
    }).on('error', function(error) {console.log('Error' + error)})
}
