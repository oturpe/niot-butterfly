'use strict';

var fs = require('fs')
var http = require('http')
var capParsing = require('./cap-parser.js')
JSON.minify = JSON.minify || require('node-json-minify')
var bunyan = require('bunyan')

var log = bunyan.createLogger({
    name: 'weather-client',
    level: 'info',
    streams: [
        {path: 'butterfly.log'},
        {stream: process.stderr}
    ],
    serializers: {
        err: bunyan.stdSerializers.err
    }})

// Default configuration file name
var CONFIG_FILE_DEFAULT = 'butterfly.config'

// TODO: Load program-wide parameters from configuration file.
// TODO: Use comment syntax that can be used to auto-generate documentation,
//       Javadoc style.
// TODO: Make sure that responses are not cached too much, so that the
//       butterfly really notices the tornado.

// TODO: Allow passing configuration file as input parameter
if(!fs.existsSync(CONFIG_FILE_DEFAULT)) {
    var message = 'Could not read configuration file'
    log.fatal({configFile: CONFIG_FILE_DEFAULT}, message)
    process.exit(1)
}

try {
    var configJson = fs.readFileSync(CONFIG_FILE_DEFAULT,
                                         {encoding: 'utf-8'})
    var config = JSON.parse(JSON.minify(configJson))
} catch (exception) {
    var message = 'Could not parse configuration file'
    var errorFields = {
        configFile: CONFIG_FILE_DEFAULT,
        parsedConfig: config,
        err: exception
    }

    log.fatal(errorFields,message)
    process.exit(1)
}

log.info({config: config}, 'Starting pulling weather warnings')
setInterval(printWarningCount,config.queryInterval)
printWarningCount()

// TODO: Make sure that the system does not hang if response is not received

var capParser = new capParsing.CapParser(log,config.parserParameters)

// For development only: Fetch weather warnings and log the number of warnings
// received.
function printWarningCount() {
    getWeatherWarnings(function(error) {
        log.error({err: error},'Error while retrieving weather warnings')
    },function(alerts) {
        log.info({amountOfAlerts: alerts.length},'Found weather alerts')
    })
}

// Gets weather warnings from given service URL, passes them to CAP parser and
// finally calls given callback with parsed results.
var fetching = false
function getWeatherWarnings(error,callback){
    if(fetching) {
        var loggedObject = {
            serviceUrl: config.serviceUrl,
            queryInterval: config.queryInterval
        }

        log.info(loggedObject,
                 'Previous fetch taking longer than query interval %s',
                 config.queryInterval)

        return
    }

    fetching = true
    var getRequest = http.get(config.serviceUrl, function(response) {
        var xml = ''

        response.on('data',function(data) {
            xml += data
        })

        response.on('end',function() {
            fetching = false

            if(response.statusCode !== 200) {
                error(new Error('Wrong status code ' + response.statusCode))
                return
            }

            capParser.parse(xml,error,callback)
        })
    })

    getRequest.on('error', function(getError) {
        error(getError)
    })
}
