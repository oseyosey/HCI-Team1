/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2) and connecting it to the openAI LLM GPT3.5-turbo
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * Please visit https://platform.openai.com/docs/guides/gpt for understanding how to use GPT
 * */
const Alexa = require('ask-sdk-core');
const {Configuration, OpenAIApi} = require('openai');
var gptTurboMessage =  [{role:"system", content: "As an AI nutritionist, your primary purpose is to understand the user's dietary needs and preferences. Users should be able to ask you questions about recipes, dietary advice, and nutritional information. Start by asking the user about their dietary restrictions, health goals, and specific food preferences. Gather this information, and once you've understood their needs, be prepared to provide recipes, dietary advice, and answer any questions they may have related to food and nutrition. Maintain a conversational approach, ask follow-up questions for clarity, and avoid unnecessary repetitions. Keep your responses under 25 words."}]; //Try to be brief when possible.
var gptTurboMessage_refined = [{role:"system", content: "As an AI nutritionist and cooking assistant, your primary purpose is to understand the user's dietary needs and preferences to assist them with cooking and recipe-related questions. Users should be able to ask you questions about recipes, dietary advice, and nutritional information. Start by asking the user about their dietary restrictions, health goals, and specific food preferences. When asking these questions, ask only one question at a time and wait for the user’s response to ask about the next topic. Gather this information, and once you've understood their needs, be prepared to provide recipes, dietary advice, and answer any questions they may have related to food and nutrition. If a user asks for a meal suggestions, do not give them the recipe right away, but prompt if they would like to hear the recipe. If the user says they are in the process of cooking and asks for the recipe, give the recipe to them in steps and ask if they are ready for the next step. Maintain a conversational approach, ask follow-up questions for clarity, and avoid unnecessary repetitions. If an ingredient has another name in parenthesis, avoid repeating it. Keep your responses under 20 words."}];
var gptTurboMessage_lightning = [{role:"system", content: "As an AI nutritionist and express cooking assistant, your primary role is to quickly discern the user's dietary needs and preferences, and promptly recommend a suitable recipe. Begin by asking the user about their dietary restrictions, health goals, and specific food preferences. Based on this brief interaction, offer a single recipe recommendation that aligns with their needs. Keep the conversation efficient and concise, focusing on key details. Limit your responses to under 20 words, and ensure that you provide the recipe in a straightforward manner without unnecessary repetitions."}];

const axios = require('axios');
const fs = require("fs");

const intro_hi = ["Hello! ", "Hi! ", "Hey! ", "Welcome! "]

const intro = ['How can I assist you today?', 'What do you wanna know?', 'What questions do you have?', 'What would you like to know?'  ];

const other = ['Any other questions for me?', 'What else can I help you with?', 'Anything else you\'d like to know?', 'Anything else?'];

const bye = ["Goodbye!", "Untill next time!", "Take care!", "Stay safe!", "Bye!", "Have a good one!"];

const fillers = ["checking that for you!", "searching!", "looking up!", "still fetching!", "Almost there!", "let me check!", "I'm on it!", "Hold on!", "still looking!"];

var location;

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const fs = require("fs");
        const index = Math.floor(Math.random() * 3);
        const index_hi = Math.floor(Math.random() * 3);
        const index2 = Math.floor(Math.random() * 3);
        const speakOutput = intro_hi[index_hi] + "Hello! I'm Foodie, your AI culinary companion here to inspire your next delicious creation."
        const reprompting = intro[index2];
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(reprompting)
            .getResponse();
    }
};


const GenericVisitIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GenericVisitIntent';
  },
  
  
  async handle(handlerInput) {
    const question = 'give me one option of something to do in '  +
            Alexa.getSlotValue(handlerInput.requestEnvelope, 'city');
    location = Alexa.getSlotValue(handlerInput.requestEnvelope, 'city');
    gptTurboMessage.push({role:"user", content:  question});

  
  const timeoutId = setTimeout(() => {
  console.log('API call not completed within 4 seconds. so sending a progressive call ');

    let progressiveApiResponsePromise = axios.post('https://api.amazonalexa.com/v1/directives', request, {
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Directive sent successfully!');
    })
    .catch(error => {
      console.error('Error sending directive:', error);
    });
    
},4000);


// make a POST API call to the OpenAI GPT-3.5 turbo endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const authToken = 'Bearer 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';
  const requestData = {
        model : 'gpt-3.5-turbo',
        messages: gptTurboMessage
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    //progressive call 
   
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

   
    const index_filler = Math.floor(Math.random() * 8);
    const repromptText = fillers[index_filler];
    
   
   const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText, //+ '<break time="5s"/>' + 'still looking',
    };
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

  try{
    const apiResponse = await apiResponsePromise;
    clearTimeout(timeoutId);
   
    const finalSpeech = ` ${apiResponse.data.choices[0].message.content}`;
    const index2 = Math.floor(Math.random() * 3);
    gptTurboMessage.push({role:apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
    return handlerInput.responseBuilder
      .speak(finalSpeech)
      .reprompt(other[index2])
      .getResponse();
}
catch (error){
    console.error(error);
    handlerInput.responseBuilder
      .speak('Something went wrong. I cannot connect to my base.');
}

  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const index_bye = Math.floor(Math.random() * 5);
        const speakOutput = bye[index_bye];

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .repromt(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Is there something else you would like to know?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.speak("An error has occured. I cannot reach the model. Please try again!").getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};





const AskChatGPTIntentHandlerLightning = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskChatGPTIntentLightning';
  },
  
  
  async handle(handlerInput) {
    const question = 
            Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
    gptTurboMessage_lightning.push({role:"user", content:  question});

  
  const timeoutId = setTimeout(() => {
  console.log('API call not completed within 4 seconds. so sending a progressive call ');

    let progressiveApiResponsePromise = axios.post('https://api.amazonalexa.com/v1/directives', request, {
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Directive sent successfully!');
    })
    .catch(error => {
      console.error('Error sending directive:', error);
    });
    
},4000);


   // make a POST API call to the OpenAI GPT-3.5 turbo endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const authToken = 'Bearer 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';
  const requestData = {
        model : 'gpt-4',
        messages: gptTurboMessage_lightning
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    //progressive call 
   
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

   
    const index_filler = Math.floor(Math.random() * 8);
    const repromptText = fillers[index_filler];
    
   
   const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText, //+ '<break time="5s"/>' + 'still looking',
    };
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

  try{
    const apiResponse = await apiResponsePromise;
    clearTimeout(timeoutId);
   
    const finalSpeech = ` ${apiResponse.data.choices[0].message.content}`;
    const index2 = Math.floor(Math.random() * 3);
    gptTurboMessage_lightning.push({role:apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
    return handlerInput.responseBuilder
      .speak(finalSpeech)
      .reprompt(other[index2])
      .getResponse();
}
catch (error){
    console.error(error);
    handlerInput.responseBuilder
      .speak('Something went wrong. I cannot connect to my base.');
}

  }
};

const AskChatGPTIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskChatGPTIntent';
  },
  
  
  async handle(handlerInput) {
    const question = 
            Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
    gptTurboMessage_refined.push({role:"user", content:  question});

  
  const timeoutId = setTimeout(() => {
  console.log('API call not completed within 4 seconds. so sending a progressive call ');

    let progressiveApiResponsePromise = axios.post('https://api.amazonalexa.com/v1/directives', request, {
      headers: {
        Authorization: `Bearer ${apiAccessToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('Directive sent successfully!');
    })
    .catch(error => {
      console.error('Error sending directive:', error);
    });
    
},4000);


   // make a POST API call to the OpenAI GPT-3.5 turbo endpoint
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const authToken = 'Bearer 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';
  const requestData = {
        model : 'gpt-4',
        messages: gptTurboMessage_refined
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    //progressive call 
   
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

   
    const index_filler = Math.floor(Math.random() * 8);
    const repromptText = fillers[index_filler];
    
   
   const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText, //+ '<break time="5s"/>' + 'still looking',
    };
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

  try{
    const apiResponse = await apiResponsePromise;
    clearTimeout(timeoutId);
   
    const finalSpeech = ` ${apiResponse.data.choices[0].message.content}`;
    const index2 = Math.floor(Math.random() * 3);
    gptTurboMessage_refined.push({role:apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
    return handlerInput.responseBuilder
      .speak(finalSpeech)
      .reprompt(other[index2])
      .getResponse();
}
catch (error){
    console.error(error);
    handlerInput.responseBuilder
      .speak('Something went wrong. I cannot connect to my base.');
}

  }
};


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
 
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GenericVisitIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        AskChatGPTIntentHandler,
        AskChatGPTIntentHandlerLightning,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();
