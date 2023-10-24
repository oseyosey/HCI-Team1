/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2) and connecting it to the openAI LLM GPT3.5-turbo
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * Please visit https://platform.openai.com/docs/guides/gpt for understanding how to use GPT
 * */
const Alexa = require('ask-sdk-core');
const {Configuration, OpenAIApi} = require('openai');
var gptTurboMessage =  [{role:"system", content: "As an AI voice assistant based on ChatGPT, your primary purpose is to engage in conversations with users about recipe recommendation. You should keep your response under 50 words."}]; //Try to be brief when possible.
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
        const speakOutput = intro_hi[index_hi] + "Welcome. My name is Foody! I am an recepe assistant when you need any advice on making food."
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

const ExerciseRecommendationIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ExerciseRecommendationIntent';
  },
  
  async handle(handlerInput) {
    const exerciseType = Alexa.getSlotValue(handlerInput.requestEnvelope, 'exerciseType') || '';
    const question = `What's a good ${exerciseType} workout? Please give me a concrete routine.`;
    gptTurboMessage.push({ role: "user", content: question });

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
      
}, 10000);

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
    
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const index_filler = Math.floor(Math.random() * 8);
    const repromptText = fillers[index_filler];
    
    const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText,
    };
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

    try {
      const apiResponse = await apiResponsePromise;
      clearTimeout(timeoutId);
      
      const finalSpeech = `${apiResponse.data.choices[0].message.content}.`;
      const index2 = Math.floor(Math.random() * 3);
      gptTurboMessage.push({role:apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
      
      return handlerInput.responseBuilder
        .speak(finalSpeech)
        .reprompt(other[index2])
        .getResponse();
    } 
    catch (error) {
      console.error(error);
      handlerInput.responseBuilder
        .speak('Something went wrong. I cannot connect to my base.');
    }
  }
};

const CreateWorkoutPlanIntentHandler = {
  canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateWorkoutPlanIntent';
    },
   async handle(handlerInput) {
        const duration = Alexa.getSlotValue(handlerInput.requestEnvelope, 'duration');
        const workoutType = Alexa.getSlotValue(handlerInput.requestEnvelope, 'workoutType');
        const frequency = Alexa.getSlotValue(handlerInput.requestEnvelope, 'frequency');

        const question = `Creating a ${workoutType} workout plan for ${duration} minutes, ${frequency} days a week. Stay fit and have fun!`;
    gptTurboMessage.push({ role: "user", content: question });

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
      
}, 10000);

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
    
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const index_filler = Math.floor(Math.random() * 8);
    const repromptText = fillers[index_filler];
    
    const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText,
    };
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

    try {
      const apiResponse = await apiResponsePromise;
      clearTimeout(timeoutId);
      
      const finalSpeech = `${apiResponse.data.choices[0].message.content}.`;
      const index2 = Math.floor(Math.random() * 3);
      gptTurboMessage.push({role:apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
      
      return handlerInput.responseBuilder
        .speak(finalSpeech)
        .reprompt(other[index2])
        .getResponse();
    } 
    catch (error) {
      console.error(error);
      handlerInput.responseBuilder
        .speak('Something went wrong. I cannot connect to my base.');
    }
  }
};

const WorkoutDurationIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutDurationIntent';
  },
  
  async handle(handlerInput) {
    const userInput = Alexa.getInputText(handlerInput.requestEnvelope) || 'How long should I workout?';
    let gptTurboMessage = [{role:"user", content: userInput}];

    const timeoutId = setTimeout(() => {
      console.log('API call not completed within 4 seconds. Sending a progressive response...');

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
      
    }, 10000);

    // Making a POST API call to the OpenAI GPT-3.5 turbo endpoint
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const authToken = 'Bearer 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';
    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: gptTurboMessage
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const fillers = [
      'Let me think...', 
      'One moment...',
      'Checking the best duration...', 
      //... add more fillers as needed
    ];
    
    const index_filler = Math.floor(Math.random() * fillers.length);
    const repromptText = fillers[index_filler];
    
    const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText,
    };
    
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

    try {
      const apiResponse = await apiResponsePromise;
      clearTimeout(timeoutId);

      const finalSpeech = apiResponse.data.choices[0].message.content;
      gptTurboMessage.push({role: apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
      
      return handlerInput.responseBuilder
        .speak(finalSpeech)
        .reprompt(finalSpeech)
        .getResponse();
    } catch (error) {
      console.error(error);
      return handlerInput.responseBuilder
        .speak('Sorry, I had an issue providing a workout duration recommendation. Please try again later.')
        .getResponse();
    }
  }
};

const WorkoutTipIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'WorkoutTipIntent';
  },
  
  async handle(handlerInput) {
    const bodyPart = Alexa.getSlotValue(handlerInput.requestEnvelope, 'bodyPart') || '';
    const question = bodyPart ? `Give me a workout tip for ${bodyPart}` : 'Give me a workout tip';
    let gptTurboMessage = [{role:"user", content: question}];

    const timeoutId = setTimeout(() => {
      console.log('API call not completed within 4 seconds. Sending a progressive response...');

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
      
    }, 10000);

    // Making a POST API call to the OpenAI GPT-3.5 turbo endpoint
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const authToken = 'Bearer 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';
    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: gptTurboMessage
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const fillers = [
      'Let me think...', 
      'One moment...',
      'Checking for some tips...', 
      //... add more fillers as needed
    ];
    
    const index_filler = Math.floor(Math.random() * fillers.length);
    const repromptText = fillers[index_filler];
    
    const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText,
    };
    
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

    try {
      const apiResponse = await apiResponsePromise;
      clearTimeout(timeoutId);

      const finalSpeech = apiResponse.data.choices[0].message.content;
      gptTurboMessage.push({role: apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
      
      return handlerInput.responseBuilder
        .speak(finalSpeech)
        .reprompt(finalSpeech)
        .getResponse();
    } catch (error) {
      console.error(error);
      return handlerInput.responseBuilder
        .speak('Sorry, I had an issue getting a workout tip for you. Please try again later.')
        .getResponse();
    }
  }
};



const ExerciseDetailIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ExerciseDetailIntent';
    },
  
  
  async handle(handlerInput) {
      const exercise = Alexa.getSlotValue(handlerInput.requestEnvelope, 'exercise');
        /*if (!exercise) {
            return handlerInput.responseBuilder
                .speak('Sorry, I didn\'t catch the exercise name. Can you please specify the exercise you want to know about?')
                .reprompt('Which exercise do you want to learn about?')
                .getResponse();
        }*/

    const question = `Tell me about how to properly do ${exercise} with correct form.`;
    let gptTurboMessage = [{role:"user", content: question}];

    const timeoutId = setTimeout(() => {
      console.log('API call not completed within 4 seconds. Sending a progressive response...');

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
      
    }, 20000);

    // Making a POST API call to the OpenAI GPT-3.5 turbo endpoint
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    const authToken = 'Bearer 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';
    const requestData = {
      model: 'gpt-3.5-turbo',
      messages: gptTurboMessage
    };
    
    let apiResponsePromise = axios.post(apiUrl, requestData, {
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json',
      },
    });
    
    // Get the API access token and request ID
    const apiAccessToken = handlerInput.requestEnvelope.context.System.apiAccessToken;
    const requestId = handlerInput.requestEnvelope.request.requestId;

    const fillers = [
      'Let me think...', 
      'One moment...',
      'Checking for some tips...', 
      //... add more fillers as needed
    ];
    
    const index_filler = Math.floor(Math.random() * fillers.length);
    const repromptText = fillers[index_filler];
    
    const directive = {
      type: 'VoicePlayer.Speak',
      speech: repromptText,
    };
    
    const request = {
      header: {
        requestId: requestId
      },
      directive: directive
    };

    try {
      const apiResponse = await apiResponsePromise;
      clearTimeout(timeoutId);

      const finalSpeech = apiResponse.data.choices[0].message.content;
      gptTurboMessage.push({role: apiResponse.data.choices[0].message.role, content: apiResponse.data.choices[0].message.content});
      
      return handlerInput.responseBuilder
        .speak(finalSpeech)
        .reprompt(finalSpeech)
        .getResponse();
    } catch (error) {
      console.error(error);
      return handlerInput.responseBuilder
        .speak('Sorry, I had an issue getting a workout tip for you. Please try again later.')
        .getResponse();
    }
  }
};


const TrackProgressIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TrackProgressIntent';
    },
    handle(handlerInput) {
        const exerciseDone = Alexa.getSlotValue(handlerInput.requestEnvelope, 'exerciseDone');
        const duration = Alexa.getSlotValue(handlerInput.requestEnvelope, 'duration');

        const speechText = `Great! I've logged that you did ${exerciseDone} for ${duration}. Keep up the good work!`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};


const DestinationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DestinationIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'What type of activity would you like to do?';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const FoodIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FoodIntent';
  },
  
  async handle(handlerInput) {
    const food = Alexa.getSlotValue(handlerInput.requestEnvelope, 'food') || '';
    const restaurant = Alexa.getSlotValue(handlerInput.requestEnvelope, 'foodestablishment') || '';
    const question = 'find me ' + food + restaurant + ' food in ' + location;
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
   
    const finalSpeech = ` ${apiResponse.data.choices[0].message.content}.`;
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

const ArtIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ArtIntent';
  },
  
  
  async handle(handlerInput) {
    const musicevent = Alexa.getSlotValue(handlerInput.requestEnvelope, 'musicevent') || '';
    const musicvenue = Alexa.getSlotValue(handlerInput.requestEnvelope, 'musicvenue') || '';
    const theater = Alexa.getSlotValue(handlerInput.requestEnvelope, 'theater') || '';
    const festival = Alexa.getSlotValue(handlerInput.requestEnvelope, 'festival') || '';
    const question = 'find me ' + musicevent + musicvenue + theater + festival + ' performance in ' + location;
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

const TimeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TimeIntent';
    },
    handle(handlerInput) {
        const speakOutput = (Math.floor(Math.random() * 8) + 4) + ':00 is when it begins!';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const ReviewIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReviewIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'It has a ' + (Math.floor(Math.random() * 3) + 2) + ' out of five star rating!';
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const LocationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LocationIntent';
    },
    handle(handlerInput) {
        location = Alexa.getSlotValue(handlerInput.requestEnvelope, 'location');
        const speakOutput = 'Okay, I have you located in ' + location + '. Let\'s get started!' ;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const SportIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SportIntent';
  },
  
  
  async handle(handlerInput) {
    const sport = Alexa.getSlotValue(handlerInput.requestEnvelope, 'sport') || '';
    const sportevent = Alexa.getSlotValue(handlerInput.requestEnvelope, 'sportevent') || '';
    const question = 'find me ' + sport + sportevent + ' game in ' + location;
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

const TouristIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TouristIntent';
  },
  
  
  async handle(handlerInput) {
    const event = Alexa.getSlotValue(handlerInput.requestEnvelope, 'event') || '';
    const landmarks = Alexa.getSlotValue(handlerInput.requestEnvelope, 'landmarks') || '';
    const localbusiness = Alexa.getSlotValue(handlerInput.requestEnvelope, 'localbusiness') || '';
    const localbusinesstype = Alexa.getSlotValue(handlerInput.requestEnvelope, 'localbusinesstype') || '';
    const organization = Alexa.getSlotValue(handlerInput.requestEnvelope, 'organization') || '';
    const question = 'find me ' + event + landmarks + localbusiness + localbusinesstype + organization + ' tourism in ' + location;
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

const AskChatGPTIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskChatGPTIntent';
  },
  
  
  async handle(handlerInput) {
    const question = 
            Alexa.getSlotValue(handlerInput.requestEnvelope, 'question');
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

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
 
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        GenericVisitIntentHandler,
        ExerciseRecommendationIntentHandler,
        WorkoutDurationIntentHandler,
        WorkoutTipIntentHandler,
        CreateWorkoutPlanIntentHandler,
        ExerciseDetailIntentHandler,
        TrackProgressIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        AskChatGPTIntentHandler,
        DestinationIntentHandler,
        FoodIntentHandler,
        ArtIntentHandler,
        TimeIntentHandler,
        ReviewIntentHandler,
        LocationIntentHandler,
        SportIntentHandler,
        TouristIntentHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();