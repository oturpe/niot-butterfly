'use strict';

var http = require('http')
var capParser = require('./cap-parser.js')

// TODO: Load program-wide parameters from configuration file.
// TODO: Use comment syntax that can be used to auto-generate documentation,
//       Javadoc style.
// TODO: Make sure that responses are not cached too much, so that the
//       butterfly really notices the tornado.

// URL to query for wheather alerts
var SERVICE_URL = 'http://alerts.weather.gov/cap/us.php?x=0'
var PARSER_PARAMS = {
    // Keyword to search for in event descriptions
    keywords: ['Tornado','Thunderstorm','Flood'],
    // Urgency levels considered urgent
    urgent: ['Expected','Immediaté'],
    // Severy levels considered urgent
    severe: ['Severe','Extreme']
}
// Time between queries for weather information, given in milliseconds.
// If the previous query has not completed during the interval, the system
// will wait for another interval, as many times as is needed to get some
// kind of response.
//
// TODO: Make sure that the system does not hang if response is not received
var QUERY_INTERVAL = 5000

console.log('Starting pulling of warnings from ' + SERVICE_URL)
setInterval(printWarningCount,QUERY_INTERVAL)
printWarningCount()

var fetching = false
function printWarningCount() {
    if(fetching) {
        return;
    }

    fetching = true
    http.get(SERVICE_URL, function(response) {
        var xml = ''

        response.on('data',function(data) {
            xml += data
        })

        response.on('end',function() {
            fetching = false;

            if(response.statusCode !== 200) {
                console.log('Error: Wrong status code (' +
                            response.statusCode +
                            ')')
                return;
            }

            var alerts = []
            capParser.parse(xml,alerts,PARSER_PARAMS)

            console.log('Found ' + alerts.length + ' warnings')

            //for (var i=0; i<alerts.length; i++) {
            //    console.log(alerts[i])
            //}
        })
    }).on('error', function(error) {console.log('Error' + error)})
}
