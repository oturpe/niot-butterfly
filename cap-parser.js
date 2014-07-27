// CAP message parser that parses input xml and adds found warnings
// to given output list. Parameters are as follows:
//
//     keywords: a list of keywords to match with 'cap:event' field. Only events
//               matching at least one of them are included in output. Event
//               type in output is set to first match in this list.
//     urgent: list of strings that are matched to 'cap:urgency' field. The
//             event is flagged urgent if at least one matches.
//     severe: list of strings that are matched to 'cap:severity' field. The
//             event is flagged severe if at least one matches.
'use strict'

var xml2js = require('xml2js')

exports.parse = function parse(input,output,parameters) {
    xml2js.parseString(input,findRelevantWarnings)

    function findRelevantWarnings(err,result) {
        var entries = result.feed.entry
        var entry
        if (!containsWarnings(entries)) {
            return
        }

        for(var i=0; i < entries.length; i++) {
            entry = entries[i]

            var type
            for(var j=0; j < parameters.keywords.length; j++) {
                var keyword = parameters.keywords[j]
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

            output.push({
                type: type,
                urgent: parameters.urgent.indexOf(urgency) > -1,
                severe: parameters.severe.indexOf(severity) > -1
            })
         }
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
