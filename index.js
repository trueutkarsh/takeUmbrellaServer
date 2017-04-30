'use strict';
var http = require('http');

var Alexa = require('alexa-sdk');

var weather = require('openweather-apis');
var Weather_API_Key = "eb515ea10e79da5f7fee0c99e469b1df"
weather.setLang('en');
weather.setAPPID(Weather_API_Key);

var APP_ID = "amzn1.ask.skill.736bfd90-2db5-4557-9fec-eea844da1db2";
//OPTIONAL: replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]";
var SKILL_NAME = 'Take Umbrella';
// obtain those from the echo device 
// var Device_ID = "";
// var Consent_Token = "";
var CURRENT_CITY = "";
var FOLLOW_UP = false;




var speechOutput = "";

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


// write function to get umbrella status 
function getWeatherData(options, callback) {
    var result = {
        "status": "",
        "rain": ""
    }

    // weather.setCity(CITY);
    weather.getSmartJSON(function(err, JSONObj) {
        if (err) {
            console.log("error", err);
            result.status = -1;
        } else {
            console.log("response", JSONObj);
            result.status = JSONObj.description;
            result.rain = JSONObj.rain;
        }

        callback(result);
    });


};


var handlers = {
    'LaunchRequest': function() {
        this.emit('TakeUmbrellaOrNot');
    },
    'TakeUmbrellaOrNot': function() {
        // Get information about weather in her location 
        // deviceId = this.event.context.System.device.deviceId
        // consentToken = this.event.context.System.user.permissions.consentToken

        // no city provided

        if (this.event.request.intent.slots.current_city.hasOwnProperty("value")) {
            CURRENT_CITY = this.event.request.intent.slots.current_city.value;
        } else {
            if (CURRENT_CITY === "") {
                FOLLOW_UP = true;
                speechOutput = "But which city are you in right now ?";
                this.emit(':ask', speechOutput, "Sorry. I didn't get your city.");
            }
        }


        // set options parameters
        weather.setCity(CURRENT_CITY);
        var wthrpath = "/data/2.5/forecast/daily?q=" + CURRENT_CITY + "&APPID=" + Weather_API_Key + "&cnt=1"
        var options = {
            host: 'api.openweathermap.org',
            path: wthrpath,
            method: 'GET'
        };


        var self = this;
        getWeatherData(options, function(carryUmbrella) {
            // Create speech output
            console.log("carryUmbrella", carryUmbrella);
            if (carryUmbrella.status == -1) {
                speechOutput = "Invalid City. Please tell your city correctly."
            } else {
                if (carryUmbrella.rain > 0 || carryUmbrella.status.indexOf("rain") > -1) {
                    speechOutput = "Please carry your umbrella outside today." + carryUmbrella.status + " is expected."
                } else {
                    speechOutput = "Don't worry about umbrella today. The weather outside is " + carryUmbrella.status

                }
            }

            self.emit(':tellWithCard', speechOutput, SKILL_NAME)
        });

    },
    'SetCity': function() {

        CURRENT_CITY = this.event.request.intent.slots.city.value;
        if (FOLLOW_UP) {
            FOLLOW_UP = false;
            this.emit('TakeUmbrellaOrNot');
        } else {
            this.emit(':tell', 'Cool !');
        }

    },
    'AMAZON.HelpIntent': function() {
        var speechOutput = "You can ask me about carrying umbrella outside today, or, you can say exit... What can I help you with?";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', 'Goodbye!');
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', 'Goodbye!');
    }
};