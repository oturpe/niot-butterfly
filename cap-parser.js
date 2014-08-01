// CAP message parser that parses input xml and adds found warnings
// to given output list.
'use strict'

var xml2js = require('xml2js')


// Creates a new CAP message parser. Given Bunyan log is used for logging.
//
// Parameters are as follows:
//
//     keywords: a list of keywords to match with 'cap:event' field. Only events
//               matching at least one of them are included in output. Event
//               type in output is set to first match in this list.
//     urgent: list of strings that are matched to 'cap:urgency' field. The
//             event is flagged urgent if at least one matches.
//     severe: list of strings that are matched to 'cap:severity' field. The
//             event is flagged severe if at least one matches.
function CapParser(log,parameters) {
    if(!log) {
        throw new Error('CapParser requires log object')
    }
    if(!parameters) {
        throw new Error('CapParser requires parameters object')
    }

    this.log = log
    this.keywords = parameters.keywords
    this.urgent = parameters.urgent
    this.severe = parameters.severe
}

exports.CapParser = CapParser

CapParser.prototype.parse = function(input,error,success) {
    var self = this
    xml2js.parseString(input,{async: true},findRelevantWarnings)

    function findRelevantWarnings(err,result) {
        if(err) {
            self.log.error({err: err},"Parsing weather alert XML failed")
            return
        }
        // TODO: Sometimes this is called with undefined 'result'. Handle
        //       this case properly
        var entries = result.feed.entry
        if (!containsWarnings(entries)) {
            success([])
            return
        }

        var warnings = []
        for(var i=0; i < entries.length; i++) {
            var entry = entries[i]

            var type
            for(var j=0; j < self.keywords.length; j++) {
                var keyword = self.keywords[j]
                var eventElement = entry['cap:event'][0]
                if(eventElement.indexOf(keyword) > -1) {
                    type = keyword
                    break
                }
            }

            if (!Boolean(type)) {
                continue
            }

            var urgency = entry['cap:urgency'][0]
            var severity = entry['cap:severity'][0]

            warnings.push({
                type: type,
                urgent: self.urgent.indexOf(urgency) > -1,
                severe: self.severe.indexOf(severity) > -1
            })
         }

         success(warnings)
    }
}

// If given list of wheather entries contains warnings
function containsWarnings(entries) {
    // More than one entry means they are all warnings
    if (entries.length > 1) {
        return true;
    }

    // The singly entry may be a warning or a notification about lack of
    // warnings. The notification does not have any cap fields.
    return Boolean(entries[0]['cap:event']);
}
