var http = require('http')
var xml2js = require('xml2js')

var addr = 'http://alerts.weather.gov/cap/ny.php?x=0'

http.get(addr, function(response) {
    var xml = ''

	console.log(response.statusCode)

    response.on('data',function(data) {
        xml += data;
    })

    response.on('end',function() {
    	xml2js.parseString(xml, function(err, result) {
    		var entries = result.feed.entry
    		var entry, urgency, severity
    		for (i=0; i < entries.length; i++) {
    			entry = entries[i]
                urgency = entry['cap:urgency'][0]
                severity = entry['cap:severity'][0]
                console.log('Entry: urgent?' + isUrgent(urgency) + ' severe?' + isSevere(severity))

    		}
    	})
    })

}).on('error', function(error) {console.log('Error' + error)})

// If given CAP message urgency is urgent enough for the butterfly
function isUrgent(urgency) {
	return urgency==='' || ==='Immediate'
}

// If given CAP message severity is urgent enought for the butterfly
function isSevere(severity) {
	return severity==='Severe' || severity==='Extreme'
}
